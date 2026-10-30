// settings.js
document.addEventListener('DOMContentLoaded', () => {
    
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeSidebar = document.querySelector('.close-sidebar');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Load user settings
    waitForUser(loadSettings);
});

function loadSettings() {
    if (!window.currentUser) {
        document.getElementById('settings-content').innerHTML = `
            <div class="settings-error">
                <h2>🔒 Please Login</h2>
                <p>You need to be logged in to access settings.</p>
                <button onclick="googleSignIn()" class="btn btn-primary" style="margin-top: 20px;">
                    Sign in with Google
                </button>
            </div>
        `;
        return;
    }

    // Load user's settings from Firestore
    Promise.resolve(window.userSettingsReady)
        .then(() => firebase.firestore().collection('userSettings').doc(window.currentUser.email).get())
        .then((doc) => {
            const settings = doc.exists ? doc.data() : {};
            const darkModeEnabled = typeof settings.darkMode === 'boolean'
                ? settings.darkMode
                : localStorage.getItem('darkMode') === 'enabled';
            
            // Apply saved settings to toggles
            document.getElementById('email-notifications').checked = settings.emailNotifications !== false;
            document.getElementById('push-notifications').checked = settings.pushNotifications !== false;
            document.getElementById('newsletter').checked = settings.newsletter !== false;
            document.getElementById('dark-mode').checked = darkModeEnabled;
            applyDarkMode(darkModeEnabled);
            document.getElementById('auto-play').checked = settings.autoPlay !== false;
            
            const language = settings.language || 'en';
            document.getElementById('language').value = language;
            
            const privacy = settings.privacy || 'public';
            document.getElementById('privacy').value = privacy;
        })
        .catch((error) => {
            console.error('Error loading settings:', error);
        });

    // Initialize all event listeners
    initSettingsEventListeners();
}

function initSettingsEventListeners() {
    // Notification toggles
    document.getElementById('email-notifications').addEventListener('change', (e) => {
        saveSettingToggle('emailNotifications', e.target.checked);
    });

    document.getElementById('push-notifications').addEventListener('change', (e) => {
        saveSettingToggle('pushNotifications', e.target.checked);
    });

    document.getElementById('newsletter').addEventListener('change', (e) => {
        saveSettingToggle('newsletter', e.target.checked);
    });

    // Appearance toggles
document.getElementById('dark-mode').addEventListener('change', (e) => {
    const isDarkMode = e.target.checked;
    applyDarkMode(isDarkMode);
    saveSettingToggle('darkMode', isDarkMode);
});

    document.getElementById('auto-play').addEventListener('change', (e) => {
        saveSettingToggle('autoPlay', e.target.checked);
    });

    // Language selector
    document.getElementById('language').addEventListener('change', (e) => {
        saveSettingToggle('language', e.target.value);
        showMessage('✅ Language preference saved!', 'success');
    });

    // Privacy selector
    document.getElementById('privacy').addEventListener('change', (e) => {
        saveSettingToggle('privacy', e.target.value);
        showMessage('✅ Privacy setting updated!', 'success');
    });

    // Clear cache button
    document.getElementById('clear-cache-btn').addEventListener('click', async () => {
        if (await window.appPopup.confirm('Are you sure you want to clear cache? This will refresh the page.', {
            title: 'Clear cache',
            type: 'warning',
            confirmLabel: 'Clear cache'
        })) {
            const darkModePreference = localStorage.getItem('darkMode');
            localStorage.clear();
            if (darkModePreference !== null) {
                localStorage.setItem('darkMode', darkModePreference);
            }
            sessionStorage.clear();
            showMessage('✅ Cache cleared!', 'success');
            waitForUser(() => location.reload());
        }
    });

    // Delete account button
    document.getElementById('delete-account-btn').addEventListener('click', async () => {
        const confirmation = await window.appPopup.prompt('This will permanently delete your account. Type "DELETE" to confirm:', {
            title: 'Delete account',
            type: 'warning',
            label: 'Type DELETE to confirm',
            placeholder: 'DELETE',
            confirmLabel: 'Continue'
        });
        if (confirmation === 'DELETE') {
            deleteAccount();
        } else if (confirmation !== null) {
            showMessage('❌ Account deletion cancelled.', 'info');
        }
    });
}

function saveSettingToggle(settingName, value) {
    if (!window.currentUser) return;

    const userRef = firebase.firestore().collection('userSettings').doc(window.currentUser.email);
    
    userRef.set({ [settingName]: value }, { merge: true })
    .then(() => {
        console.log(`Setting ${settingName} saved:`, value);
        showMessage('✅ Setting saved!', 'success');
    })
    .catch((error) => {
        console.error('Error saving setting:', error);
        showMessage('❌ Error saving setting.', 'error');
    });
}

function deleteAccount() {
    if (!window.currentUser) return;

    const db = firebase.firestore();
    const batch = db.batch();
    batch.delete(db.collection('users').doc(window.currentUser.email));
    batch.delete(db.collection('userSettings').doc(window.currentUser.email));
    batch.delete(db.collection('publicProfiles').doc(window.currentUser.email));

    batch.commit()
        .then(() => {
            showMessage('✅ Account deleted successfully. Logging out...', 'success');
            setTimeout(() => {
                firebase.auth().signOut();
                window.location.href = 'index.html';
            }, 2000);
        })
        .catch((error) => {
            console.error('Error deleting account:', error);
            showMessage('❌ Error deleting account: ' + error.message, 'error');
        });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('settings-message');
    messageDiv.textContent = text;
    messageDiv.className = `settings-message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

function applyDarkMode(isDarkMode) {
    applyDarkModePreference(isDarkMode);
}

// Check and apply dark mode on page load
function checkDarkModeOnLoad() {
    const darkModeSetting = localStorage.getItem('darkMode');
    if (darkModeSetting === 'enabled') {
        document.body.classList.add('dark-mode');
    }
}

// Call this when page loads
checkDarkModeOnLoad();

function waitForUser(callback) {
    if (window.currentUser !== undefined) {
        // User data is loaded (could be null or object)
        callback();
    } else {
        // Wait and check again
        setTimeout(() => waitForUser(callback), 100);
    }
}