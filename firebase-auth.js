// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAW_sSUmVdH3MbWnTZqAJ7u_AAb23kl630",
  authDomain: "thepost24-fa886.firebaseapp.com",
  projectId: "thepost24-fa886",
  storageBucket: "thepost24-fa886.firebasestorage.app",
  messagingSenderId: "1090376509267",
  appId: "1:1090376509267:web:03e5cf510b34a68f3da3a6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function applyDarkModePreference(isDarkMode) {
  document.body.classList.toggle('dark-mode', isDarkMode);
  document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
  localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
}

function loadUserSettings(email, legacySettings = null) {
  const settingsRef = db.collection('userSettings').doc(email);
  return settingsRef.get()
    .then((settingsDoc) => {
      if (settingsDoc.exists) {
        if (legacySettings) {
          return db.collection('users').doc(email)
            .update({ settings: firebase.firestore.FieldValue.delete() })
            .catch((error) => {
              console.error('Error removing legacy user settings:', error);
            })
            .then(() => settingsDoc.data());
        }
        return settingsDoc.data();
      }

      if (legacySettings && Object.keys(legacySettings).length > 0) {
        return settingsRef.set(legacySettings)
          .then(() => db.collection('users').doc(email)
            .update({ settings: firebase.firestore.FieldValue.delete() }))
          .then(() => legacySettings)
          .catch((error) => {
            console.error('Error migrating user settings:', error);
            return legacySettings;
          });
      }

      return {};
    })
    .then((settings) => {
      if (typeof settings.darkMode === 'boolean') {
        applyDarkModePreference(settings.darkMode);
      }
    })
    .catch((error) => {
      console.error('Error loading user settings:', error);
    });
}

function syncPublicProfile(user, profileData) {
  const publicProfile = {
    email: user.email,
    name: profileData.name || user.displayName || 'User'
  };
  const photo = profileData.photo || user.photoURL;
  if (photo) publicProfile.photo = photo;
  if (profileData.createdAt) publicProfile.createdAt = profileData.createdAt;

  return db.collection('publicProfiles').doc(user.email).set(publicProfile, { merge: true })
    .catch((error) => {
      console.error('Error syncing public profile:', error);
    });
}

const localDarkModePreference = localStorage.getItem('darkMode');
if (localDarkModePreference === 'enabled' || localDarkModePreference === 'disabled') {
  document.body.classList.toggle('dark-mode', localDarkModePreference === 'enabled');
  document.documentElement.dataset.theme = localDarkModePreference === 'enabled' ? 'dark' : 'light';
}

// Current user data with role
let currentUserData = null;

// Google Sign-In Function
function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Mobile: Use redirect
    console.log("📱 Mobile detected - using redirect");
    auth.signInWithRedirect(provider)
      .catch((error) => {
        console.error("❌ Redirect sign-in error:", error);
        alert("Login failed: " + error.message);
      });
  } else {
    // Desktop: Use popup
    console.log("💻 Desktop detected - using popup");
    auth.signInWithPopup(provider)
      .then((result) => {
        console.log("✅ Popup login successful:", result.user.email);
      })
      .catch((error) => {
        console.error("❌ Popup error:", error.message);
        alert("Login failed: " + error.message);
      });
  }
}

