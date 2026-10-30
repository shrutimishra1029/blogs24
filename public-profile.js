// public-profile.js - Display other users' public profiles
document.addEventListener('DOMContentLoaded', () => {
    
    // Get user email from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get('email');
    
    if (!userEmail) {
        showError('No user specified');
        return;
    }
    
    // Load user profile
    loadUserProfile(userEmail);
});

function loadUserProfile(email) {
    const profileContent = document.getElementById('profile-content');
    
    // Fetch only the fields intended to be public.
    firebase.firestore().collection('publicProfiles').doc(email).get()
        .then((doc) => {
            if (!doc.exists) {
                // User not in database, show basic info
                displayBasicProfile(email);
                return;
            }
            
            const userData = doc.data();
            displayFullProfile(email, userData);
        })
        .catch((error) => {
            console.error('Error loading profile:', error);
            showError('Error loading profile');
        });
}

function displayFullProfile(email, userData) {
    const profileContent = document.getElementById('profile-content');
    const safeEmail = escapeHtml(email);
    const safeName = escapeHtml(userData.name || 'User');
    const safePhoto = escapeHtml(userData.photo || 'https://via.placeholder.com/150/cccccc/666666?text=User');
    const memberSince = userData.createdAt
        ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString()
        : 'Recently';
    
    profileContent.innerHTML = `
        <div class="profile-card">
            <div class="profile-banner"></div>
            
            <div class="profile-main">
                <div class="profile-image-container">
                    <img src="${safePhoto}" alt="Profile" class="profile-image-large">
                    <div class="profile-status online"></div>
                </div>
                
                <div class="profile-info-header">
                    <h2 class="profile-username">${safeName}</h2>
                    <p class="profile-email-text">${safeEmail}</p>
                </div>
            </div>
            
            <div class="profile-stats" id="user-stats">
                <div class="stat-item">
                    <div class="stat-number" id="articles-count">0</div>
                    <div class="stat-label">Articles Published</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="likes-count">0</div>
                    <div class="stat-label">Articles Liked</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="comments-count">0</div>
                    <div class="stat-label">Comments Posted</div>
                </div>
            </div>
            
            <div class="profile-details-section">
                <h3>About</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-icon">👤</span>
                        <div class="info-content">
                            <div class="info-label">Name</div>
                            <div class="info-value">${safeName}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-icon">📅</span>
                        <div class="info-content">
                            <div class="info-label">Member Since</div>
                            <div class="info-value">${memberSince}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-icon">⚡</span>
                        <div class="info-content">
                            <div class="info-label">Status</div>
                            <div class="info-value status-active">Active</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-articles-section" id="user-articles">
                <h3>Published Articles</h3>
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Loading blogs...</p>
                </div>
            </div>
        </div>
    `;
    
    // Load user stats and blogs
    loadUserStats(email);
    loadUserArticles(email);
}

