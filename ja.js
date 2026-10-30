// Blogs24 Navigation Script - Full News System


// Blogs24 Navigation Script - Full News System

document.addEventListener('DOMContentLoaded', () => {

    // Check dark mode
const darkMode = localStorage.getItem('darkMode');
if (darkMode === 'enabled') {
    document.body.classList.add('dark-mode');
}

    const navLinks = document.querySelectorAll('.nav-menu a');
    const contentArea = document.getElementById('content-area');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (!contentArea) {
        console.error("Error: #content-area not found.");
        return;
    }

    // --- Mobile Menu Toggle ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // --- Handle Navigation Clicks ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            // Add active class to clicked link
            link.parentElement.classList.add('active');
            
            // Get category from data attribute or text content
            const category = link.getAttribute('data-category') || link.textContent.trim().toLowerCase();
            
            console.log('Category clicked:', category); // Debug log
            
            // Load content for that category
            loadCategoryContent(category);
            
            // Close mobile menu if open
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        });
    });

    // --- Live Search Functionality ---
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
let currentSearchQuery = '';
let searchTimeout;

if (searchInput) {
    // Live search as user types
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        if (query === '') {
            clearSearch();
            return;
        }
        
        // Show clear button
        clearSearchBtn.style.display = 'inline-block';
        
        // Debounce search (wait 300ms after user stops typing)
        searchTimeout = setTimeout(() => {
            performLiveSearch(query);
        }, 300);
    });
    
    // Search on Enter key (immediate search)
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            if (query) {
                performLiveSearch(query);
            }
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            performLiveSearch(query);
        } else {
            alert('Please enter a search term');
        }
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
}

function performLiveSearch(query) {
    const queryLower = query.toLowerCase();
    currentSearchQuery = queryLower;
    
    // Update UI with searching state
    contentArea.innerHTML = `
        <div class="search-results-info">
            Searching for "<strong>${query}</strong>"...
        </div>
        <div class="news-grid" id="news-container">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Searching...</p>
            </div>
        </div>
    `;
    
    // Search in Firestore
    searchNews(queryLower, query);
}

function clearSearch() {
    currentSearchQuery = '';
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    clearTimeout(searchTimeout);
    
    // Reload default category
    const defaultCategory = 'latest';
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(l => l.parentElement.classList.remove('active'));
    const latestLink = document.querySelector('.nav-menu a[data-category="latest"]');
    if (latestLink) {
        latestLink.parentElement.classList.add('active');
    }
    loadCategoryContent(defaultCategory);
}

function searchNews(queryLower, displayQuery) {
    const container = document.getElementById('news-container');
    
    firebase.firestore().collection('news')
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                contentArea.innerHTML = `
                    <div class="search-results-info">
                        No blogs in database
                    </div>
                `;
                return;
            }
            
            // Filter by search query (search in title)
            let results = [];
            snapshot.forEach((doc) => {
                const news = doc.data();
                const title = news.title.toLowerCase();
                
                // Check if title contains the search query
                if (title.includes(queryLower)) {
                    results.push({ 
                        id: doc.id, 
                        data: news, 
                        timestamp: news.createdAt?.seconds || 0 
                    });
                }
            });
            
            // Sort by timestamp (newest first)
            results.sort((a, b) => b.timestamp - a.timestamp);
            
            if (results.length === 0) {
                contentArea.innerHTML = `
                    <div class="search-results-info">
                        No results found for "<strong>${displayQuery}</strong>"
                    </div>
                    <p style="text-align: center; color: #999; padding: 50px;">
                        Try different keywords or 
                        <button onclick="window.clearSearchGlobal()" style="color: #c41e3a; background: none; border: none; cursor: pointer; text-decoration: underline; font-size: 16px;">
                            clear search
                        </button>
                    </p>
                `;
                return;
            }
            
            // Update results info
            contentArea.innerHTML = `
                <div class="search-results-info">
                    Found <strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} for "<strong>${displayQuery}</strong>"
                </div>
                <div class="news-grid" id="news-container"></div>
            `;
            
            // Display results
            const newContainer = document.getElementById('news-container');
            results.forEach((item) => {
                newContainer.innerHTML += createNewsCard(item.id, item.data);
            });
        })
        .catch((error) => {
            console.error('Error searching blogs:', error);
            contentArea.innerHTML = '<p style="text-align: center; color: #c41e3a;">Error searching blogs</p>';
        });
}

