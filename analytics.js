// analytics.js
document.addEventListener('DOMContentLoaded', () => {

    // Check dark mode
const darkMode = localStorage.getItem('darkMode');
if (darkMode === 'enabled') {
    document.body.classList.add('dark-mode');
}
    
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

    // Check access and load analytics
    waitForUser(checkAccessAndLoadAnalytics);
});

function checkAccessAndLoadAnalytics() {
    const contentDiv = document.getElementById('analytics-content');
    
    // Check if user is logged in
    if (!window.currentUser) {
        contentDiv.innerHTML = `
            <div class="access-denied">
                <h2>🔒 Access Denied</h2>
                <p>Please login to access analytics.</p>
                <button onclick="googleSignIn()" class="btn btn-primary" style="margin-top: 20px;">
                    Sign in with Google
                </button>
            </div>
        `;
        return;
    }
    
    // Check if user is admin or superadmin
    const userRole = window.currentUser.role || 'user';
    if (userRole !== 'admin' && userRole !== 'superadmin') {
        contentDiv.innerHTML = `
            <div class="access-denied">
                <h2>❌ Access Denied</h2>
                <p>Only admins and superadmins can view analytics.</p>
                <p style="color: #666; margin-top: 10px;">Current role: <strong>${userRole}</strong></p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px; padding: 12px 24px; text-decoration: none;">
                    Return to Home
                </a>
            </div>
        `;
        return;
    }
    
    // User has access - load analytics
    loadAnalyticsData();
}

