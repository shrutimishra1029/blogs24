// profile.js
document.addEventListener('DOMContentLoaded', () => {

    // Check dark mode
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    
    // Hamburger Sidebar
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeSidebar = document.querySelector('.close-sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Mobile Menu Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Sidebar Functions
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

    // Load user profile data - wait for Firebase auth to load
    waitForUser(loadProfileData);
});

function loadProfileData() {
    console.log('loadProfileData called, currentUser:', window.currentUser); // Debug
    
    if (!window.currentUser) {
        // Not logged in - show placeholder
        document.getElementById('profile-name-display').textContent = 'Guest User';
        document.getElementById('profile-email-display').textContent = 'Please log in to view your profile';
        return;
    }
    
    const user = window.currentUser;
    
    console.log('Loading profile for user:', user.email); // Debug
    
    // Update profile image
    if (user.photo) {
        document.getElementById('profile-pic').src = user.photo;
    }
    
    // Update name displays
    document.getElementById('profile-name-display').textContent = user.name || 'User';
    document.getElementById('profile-name-full').textContent = user.name || 'Not available';
    
    // Update email displays
    document.getElementById('profile-email-display').textContent = user.email || '';
    document.getElementById('profile-email-full').textContent = user.email || 'Not available';
    
    // Update role displays
    const role = user.role || 'user';
    document.getElementById('profile-role-full').textContent = role.charAt(0).toUpperCase() + role.slice(1);
    
    // Update role badge
    const roleBadge = document.getElementById('profile-role-badge');
    roleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    roleBadge.className = `user-role-badge role-${role}`;
    
    
    
    // Load user statistics
    loadUserStats(user.email);
}

function loadUserStats(email) {
    if (!email) {
        console.error('No email provided to loadUserStats');
        return;
    }
    
    console.log('Loading stats for email:', email); // Debug
    
    // Count liked blogs
    firebase.firestore().collection('news')
        .where('likes', 'array-contains', email)
        .get()
        .then((snapshot) => {
            console.log('Liked blogs found:', snapshot.size); // Debug
            const likedElement = document.getElementById('liked-count');
            if (likedElement) {
                likedElement.textContent = snapshot.size;
            } else {
                console.error('liked-count element not found');
            }
        })
        .catch((error) => {
            console.error('Error loading liked blogs:', error);
        });
    
    // Count bookmarked blogs
    firebase.firestore().collection('news')
        .where('bookmarks', 'array-contains', email)
        .get()
        .then((snapshot) => {
            console.log('Bookmarked blogs found:', snapshot.size); // Debug
            const bookmarkedElement = document.getElementById('bookmarked-count');
            if (bookmarkedElement) {
                bookmarkedElement.textContent = snapshot.size;
            } else {
                console.error('bookmarked-count element not found');
            }
        })
        .catch((error) => {
            console.error('Error loading bookmarked blogs:', error);
        });
    
    // Count comments
    firebase.firestore().collection('news')
        .get()
        .then((snapshot) => {
            let commentCount = 0;
            snapshot.forEach((doc) => {
                const comments = doc.data().comments || [];
                const userComments = comments.filter(c => c.email === email);
                commentCount += userComments.length;
                if (userComments.length > 0) {
                    console.log('Found', userComments.length, 'comments in blog:', doc.id); // Debug
                }
            });
            console.log('Total comments found:', commentCount); // Debug
            const commentsElement = document.getElementById('comments-count');
            if (commentsElement) {
                commentsElement.textContent = commentCount;
            } else {
                console.error('comments-count element not found');
            }
        })
        .catch((error) => {
            console.error('Error loading comments:', error);
        });
}

function waitForUser(callback) {
    let attempts = 0;
    const check = setInterval(() => {
        attempts++;
        if (window.currentUser !== undefined || attempts > 30) {
            clearInterval(check);
            callback();
        }
    }, 100);
}