function displayBasicProfile(email) {
    const profileContent = document.getElementById('profile-content');
    const safeEmail = escapeHtml(email);
    const safeName = escapeHtml(email.split('@')[0]);
    
    profileContent.innerHTML = `
        <div class="profile-card">
            <div class="profile-banner"></div>
            
            <div class="profile-main">
                <div class="profile-image-container">
                    <img src="https://via.placeholder.com/150/cccccc/666666?text=User" alt="Profile" class="profile-image-large">
                </div>
                
                <div class="profile-info-header">
                    <h2 class="profile-username">${safeName}</h2>
                    <p class="profile-email-text">${safeEmail}</p>
                </div>
            </div>
            
            <p style="text-align: center; padding: 50px; color: #999;">
                This user hasn't set up their profile yet.
            </p>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function loadUserStats(email) {
    // Count blogs by this user
    firebase.firestore().collection('news')
        .where('authorEmail', '==', email)
        .get()
        .then((snapshot) => {
            document.getElementById('articles-count').textContent = snapshot.size;
        });
    
    // Count likes
    firebase.firestore().collection('news')
        .where('likes', 'array-contains', email)
        .get()
        .then((snapshot) => {
            document.getElementById('likes-count').textContent = snapshot.size;
        });
    
    // Count comments
    firebase.firestore().collection('news')
        .get()
        .then((snapshot) => {
            let commentCount = 0;
            snapshot.forEach((doc) => {
                const comments = doc.data().comments || [];
                commentCount += comments.filter(c => c.email === email).length;
            });
            document.getElementById('comments-count').textContent = commentCount;
        });
}

function loadUserArticles(email) {
    const articlesSection = document.getElementById('user-articles');
    
    firebase.firestore().collection('news')
        .where('authorEmail', '==', email)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                articlesSection.innerHTML = '<h3>Published Blogs</h3><p style="text-align: center; color: #999; padding: 30px;">No published blogs yet</p>';
                return;
            }
            
            let articles = [];
            snapshot.forEach((doc) => {
                articles.push({ id: doc.id, data: doc.data(), timestamp: doc.data().createdAt?.seconds || 0 });
            });
            
            // Sort by newest first
            articles.sort((a, b) => b.timestamp - a.timestamp);
            
            let html = '<h3>Published Blogs</h3><div class="news-grid">';
            articles.forEach(article => {
                html += createNewsCard(article.id, article.data);
            });
            html += '</div>';
            
            articlesSection.innerHTML = html;
        });
}

function showError(message) {
    document.getElementById('profile-content').innerHTML = `
        <p style="text-align: center; padding: 50px; color: #c41e3a; font-size: 18px;">
            ${message}
        </p>
    `;
}

// Create news card (copy from your main ja.js or import)
function createNewsCard(newsId, news) {
    const userEmail = window.currentUser?.email || '';
    const isLiked = news.likes?.includes(userEmail);
    const isBookmarked = news.bookmarks?.includes(userEmail);
    const likeCount = news.likes?.length || 0;
    const commentCount = news.comments?.length || 0;
    
    const date = news.createdAt ? new Date(news.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
    
    return `
        <div class="news-article">
            <div onclick="window.location.href='article.html?id=${newsId}'" style="cursor: pointer;">
                <img src="${news.imageUrl}" alt="${news.title}" class="news-article-image">
                <div class="news-article-content">
                    <h2 class="news-article-title">${news.title}</h2>
                    <div class="news-article-meta">
                        <span>👤 <a href="public-profile.html?email=${encodeURIComponent(news.authorEmail)}" style="color: #c41e3a; text-decoration: none; font-weight: 600;" onclick="event.stopPropagation();">${news.author}</a></span>
                        <span>📅 ${date}</span>
                        <span>📁 ${news.category}</span>
                    </div>
                    <p class="news-article-description">${news.description}</p>
                </div>
            </div>
            <div class="news-article-content">
                <div class="news-article-actions" onclick="event.stopPropagation();">
                    <button class="action-btn ${isLiked ? 'active' : ''}" onclick="toggleLike('${newsId}')">
                        ❤️ <span class="count">${likeCount}</span>
                    </button>
                    <button class="action-btn ${isBookmarked ? 'active' : ''}" onclick="toggleBookmark('${newsId}')">
                        🔖 Bookmark
                    </button>
                    <button class="action-btn">
                        💬 <span class="count">${commentCount}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Add like/bookmark functions (they need to exist)
function toggleLike(newsId) {
    if (!window.currentUser) {
        alert('Please login to like blogs');
        return;
    }
    
    const newsRef = firebase.firestore().collection('news').doc(newsId);
    const userEmail = window.currentUser.email;
    
    newsRef.get().then((doc) => {
        const likes = doc.data().likes || [];
        if (likes.includes(userEmail)) {
            newsRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(userEmail) });
        } else {
            newsRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(userEmail) });
        }
        setTimeout(() => location.reload(), 300);
    });
}

function toggleBookmark(newsId) {
    if (!window.currentUser) {
        alert('Please login to bookmark blogs');
        return;
    }
    
    const newsRef = firebase.firestore().collection('news').doc(newsId);
    const userEmail = window.currentUser.email;
    
    newsRef.get().then((doc) => {
        const bookmarks = doc.data().bookmarks || [];
        if (bookmarks.includes(userEmail)) {
            newsRef.update({ bookmarks: firebase.firestore.FieldValue.arrayRemove(userEmail) });
            alert('Bookmark removed');
        } else {
            newsRef.update({ bookmarks: firebase.firestore.FieldValue.arrayUnion(userEmail) });
            alert('Blog bookmarked!');
        }
        setTimeout(() => location.reload(), 300);
    });
}