// Check if user exists in database, create if not
function checkAndCreateUser(user) {
  console.log("🔍 Checking user in database:", user.email);
  
  db.collection('users').doc(user.email).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        window.userSettingsReady = loadUserSettings(user.email, userData.settings);
        syncPublicProfile(user, userData);

        currentUserData = {
          name: userData.name || user.displayName,
          email: user.email,
          photo: userData.photo || user.photoURL,
          uid: user.uid,
          role: userData.role || 'user'
        };
        window.currentUser = currentUserData;
        console.log("✅ User role:", currentUserData.role);
        updateUI(user, currentUserData.role);
      } else {
        console.log("🆕 Creating new user...");
        const createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const batch = db.batch();
        batch.set(db.collection('users').doc(user.email), {
          name: user.displayName || 'User',
          email: user.email,
          role: 'user',
          createdAt
        });
        batch.set(db.collection('publicProfiles').doc(user.email), {
          name: user.displayName || 'User',
          email: user.email,
          ...(user.photoURL ? { photo: user.photoURL } : {}),
          createdAt
        });
        batch.commit()
        .then(() => {
          currentUserData = {
            name: user.displayName || 'User',
            email: user.email,
            photo: user.photoURL,
            uid: user.uid,
            role: 'user'
          };
          window.currentUser = currentUserData;
          window.userSettingsReady = loadUserSettings(user.email);
          console.log("✅ New user created");
          updateUI(user, 'user');
        })
        .catch((error) => {
          console.error("❌ Error creating user:", error);
        });
      }
    })
    .catch((error) => {
      console.error("❌ Error checking user:", error);
    });
}

// Sign Out Function
async function signOut() {
  const confirmLogout = await window.appPopup.confirm("Are you sure you want to log out?", {
    title: "Sign out",
    confirmLabel: "Sign out"
  });
  
  if (confirmLogout) {
    auth.signOut().then(() => {
      console.log("✅ User signed out");
      currentUserData = null;
      window.currentUser = null;
      updateUI(null, null);
      window.location.href = 'index.html';
    });
  }
}

// Update UI based on login state and role
function updateUI(user, role) {
  const loggedIn = document.getElementById('user-logged-in');
  const loggedOut = document.getElementById('user-logged-out');
  const userName = document.getElementById('user-name');
  const userPhoto = document.getElementById('user-photo');
  const adminMenuItems = document.querySelectorAll('.admin-only');

  if (user && role) {
    loggedIn.style.display = 'block';
    loggedOut.style.display = 'none';
    
    userName.replaceChildren(
      document.createTextNode(currentUserData?.name || user.displayName || 'User'),
      document.createElement('br')
    );
    const roleBadgeElement = document.createElement('span');
    roleBadgeElement.className = `user-role-badge role-${role}`;
    roleBadgeElement.textContent = role === 'superadmin' ? 'Superadmin' : role === 'admin' ? 'Admin' : 'User';
    userName.appendChild(roleBadgeElement);
    userPhoto.src = currentUserData?.photo || user.photoURL || '';
    
    if (role === 'superadmin' || role === 'admin') {
      adminMenuItems.forEach(item => item.style.display = 'block');
    } else {
      adminMenuItems.forEach(item => item.style.display = 'none');
    }

    window.currentUser = currentUserData;
    
  } else {
    loggedIn.style.display = 'none';
    loggedOut.style.display = 'block';
    window.currentUser = null;
    adminMenuItems.forEach(item => item.style.display = 'none');
  }
}

window.updateCurrentUserProfile = function (profile) {
  if (!currentUserData) return;
  currentUserData = { ...currentUserData, ...profile };
  window.currentUser = currentUserData;
  if (auth.currentUser) updateUI(auth.currentUser, currentUserData.role);
};

// Handle redirect result IMMEDIATELY when page loads
auth.getRedirectResult()
  .then((result) => {
    if (result && result.user) {
      console.log("🎉 Redirect successful! User:", result.user.email);
    } else {
      console.log("ℹ️ No redirect (normal page load)");
    }
  })
  .catch((error) => {
    console.error("❌ Redirect error:", error);
    if (error.code !== 'auth/popup-closed-by-user') {
      alert("Login failed: " + error.message);
    }
  })
  .finally(() => {
    // AFTER handling redirect, listen for auth changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("👤 Auth state: User logged in -", user.email);
        checkAndCreateUser(user);
      } else {
        console.log("👤 Auth state: No user");
        window.currentUser = null;
        updateUI(null, null);
      }
    });
  });