async function loadAnalyticsData() {
    try {
        // Fetch all blog posts
        const newsSnapshot = await firebase.firestore().collection('news').get();
        
        // Fetch all users
        const usersSnapshot = await firebase.firestore().collection('users').get();
        
        // Fetch all feedback
        const feedbackSnapshot = await firebase.firestore().collection('feedback').get();
        
        // Calculate analytics
        const analytics = calculateAnalytics(newsSnapshot, usersSnapshot, feedbackSnapshot);
        
        // Render the dashboard
        renderAnalyticsDashboard(analytics);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        document.getElementById('analytics-content').innerHTML = `
            <div class="access-denied">
                <h2>❌ Error Loading Analytics</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function calculateAnalytics(newsSnapshot, usersSnapshot, feedbackSnapshot) {
    let totalArticles = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalBookmarks = 0;
    let categoryStats = {};
    let topArticles = [];
    let recentActivity = [];
    
    // Process blog posts
    newsSnapshot.forEach((doc) => {
        const article = doc.data();
        totalArticles++;
        
        const likes = article.likes?.length || 0;
        const comments = article.comments?.length || 0;
        const bookmarks = article.bookmarks?.length || 0;
        
        totalLikes += likes;
        totalComments += comments;
        totalBookmarks += bookmarks;
        
        // Category stats
        const category = article.category || 'uncategorized';
        if (!categoryStats[category]) {
            categoryStats[category] = {
                articles: 0,
                likes: 0,
                comments: 0,
                bookmarks: 0
            };
        }
        categoryStats[category].articles++;
        categoryStats[category].likes += likes;
        categoryStats[category].comments += comments;
        categoryStats[category].bookmarks += bookmarks;
        
        // Store blog for top blogs
        topArticles.push({
            id: doc.id,
            title: article.title,
            author: article.author,
            category: category,
            likes: likes,
            comments: comments,
            bookmarks: bookmarks,
            engagement: likes + comments + bookmarks,
            createdAt: article.createdAt
        });
        
        // Recent activity (new blogs)
        if (article.createdAt) {
            recentActivity.push({
                type: 'article',
                title: article.title,
                author: article.author,
                timestamp: article.createdAt.seconds * 1000,
                icon: '📰'
            });
        }
    });
    
    // Sort top blogs by engagement
    topArticles.sort((a, b) => b.engagement - a.engagement);
    topArticles = topArticles.slice(0, 10); // Top 10
    
    // Sort recent activity
    recentActivity.sort((a, b) => b.timestamp - a.timestamp);
    recentActivity = recentActivity.slice(0, 5); // Last 5
    
    return {
        totalArticles,
        totalLikes,
        totalComments,
        totalBookmarks,
        totalUsers: usersSnapshot.size,
        totalFeedback: feedbackSnapshot.size,
        categoryStats,
        topArticles,
        recentActivity
    };
}

function renderAnalyticsDashboard(analytics) {
    const contentDiv = document.getElementById('analytics-content');
    
    contentDiv.innerHTML = `
        <!-- Overview Stats -->
        <div class="stats-grid">
            <div class="stat-card articles">
                <div class="stat-icon">📰</div>
                <div class="stat-label">Total Blogs</div>
                <div class="stat-number">${analytics.totalArticles}</div>
            </div>
            
            <div class="stat-card likes">
                <div class="stat-icon">❤️</div>
                <div class="stat-label">Total Likes</div>
                <div class="stat-number">${analytics.totalLikes}</div>
            </div>
            
            <div class="stat-card comments">
                <div class="stat-icon">💬</div>
                <div class="stat-label">Total Comments</div>
                <div class="stat-number">${analytics.totalComments}</div>
            </div>
            
            <div class="stat-card bookmarks">
                <div class="stat-icon">🔖</div>
                <div class="stat-label">Total Bookmarks</div>
                <div class="stat-number">${analytics.totalBookmarks}</div>
            </div>
            
            <div class="stat-card users">
                <div class="stat-icon">👥</div>
                <div class="stat-label">Total Users</div>
                <div class="stat-number">${analytics.totalUsers}</div>
            </div>
            
            <div class="stat-card views">
                <div class="stat-icon">📧</div>
                <div class="stat-label">Feedback Received</div>
                <div class="stat-number">${analytics.totalFeedback}</div>
            </div>
        </div>

        <!-- Category Breakdown -->
        <h2 class="section-header">📁 Category Breakdown</h2>
        <div class="category-stats">
            ${renderCategoryStats(analytics.categoryStats)}
        </div>

        <!-- Top Performing Articles -->
        <div class="top-articles-section">
            <h2 class="section-header">🏆 Top Performing Articles</h2>
            <div class="articles-table-container">
                <table class="articles-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Blog Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>❤️ Likes</th>
                            <th>💬 Comments</th>
                            <th>🔖 Bookmarks</th>
                            <th>Total Engagement</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderTopArticles(analytics.topArticles)}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Recent Activity -->
        <h2 class="section-header">⏱️ Recent Activity</h2>
        <div class="recent-activity">
            ${renderRecentActivity(analytics.recentActivity)}
        </div>
    `;
}

function renderCategoryStats(categoryStats) {
    if (Object.keys(categoryStats).length === 0) {
        return '<p style="text-align: center; color: #999; padding: 40px;">No category data available</p>';
    }
    
    let html = '';
    
    // Sort categories by number of blogs
    const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1].articles - a[1].articles);
    
    sortedCategories.forEach(([category, stats]) => {
        html += `
            <div class="category-card">
                <h3>${category}</h3>
                <div class="category-stat-item">
                    <span class="category-stat-label">📰 Articles</span>
                    <span class="category-stat-value">${stats.articles}</span>
                </div>
                <div class="category-stat-item">
                    <span class="category-stat-label">❤️ Likes</span>
                    <span class="category-stat-value">${stats.likes}</span>
                </div>
                <div class="category-stat-item">
                    <span class="category-stat-label">💬 Comments</span>
                    <span class="category-stat-value">${stats.comments}</span>
                </div>
                <div class="category-stat-item">
                    <span class="category-stat-label">🔖 Bookmarks</span>
                    <span class="category-stat-value">${stats.bookmarks}</span>
                </div>
            </div>
        `;
    });
    
    return html;
}

function renderTopArticles(topArticles) {
    if (topArticles.length === 0) {
        return '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No blogs found</td></tr>';
    }
    
    let html = '';
    
    topArticles.forEach((article, index) => {
        const medal = index + 1;
        
        html += `
            <tr>
                <td><strong style="font-size: 1.2rem;">${medal}</strong></td>
                <td><div class="article-title" title="${article.title}">${article.title}</div></td>
                <td>${article.author}</td>
                <td><span class="category-badge">${article.category}</span></td>
                <td><span class="metric-badge">❤️ ${article.likes}</span></td>
                <td><span class="metric-badge">💬 ${article.comments}</span></td>
                <td><span class="metric-badge">🔖 ${article.bookmarks}</span></td>
                <td><strong>${article.engagement}</strong></td>
            </tr>
        `;
    });
    
    return html;
}

function renderRecentActivity(recentActivity) {
    if (recentActivity.length === 0) {
        return '<p style="text-align: center; color: #999; padding: 20px;">No recent activity</p>';
    }
    
    let html = '';
    
    recentActivity.forEach(activity => {
        const timeAgo = getTimeAgo(activity.timestamp);
        
        html += `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">New blog published: "${activity.title}"</div>
                    <div class="activity-time">By ${activity.author} • ${timeAgo}</div>
                </div>
            </div>
        `;
    });
    
    return html;
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
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