// bookmarked.js
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

    

function filterArticles(query) {
    const queryLower = query.toLowerCase();
    const filtered = allBookmarkedArticles.filter(article => 
        article.data.title.toLowerCase().includes(queryLower)
    );
    
    displayFilteredArticles(filtered, query);
}

function displayFilteredArticles(articles, searchQuery = null) {
    const container = document.getElementById('bookmarked-container');
    
    if (articles.length === 0) {
        if (searchQuery) {
            container.innerHTML = `
                <div class="search-results-info">
                    No bookmarked blogs found for "<strong>${searchQuery}</strong>"
                </div>
                <p style="text-align: center; color: #999; padding: 50px;">
                    Try different keywords
                </p>
            `;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No saved blogs yet</p>';
        }
        return;
    }
    
    let html = '';
    if (searchQuery) {
        html += `
            <div class="search-results-info">
                Found <strong>${articles.length}</strong> result${articles.length !== 1 ? 's' : ''} for "<strong>${searchQuery}</strong>"
            </div>
        `;
    }
    
    html += '<div class="news-grid saved-blog-grid">';
    articles.forEach(article => {
        html += createNewsCard(article.id, article.data);
    });
    html += '</div>';
    
    container.innerHTML = html;
}

    // Load saved blogs
    waitForUser(loadBookmarkedNews);
});

// Load saved blogs from Firestore
function loadBookmarkedNews() {
    const container = document.getElementById('bookmarked-container');
    
    if (!window.currentUser) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">Please login to see saved blogs</p>';
        return;
    }
    

    firebase.firestore().collection('news')
        .where('bookmarks', 'array-contains', window.currentUser.email)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No saved blogs yet</p>';
                return;
            }
            
            container.innerHTML = '<div class="news-grid saved-blog-grid"></div>';
            const blogGrid = container.querySelector('.saved-blog-grid');
            snapshot.forEach((doc) => {
                blogGrid.insertAdjacentHTML('beforeend', createNewsCard(doc.id, doc.data()));
            });
        })
        
        .catch((error) => {
            console.error('Error loading saved blogs:', error);
            container.innerHTML = '<p style="text-align: center; color: #c41e3a; padding: 50px;">Error loading saved blogs</p>';
        });
}

// Create news card HTML
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
                        <span>👤 <a href="public-profile.html?email=${encodeURIComponent(news.authorEmail)}" style="color: #eb3434; text-decoration: none; font-weight: 600;" onclick="event.stopPropagation();">${news.author}</a></span>
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
                    <button class="action-btn" onclick="toggleComments('${newsId}')">
                        💬 <span class="count">${commentCount}</span>
                    </button>
                    ${window.currentUser && (window.currentUser.role === 'admin' || window.currentUser.role === 'superadmin') ? `
                    <button class="action-btn admin-action" onclick="editNews('${newsId}')" style="background: #2196f3;" title="Edit Blog">
                        ✏️
                    </button>
                    <button class="action-btn admin-action" onclick="deleteNews('${newsId}')" style="background: #f44336;" title="Delete Blog">
                        🗑️
                    </button>
                    ` : ''}
                </div>
                <div id="comments-${newsId}" class="comments-section" style="display: none;">
                    <div class="comment-form">
                        <textarea id="comment-input-${newsId}" class="comment-input" placeholder="Write a comment..."></textarea>
                        <button class="btn btn-primary" onclick="addComment('${newsId}')">Post Comment</button>
                    </div>
                    <div id="comments-list-${newsId}"></div>
                </div>
            </div>
        </div>
    `;
}

// Toggle like
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

// Toggle bookmark
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

// Toggle comments
function toggleComments(newsId) {
    const commentsSection = document.getElementById(`comments-${newsId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        loadComments(newsId);
    } else {
        commentsSection.style.display = 'none';
    }
}

// Load comments
function loadComments(newsId) {
    firebase.firestore().collection('news').doc(newsId).get()
        .then((doc) => {
            const comments = doc.data().comments || [];
            const commentsList = document.getElementById(`comments-list-${newsId}`);
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<p style="color: #999; text-align: center;">No comments yet</p>';
                return;
            }
            
            commentsList.replaceChildren();
            comments.forEach((comment) => {
                const item = document.createElement('div');
                const author = document.createElement('div');
                const text = document.createElement('div');
                const date = document.createElement('div');

                item.className = 'comment-item';
                author.className = 'comment-author';
                author.textContent = comment.author || 'Anonymous';
                text.className = 'comment-text';
                text.textContent = comment.text || '';
                date.className = 'comment-date';
                date.textContent = new Date(comment.timestamp).toLocaleString();
                item.append(author, text, date);
                commentsList.appendChild(item);
            });
        });
}

// Add comment
function addComment(newsId) {
    if (!window.currentUser) {
        alert('Please login to comment');
        return;
    }
    
    const commentInput = document.getElementById(`comment-input-${newsId}`);
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        alert('Please write a comment');
        return;
    }
    
    const newsRef = firebase.firestore().collection('news').doc(newsId);
    
    newsRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion({
            author: window.currentUser.name,
            email: window.currentUser.email,
            text: commentText,
            timestamp: Date.now()
        })
    })
    .then(() => {
        commentInput.value = '';
        loadComments(newsId);
        alert('Comment posted!');
    })
    .catch((error) => {
        alert('Error posting comment: ' + error.message);
    });

}


    // Edit blog post - redirect to edit page
function editNews(newsId) {
    if (!window.currentUser || (window.currentUser.role !== 'admin' && window.currentUser.role !== 'superadmin')) {
        alert('❌ Access denied. Admin privileges required.');
        return;
    }
    
    // Redirect to edit page with blog ID
    window.location.href = `edit-news.html?id=${newsId}`;
}

// Delete blog post
async function deleteNews(newsId) {
    if (!window.currentUser || (window.currentUser.role !== 'admin' && window.currentUser.role !== 'superadmin')) {
        alert('❌ Access denied. Admin privileges required.');
        return;
    }
    
    const confirmDelete = await window.appPopup.confirm('Are you sure you want to delete this blog post? This action cannot be undone.', {
        title: 'Delete blog',
        type: 'warning',
        confirmLabel: 'Delete blog'
    });
    
    if (!confirmDelete) return;
    
    // Delete from Firestore
    firebase.firestore().collection('news').doc(newsId).delete()
        .then(() => {
            alert('✅ Blog deleted successfully!');
            // Reload current category
            const activeCategory = document.querySelector('.nav-menu li.active a')?.textContent.trim().toLowerCase() || 'latest';
            loadNewsArticles(activeCategory);
        })
        .catch((error) => {
            console.error('Error deleting blog:', error);
            alert('❌ Error deleting blog: ' + error.message);
        });
}

function waitForUser(callback) {
    if (window.currentUser !== undefined) {
        // User data is loaded (could be null or object)
        callback();
    } else {
        // Wait and check again
        setTimeout(() => waitForUser(callback), 100);
    }
}