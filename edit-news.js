// edit-news.js
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

    // Check dark mode
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // Get blog ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        document.getElementById('edit-news-content').innerHTML = `
            <div class="access-denied">
                <h2>❌ No Article Selected</h2>
                <p>Please select an blog to edit.</p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px; padding: 12px 24px; text-decoration: none;">
                    Return to Home
                </a>
            </div>
        `;
        return;
    }

    // Check access and load article
    waitForUser(() => checkAccessAndLoadArticle(articleId));
});

function checkAccessAndLoadArticle(articleId) {
    const contentDiv = document.getElementById('edit-news-content');
    
    // Check if user is logged in
    if (!window.currentUser) {
        contentDiv.innerHTML = `
            <div class="access-denied">
                <h2>🔒 Access Denied</h2>
                <p>Please login to edit blogs.</p>
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
                <p>Only admins and superadmins can edit blogs.</p>
                <p style="color: #666; margin-top: 10px;">Current role: <strong>${userRole}</strong></p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px; padding: 12px 24px; text-decoration: none;">
                    Return to Home
                </a>
            </div>
        `;
        return;
    }
    
    // User has access - load the article
    loadArticle(articleId);
}

function loadArticle(articleId) {
    firebase.firestore().collection('news').doc(articleId).get()
        .then((doc) => {
            if (!doc.exists) {
                document.getElementById('edit-news-content').innerHTML = `
                    <div class="access-denied">
                        <h2>❌ Blog Not Found</h2>
                        <p>This blog doesn't exist or has been deleted.</p>
                        <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px; padding: 12px 24px; text-decoration: none;">
                            Return to Home
                        </a>
                    </div>
                `;
                return;
            }
            
            const article = doc.data();
            renderEditForm(articleId, article);
        })
        .catch((error) => {
            console.error('Error loading blog:', error);
            document.getElementById('edit-news-content').innerHTML = `
                <div class="access-denied">
                    <h2>❌ Error Loading Blog</h2>
                    <p>${error.message}</p>
                </div>
            `;
        });
}

function renderEditForm(articleId, article) {
    const contentDiv = document.getElementById('edit-news-content');
    
    contentDiv.innerHTML = `
        <div id="form-message" class="form-message"></div>

        <form id="edit-article-form">
            <div class="form-group">
                <label for="article-title">
                    Blog Title <span class="required">*</span>
                </label>
                <input 
                    type="text" 
                    id="article-title" 
                    value="${article.title || ''}"
                    placeholder="Enter blog title..." 
                    maxlength="150"
                    required>
                <div class="char-counter">
                    <span id="title-counter">${(article.title || '').length}</span>/150
                </div>
            </div>

            <div class="form-group">
                <label for="article-category">
                    Category <span class="required">*</span>
                </label>
                <select id="article-category" required>
                    <option value="">-- Select Category --</option>
                    <option value="latest" ${article.category === 'latest' ? 'selected' : ''}>Latest</option>
                    <option value="entertainment" ${article.category === 'entertainment' ? 'selected' : ''}>Entertainment</option>
                    <option value="sports" ${article.category === 'sports' ? 'selected' : ''}>Sports</option>
                    <option value="politics" ${article.category === 'politics' ? 'selected' : ''}>Politics</option>
                    <option value="technology" ${article.category === 'technology' ? 'selected' : ''}>Technology</option>
                    <option value="business" ${article.category === 'business' ? 'selected' : ''}>Business</option>
                    <option value="health" ${article.category === 'health' ? 'selected' : ''}>Health</option>
                    <option value="lifestyle" ${article.category === 'lifestyle' ? 'selected' : ''}>Lifestyle</option>
                </select>
            </div>

            <div class="form-group">
                <label for="article-description">
                    Article Content <span class="required">*</span>
                </label>
                <textarea 
                    id="article-description" 
                    placeholder="Write your blog post..." 
                    maxlength="5000"
                    required>${article.description || ''}</textarea>
                <div class="char-counter">
                    <span id="description-counter">${(article.description || '').length}</span>/5000
                </div>
            </div>

            <div class="form-group">
                <label for="edit-image-url">Article Image URL</label>
                <input 
                    type="url" 
                    id="edit-image-url" 
                    placeholder="https://example.com/image.jpg"
                    class="input-field"
                    value="${article.imageUrl || ''}"
                >
                <p style="font-size: 12px; color: #666; margin-top: 8px; line-height: 1.5;">
                    💡 <strong>Tip:</strong> Upload to 
                    <a href="https://imgur.com/upload" target="_blank" style="color: #c41e3a; text-decoration: underline;">Imgur</a> or 
                    <a href="https://imgbb.com/" target="_blank" style="color: #c41e3a; text-decoration: underline;">ImgBB</a>, 
                    then paste the link here.
                </p>
                <img id="edit-image-preview" class="image-preview" src="${article.imageUrl || ''}" alt="Preview" style="display: ${article.imageUrl ? 'block' : 'none'}; max-width: 100%; margin-top: 15px; border-radius: 8px; border: 2px solid #e0e0e0;">
            </div>

            <div class="action-buttons">
                <a href="index.html" class="btn-cancel">
                    ❌ Cancel
                </a>
                <button type="submit" class="btn-save">
                    💾 Save Changes
                </button>
            </div>
        </form>
    `;
    
    initializeEditForm(articleId);
}

function initializeEditForm(articleId) {
    const form = document.getElementById('edit-article-form');
    const titleInput = document.getElementById('article-title');
    const descriptionInput = document.getElementById('article-description');
    const imageUrlInput = document.getElementById('edit-image-url');
    const imagePreview = document.getElementById('edit-image-preview');
    
    // Character counters
    titleInput.addEventListener('input', () => {
        document.getElementById('title-counter').textContent = titleInput.value.length;
    });
    
    descriptionInput.addEventListener('input', () => {
        document.getElementById('description-counter').textContent = descriptionInput.value.length;
    });
    
    // Image URL preview
    if (imageUrlInput && imagePreview) {
        imageUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            
            if (url) {
                imagePreview.src = url;
                imagePreview.style.display = 'block';
                
                // Handle invalid image URLs
                imagePreview.onerror = () => {
                    imagePreview.style.display = 'none';
                    showMessage('⚠️ Invalid image URL', 'warning');
                };
            } else {
                imagePreview.style.display = 'none';
                imagePreview.src = '';
            }
        });
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateArticle(articleId);
    });
}

async function updateArticle(articleId) {
    const title = document.getElementById('article-title').value.trim();
    const category = document.getElementById('article-category').value;
    const description = document.getElementById('article-description').value.trim();
    const imageUrlInput = document.getElementById('edit-image-url');
    const imageUrl = imageUrlInput?.value.trim() ||     'https://via.placeholder.com/800x400/c41e3a/ffffff?text=Blog+Cover+Image';
    const submitBtn = document.querySelector('.btn-save');
    
    // Validation
    if (!title || !category || !description) {
        showMessage('❌ Please fill in all required fields.', 'error');
        return;
    }
    
    if (title.length < 1) {
        showMessage('❌ Title must be at least 1 characters long.', 'error');
        return;
    }
    
    if (description.length < 5) {
        showMessage('❌ Blog content must be at least 5 characters long.', 'error');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = '💾 Saving...';
    
    try {
        // Update blog in Firestore
        await firebase.firestore().collection('news').doc(articleId).update({
            title: title,
            category: category,
            description: description,
            imageUrl: imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: window.currentUser.email
        });
        
        showMessage('✅ Blog updated successfully! Redirecting...', 'success');
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error updating blog:', error);
        showMessage('❌ Error updating blog: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Save Changes';
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = text;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Scroll to top to see message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
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