// Make clearSearch globally accessible for onclick button
window.clearSearchGlobal = function() {
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    
    // Reload latest news
    loadCategoryContent('latest');
    
    // Update active nav
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(l => l.parentElement.classList.remove('active'));
    const latestLink = document.querySelector('.nav-menu a[data-category="latest"]');
    if (latestLink) {
        latestLink.parentElement.classList.add('active');
    }
};

    // Hamburger Sidebar elements
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeSidebar = document.querySelector('.close-sidebar');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');

    if (!contentArea) {
        console.error("Error: #content-area not found.");
        return;
    }

    // --- Mobile Menu Toggle ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // --- Hamburger Sidebar Functions ---
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

    

    // Function to load sidebar section content
const loadSidebarContent = (section) => {
    let content = '';
    
    switch(section.toLowerCase()) {
        case 'profile':
            content = `
                <div class="profile-section">
                    <h2>My Profile</h2>
                    <div class="profile-info">
                        <img src="${window.currentUser?.photo || 'default-avatar.png'}" alt="Profile" class="profile-pic">
                        <div class="profile-details">
                            <p><strong>Name:</strong> ${window.currentUser?.name || 'Guest'}</p>
                            <p><strong>Email:</strong> ${window.currentUser?.email || 'Not logged in'}</p>
                            <p><strong>Role:</strong> ${window.currentUser?.role || 'N/A'}</p>
                            <button class="btn btn-primary">Edit Profile</button>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'saved blogs':
            content = `<div id="bookmarked-container"></div>`;
            waitForUser(() => loadBookmarkedNews());
            break;
            
        case 'liked blogs':
            content = `<div id="liked-container"></div>`;
            waitForUser(() => loadLikedNews());
            break;
            
        case 'subscription':
            content = `
                <div class="subscription-section">
                    <h2>Subscription Plans</h2>
                    <div class="plans-grid">
                        <div class="plan-card">
                            <h3>Free</h3>
                            <p class="price">$0/month</p>
                            <ul><li>Basic blog access</li><li>Limited blogs per day</li></ul>
                            <button class="btn btn-outline">Current Plan</button>
                        </div>
                        <div class="plan-card featured">
                            <h3>Premium</h3>
                            <p class="price">$9.99/month</p>
                            <ul><li>Unlimited blogs</li><li>Ad-free experience</li><li>Early access</li></ul>
                            <button class="btn btn-primary">Upgrade Now</button>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'feedback/contact us':
            content = `
                <div class="contact-section">
                    <h2>Contact Us</h2>
                    <form class="contact-form">
                        <div class="form-group">
                            <label>Name:</label>
                            <input type="text" placeholder="Your name" required>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" placeholder="Your email" required>
                        </div>
                        <div class="form-group">
                            <label>Message:</label>
                            <textarea placeholder="Your message" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>
            `;
            break;
            
        case 'settings':
            content = `
                <div class="settings-section">
                    <h2>Settings</h2>
                    <div class="settings-list">
                        <div class="setting-item">
                            <label>Email Notifications</label>
                            <input type="checkbox" checked>
                        </div>
                        <div class="setting-item">
                            <label>Dark Mode</label>
                            <input type="checkbox">
                        </div>
                        <button class="btn btn-primary">Save Changes</button>
                    </div>
                </div>
            `;
            break;
            
        case '📝 create blog':
        case 'create blog':
            if (!window.currentUser || (window.currentUser.role !== 'superadmin' && window.currentUser.role !== 'admin')) {
                content = `<p style="text-align: center; padding: 50px; color: #c41e3a; font-size: 18px;">❌ Access Denied. Admin privileges required.</p>`;
            } else {
                content = `
                    <div class="create-news-section">
                        <h2>📝 Create Blog Post</h2>
                        <form class="news-form" id="create-news-form">
                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" id="news-title" placeholder="Enter blog title" required>
                            </div>
                            <div class="form-group">
                                <label>Category *</label>
                                <select id="news-category" required>
                                    <option value="">Select Category</option>
                                    <option value="latest">Latest</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="sports">Sports</option>
                                    <option value="politics">Politics</option>
                                    <option value="technology">Technology</option>
                                    <option value="business">Business</option>
                                    <option value="health">Health</option>
                                    <option value="lifestyle">Lifestyle</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Description *</label>
                                <textarea id="news-description" placeholder="Enter blog description" required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Image (Optional)</label>
                                <input type="file" id="news-image" accept="image/*">
                                <img id="image-preview" class="image-preview" src="" alt="Preview">
                            </div>
                            <button type="submit" class="btn btn-primary">Publish Blog</button>
                        </form>
                    </div>
                `;
                waitForUser(initCreateNewsForm);
            }
            break;
            
        case '👥 manage users':
        case 'manage users':
            if (!window.currentUser || (window.currentUser.role !== 'superadmin' && window.currentUser.role !== 'admin')) {
                content = `<p style="text-align: center; padding: 50px; color: #c41e3a; font-size: 18px;">❌ Access Denied.</p>`;
            } else {
                content = `
                    <div class="admin-section">
                        <h2>👥 Manage Users</h2>
                        ${window.currentUser.role === 'superadmin' ? `
                        <div class="add-user-section">
                            <h3>Assign Role to User</h3>
                            <div class="add-user-form">
                                <input type="email" id="new-user-email" placeholder="Enter Google account email" class="input-field">
                                <input type="text" id="new-user-name" placeholder="Enter user name (optional)" class="input-field">
                                <select id="new-user-role" class="input-field">
                                    <option value="">Select Role</option>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Superadmin</option>
                                </select>
                                <button onclick="addUserRole()" class="btn btn-primary">Assign Role</button>
                            </div>
                        </div>` : ''}
                        <div id="users-list"><p style="text-align: center; color: #999;">Loading users...</p></div>
                    </div>
                `;
                waitForUser(loadUsersList);
            }
            break;
            
        case '📊 blog analytics':
        case 'blog analytics':
            if (!window.currentUser || (window.currentUser.role !== 'superadmin' && window.currentUser.role !== 'admin')) {
                content = `<p style="text-align: center; padding: 50px; color: #c41e3a; font-size: 18px;">❌ Access Denied.</p>`;
            } else {
                content = `
                    <div class="admin-section">
                        <h2>📊 Blog Analytics</h2>
                        <div class="analytics-grid">
                            <div class="stat-card"><h3>Total Views</h3><p class="stat-number">12,543</p></div>
                            <div class="stat-card"><h3>Total Users</h3><p class="stat-number">1,234</p></div>
                            <div class="stat-card"><h3>Articles Published</h3><p class="stat-number">456</p></div>
                            <div class="stat-card"><h3>Comments</h3><p class="stat-number">3,210</p></div>
                        </div>
                    </div>
                `;
            }
            break;
            
        default:
            content = `<p style="text-align: center; padding: 50px; color: #999; font-size: 18px;">${section} content will be displayed here</p>`;
    }
    
    contentArea.innerHTML = `
        <div class="category-header"><h1>${section}</h1></div>
        <div class="content-section">${content}</div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- Function to load category content with real news ---
const loadCategoryContent = (category) => {
    const title = category.charAt(0).toUpperCase() + category.slice(1);
    
    contentArea.innerHTML = `
        <div class="category-header">
            <h1>${title} Blogs</h1>
            <p>Latest updates in ${title}</p>
        </div>
        <div class="news-grid" id="news-container">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading blogs...</p>
            </div>
        </div>
    `;
    
    // Load real news from Firestore
    loadNewsArticles(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- Handle Navigation Clicks ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        navLinks.forEach(l => l.parentElement.classList.remove('active'));
        link.parentElement.classList.add('active');

        const category = link.getAttribute('data-category') || link.textContent.trim().toLowerCase();
        loadCategoryContent(category);

        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    });
});

// --- Load default category on page load ---
const defaultCategory = document.querySelector('.nav-menu li.active a')?.textContent.trim().toLowerCase() || 'latest';

// Wait for user data to load first
const checkUserAndLoad = setInterval(() => {
    if (window.currentUser !== undefined) { // User data loaded (could be null or an object)
        clearInterval(checkUserAndLoad);
        loadCategoryContent(defaultCategory);
    }
}, 100);

// Fallback: load after 2 seconds even if user not loaded
setTimeout(() => {
    clearInterval(checkUserAndLoad);
    if (!document.getElementById('news-container').innerHTML) {
        loadCategoryContent(defaultCategory);
    }
}, 2000);

});



// Load blog posts from Firestore - OUTSIDE of DOMContentLoaded
function loadNewsArticles(category) {
    const container = document.getElementById('news-container');
    
    console.log('Loading blogs for category:', category); // Debug
    
    // Get all news first, then filter by category
    firebase.firestore().collection('news')
        .get()
        .then((snapshot) => {
            console.log('Total blogs found:', snapshot.size); // Debug
            
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No blog posts yet in this category.</p>';
                return;
            }
            
            // Filter by category and sort manually
            let newsItems = [];
            snapshot.forEach((doc) => {
                const news = doc.data();
                if (category === 'latest' || news.category === category) {
                    newsItems.push({ id: doc.id, data: news, timestamp: news.createdAt });
                }
            });
            
            console.log('Filtered blogs:', newsItems.length); // Debug
            
            // Sort by timestamp (newest first)
            newsItems.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });
            
            if (newsItems.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No blog posts yet in this category.</p>';
                return;
            }
            
            container.innerHTML = '';
            newsItems.forEach((item) => {
                container.insertAdjacentHTML('beforeend', createNewsCard(item.id, item.data));
            });
        })
        .catch((error) => {
            console.error('Error loading blogs:', error);
            container.innerHTML = '<p style="text-align: center; color: #c41e3a;">Error loading blogs: ' + error.message + '</p>';
        });
}

// Initialize Create Blog Form
function initCreateNewsForm() {
    const form = document.getElementById('create-news-form');
    const imageInput = document.getElementById('news-image');
    const imagePreview = document.getElementById('image-preview');
    
    // Image preview (still works locally)
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.add('show');
            };
            reader.readAsDataURL(file);
        }
    });
    // Form submit - NO IMAGE UPLOAD TO FIREBASE
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!window.currentUser) {
            alert('Please login first');
            return;
        }

        if (!['admin', 'superadmin'].includes(window.currentUser.role)) {
            alert('Only admins and superadmins can publish blogs.');
            return;
        }
        
        const title = document.getElementById('news-title').value;
        const category = document.getElementById('news-category').value;
        const description = document.getElementById('news-description').value;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Publishing...';
        
        try {
            // Just use placeholder image for now
            const imageUrl =             'https://via.placeholder.com/800x400/cccccc/666666?text=Blog+Cover+Image';
            
            // Save news to Firestore
            await firebase.firestore().collection('news').add({
                title: title,
                category: category,
                description: description,
                imageUrl: imageUrl,
                author: window.currentUser.name,
                authorEmail: window.currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: [],
                bookmarks: [],
                comments: []
            });
            
            alert('✅ Blog published successfully!');
            form.reset();
            imagePreview.classList.remove('show');
            
        } catch (error) {
            console.error('Error publishing blog:', error);
            alert('❌ Error publishing blog: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publish Blog';
        }
    });
}
// Load blog posts from Firestore - OUTSIDE of DOMContentLoaded
function loadNewsArticles(category) {
    const container = document.getElementById('news-container');
    
    console.log('Loading blogs for category:', category); // Debug
    
    // Just get ALL news without any query filters
    firebase.firestore().collection('news')
        .get()
        .then((snapshot) => {
            console.log('Total blogs found:', snapshot.size); // Debug
            
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No blog posts yet. Create your first blog!</p>';
                return;
            }
            
            // Filter by category and sort manually in JavaScript
            let newsItems = [];
            snapshot.forEach((doc) => {
                const news = doc.data();
                // For "latest", show all. For other categories, filter by category
                if (category === 'latest' || news.category === category) {
                    newsItems.push({ 
                        id: doc.id, 
                        data: news, 
                        timestamp: news.createdAt?.seconds || 0 
                    });
                }
            });
            
            console.log('Filtered blogs for ' + category + ':', newsItems.length); // Debug
            
            // Sort by timestamp (newest first) - done in JavaScript, not Firebase
            newsItems.sort((a, b) => b.timestamp - a.timestamp);
            
            if (newsItems.length === 0) {
                container.innerHTML = `<p style="text-align: center; color: #999; padding: 50px;">No blog posts in "${category}" category yet.</p>`;
                return;
            }
            
            container.innerHTML = '';
            newsItems.forEach((item) => {
                container.insertAdjacentHTML('beforeend', createNewsCard(item.id, item.data));
            });
        })
        .catch((error) => {
            console.error('Error loading blogs:', error);
            container.innerHTML = '<p style="text-align: center; color: #c41e3a;">Error loading blogs: ' + error.message + '</p>';
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
                        🔖
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
        // Reload current category
        const activeCategory = document.querySelector('.nav-menu li.active a')?.textContent.trim().toLowerCase() || 'latest';
        waitForUser(() => loadNewsArticles(activeCategory));
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
        const activeCategory = document.querySelector('.nav-menu li.active a')?.textContent.trim().toLowerCase() || 'latest';
        waitForUser(() => loadNewsArticles(activeCategory));
    });
}

// Toggle comments section
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

// Load saved blogs
function loadBookmarkedNews() {
    const container = document.getElementById('bookmarked-container');
    
    if (!window.currentUser) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Please login to see saved blogs</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    firebase.firestore().collection('news')
        .where('bookmarks', 'array-contains', window.currentUser.email)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No saved blogs yet</p>';
                return;
            }
            
            container.innerHTML = '';
            snapshot.forEach((doc) => {
                container.insertAdjacentHTML('beforeend', createNewsCard(doc.id, doc.data()));
            });
        });
}

// Load liked blogs
function loadLikedNews() {
    const container = document.getElementById('liked-container');
    
    if (!window.currentUser) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Please login to see liked blogs</p>';
        return;
    }
    
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    firebase.firestore().collection('news')
        .where('likes', 'array-contains', window.currentUser.email)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 50px;">No liked blogs yet</p>';
                return;
            }
            
            container.innerHTML = '';
            snapshot.forEach((doc) => {
                container.insertAdjacentHTML('beforeend', createNewsCard(doc.id, doc.data()));
            });
        });
}

// User management functions (from previous code)
function addUserRole() {
    const email = document.getElementById('new-user-email').value.trim();
    const name = document.getElementById('new-user-name').value.trim();
    const role = document.getElementById('new-user-role').value;
    
    if (!email || !role) {
        alert('❌ Please fill all required fields');
        return;
    }
    
    const userData = {
        email: email,
        role: role,
        assignedBy: window.currentUser.email,
        assignedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (name) userData.name = name;
    
    firebase.firestore().collection('users').doc(email).set(userData, { merge: true })
        .then(() => {
            alert(`✅ Role "${role}" assigned to ${email}`);
            document.getElementById('new-user-email').value = '';
            document.getElementById('new-user-name').value = '';
            document.getElementById('new-user-role').value = '';
            loadUsersList();
        })
        .catch((error) => {
            alert('❌ Error: ' + error.message);
        });
}

function loadUsersList() {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    firebase.firestore().collection('users').get()
        .then((snapshot) => {
            let html = '<table class="users-table"><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>';
            snapshot.forEach((doc) => {
                const user = doc.data();
                html += `
                    <tr>
                        <td>${user.name || 'N/A'}</td>
                        <td>${doc.id}</td>
                        <td><span class="role-badge role-${user.role}">${user.role}</span></td>
                        <td>
                            ${window.currentUser.role === 'superadmin' ? 
                                `<button onclick="changeUserRole('${doc.id}', '${user.role}')" class="btn-small">Change</button>
                                 <button onclick="deleteUser('${doc.id}')" class="btn-small btn-danger">Delete</button>` 
                                : 'N/A'}
                        </td>
                    </tr>
                `;
            });
            html += '</table>';
            usersList.innerHTML = html;
        });
}

async function changeUserRole(email, currentRole) {
    const newRole = await window.appPopup.prompt(`Change role for ${email}. Current role: ${currentRole}. Enter user, admin, or superadmin.`, {
        title: 'Change user role',
        label: 'Role',
        placeholder: 'user, admin, or superadmin',
        defaultValue: currentRole,
        confirmLabel: 'Save role'
    });
    if (newRole && ['user', 'admin', 'superadmin'].includes(newRole)) {
        firebase.firestore().collection('users').doc(email).update({ role: newRole })
            .then(() => {
                alert(`✅ Role updated to ${newRole}`);
                loadUsersList();
            });
    }
}

async function deleteUser(email) {
    if (email !== window.currentUser.email && await window.appPopup.confirm(`Delete user ${email}? This action cannot be undone.`, {
        title: 'Delete user',
        type: 'warning',
        confirmLabel: 'Delete user'
    })) {
        const db = firebase.firestore();
        const batch = db.batch();
        batch.delete(db.collection('users').doc(email));
        batch.delete(db.collection('userSettings').doc(email));
        batch.delete(db.collection('publicProfiles').doc(email));
        batch.commit()
            .then(() => {
                alert('✅ User deleted');
                loadUsersList();
            });
    }
}

// Go back to previous section
function goBack() {
    if (navigationHistory.length > 0) {
        const previousSection = navigationHistory.pop();
        currentSection = previousSection;
        
        // Check if it's a news category or sidebar section
        const newsCategories = ['latest', 'entertainment', 'sports', 'politics', 'technology', 'business', 'health', 'lifestyle'];
        
        if (newsCategories.includes(previousSection)) {
            // Reload category content
            const title = previousSection.charAt(0).toUpperCase() + previousSection.slice(1);
            
            contentArea.innerHTML = `
                ${navigationHistory.length > 0 ? '<button class="back-btn" onclick="goBack()">← Back</button>' : ''}
                <div class="category-header">
                    <h1>${title} Blogs</h1>
                    <p>Latest updates in ${title}</p>
                </div>
                <div class="news-grid" id="news-container">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading blogs...</p>
                    </div>
                </div>
            `;
            
            loadNewsArticles(previousSection);
            
            // Update active nav
            document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
            const activeLink = Array.from(document.querySelectorAll('.nav-menu a')).find(
                a => a.textContent.trim().toLowerCase() === previousSection
            );
            if (activeLink) activeLink.parentElement.classList.add('active');
            
        } else {
            // Reload sidebar content
            loadSidebarContentWithoutHistory(previousSection);
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Load sidebar content without adding to history (for back button)
function loadSidebarContentWithoutHistory(section) {
    // This is a copy of loadSidebarContent but without history tracking
    let content = '';
    
    switch(section.toLowerCase()) {
        case 'profile':
            content = `
                <div class="profile-section">
                    <h2>My Profile</h2>
                    <div class="profile-info">
                        <img src="${window.currentUser?.photo || 'default-avatar.png'}" alt="Profile" class="profile-pic">
                        <div class="profile-details">
                            <p><strong>Name:</strong> ${window.currentUser?.name || 'Guest'}</p>
                            <p><strong>Email:</strong> ${window.currentUser?.email || 'Not logged in'}</p>
                            <p><strong>Role:</strong> ${window.currentUser?.role || 'N/A'}</p>
                            <button class="btn btn-primary">Edit Profile</button>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'saved blogs':
            content = `<div id="bookmarked-container"></div>`;
            waitForUser(loadBookmarkedNews);
            break;
            
        case 'liked blogs':
            content = `<div id="liked-container"></div>`;
            waitForUser(loadLikedNews);
            break;
            
        case 'subscription':
            content = `
                <div class="subscription-section">
                    <h2>Subscription Plans</h2>
                    <div class="plans-grid">
                        <div class="plan-card">
                            <h3>Free</h3>
                            <p class="price">$0/month</p>
                            <ul><li>Basic blog access</li><li>Limited blogs per day</li></ul>
                            <button class="btn btn-outline">Current Plan</button>
                        </div>
                        <div class="plan-card featured">
                            <h3>Premium</h3>
                            <p class="price">$9.99/month</p>
                            <ul><li>Unlimited blogs</li><li>Ad-free experience</li><li>Early access</li></ul>
                            <button class="btn btn-primary">Upgrade Now</button>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'feedback/contact us':
            content = `
                <div class="contact-section">
                    <h2>Contact Us</h2>
                    <form class="contact-form">
                        <div class="form-group">
                            <label>Name:</label>
                            <input type="text" placeholder="Your name" required>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" placeholder="Your email" required>
                        </div>
                        <div class="form-group">
                            <label>Message:</label>
                            <textarea placeholder="Your message" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                </div>
            `;
            break;
            
        case 'settings':
            content = `
                <div class="settings-section">
                    <h2>Settings</h2>
                    <div class="settings-list">
                        <div class="setting-item">
                            <label>Email Notifications</label>
                            <input type="checkbox" checked>
                        </div>
                        <div class="setting-item">
                            <label>Dark Mode</label>
                            <input type="checkbox">
                        </div>
                        <button class="btn btn-primary">Save Changes</button>
                    </div>
                </div>
            `;
            break;
            
        case '📝 create blog':
        case 'create blog':
            if (!window.currentUser || (window.currentUser.role !== 'superadmin' && window.currentUser.role !== 'admin')) {
                content = `<p style="text-align: center; padding: 50px; color: #c41e3a; font-size: 18px;">❌ Access Denied. Admin privileges required.</p>`;
            } else {
                content = `
                    <div class="create-news-section">
                        <h2>📝 Create Blog Post</h2>
                        <form class="news-form" id="create-news-form">
                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" id="news-title" placeholder="Enter blog title" required>
                            </div>
                            <div class="form-group">
                                <label>Category *</label>
                                <select id="news-category" required>
                                    <option value="">Select Category</option>
                                    <option value="latest">Latest</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="sports">Sports</option>
                                    <option value="politics">Politics</option>
                                    <option value="technology">Technology</option>
                                    <option value="business">Business</option>
                                    <option value="health">Health</option>
                                    <option value="lifestyle">Lifestyle</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Description *</label>
                                <textarea id="news-description" placeholder="Enter blog description" required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Image (Optional)</label>
                                <input type="file" id="news-image" accept="image/*">
                                <img id="image-preview" class="image-preview" src="" alt="Preview">
                            </div>
                            <button type="submit" class="btn btn-primary">Publish Blog</button>
                        </form>
                    </div>
                `;
                waitForUser(initCreateNewsForm);
            }
            break;
            
        case '👥 manage users':
        case 'manage users':
            if (!window.currentUser || (window.currentUser.role !== 'superadmin' && window.currentUser.role !== 'admin')) {
                content = `<p style="text-align: center; padding: 50px; color: #c41e3a; font-size: 18px;">❌ Access Denied.</p>`;
            } else {
                content = `
                    <div class="admin-section">
                        <h2>👥 Manage Users</h2>
                        ${window.currentUser.role === 'superadmin' ? `
                        <div class="add-user-section">
                            <h3>Assign Role to User</h3>
                            <div class="add-user-form">
                                <input type="email" id="new-user-email" placeholder="Enter Google account email" class="input-field">
                                <input type="text" id="new-user-name" placeholder="Enter user name (optional)" class="input-field">
                                <select id="new-user-role" class="input-field">
                                    <option value="">Select Role</option>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="superadmin">Superadmin</option>
                                </select>
                                <button onclick="addUserRole()" class="btn btn-primary">Assign Role</button>
                            </div>
                        </div>` : ''}
                        <div id="users-list"><p style="text-align: center; color: #999;">Loading users...</p></div>
                    </div>
                `;
                waitForUser(loadUsersList);
            }
            break;
            
        case '📊 blog analytics':
        case 'blog analytics':
            if (!window.currentUser || (window.currentUser.role !== 'superadmin' && window.currentUser.role !== 'admin')) {
                content = `<p style="text-align: center; padding: 50px; color: #c41e3a; font-size: 18px;">❌ Access Denied.</p>`;
            } else {
                content = `
                    <div class="admin-section">
                        <h2>📊 Blog Analytics</h2>
                        <div class="analytics-grid">
                            <div class="stat-card"><h3>Total Views</h3><p class="stat-number">12,543</p></div>
                            <div class="stat-card"><h3>Total Users</h3><p class="stat-number">1,234</p></div>
                            <div class="stat-card"><h3>Articles Published</h3><p class="stat-number">456</p></div>
                            <div class="stat-card"><h3>Comments</h3><p class="stat-number">3,210</p></div>
                        </div>
                    </div>
                `;
            }
            break;
            
        default:
            content = `<p style="text-align: center; padding: 50px; color: #999; font-size: 18px;">${section} content will be displayed here</p>`;
    }
    
    contentArea.innerHTML = `
        ${navigationHistory.length > 0 ? '<button class="back-btn" onclick="goBack()">← Back</button>' : ''}
        <div class="category-header"><h1>${section}</h1></div>
        <div class="content-section">${content}</div>
    `;
    

    
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