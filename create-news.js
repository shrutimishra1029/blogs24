// create-news.js
document.addEventListener('DOMContentLoaded', () => {

    // Image URL preview
const imageUrlInput = document.getElementById('news-image-url');
const imagePreview = document.getElementById('image-preview');

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
            
            imagePreview.onload = () => {
                showMessage('✅ Image loaded successfully', 'success');
            };
        } else {
            imagePreview.style.display = 'none';
            imagePreview.src = '';
        }
    });
}

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

    // Check access and load form
    waitForUser(checkAccessAndLoadForm);
});

function checkAccessAndLoadForm() {
    const contentDiv = document.getElementById('create-news-content');
    
    // Check if user is logged in
    if (!window.currentUser) {
        contentDiv.innerHTML = `
            <div class="access-denied">
                <h2>🔒 Access Denied</h2>
                <p>Please login to access this page.</p>
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
                <p>You need admin privileges to create blog posts.</p>
                <p style="color: #666; margin-top: 10px;">Current role: <strong>${userRole}</strong></p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px; padding: 12px 24px; text-decoration: none;">
                    Return to Home
                </a>
            </div>
        `;
        return;
    }
    
    // User has access - show the form
    loadCreateNewsForm();
}

function loadCreateNewsForm() {
    const contentDiv = document.getElementById('create-news-content');
    
    contentDiv.innerHTML = `
        <div id="form-message" class="form-message"></div>

        <form id="create-news-form">
            <div class="form-group">
                <label for="news-title">
                    Blog Title <span class="required">*</span>
                </label>
                <input 
                    type="text" 
                    id="news-title" 
                    placeholder="Enter a headline..." 
                    maxlength="150"
                    required>
                <div class="char-counter">
                    <span id="title-counter">0</span>/150
                </div>
            </div>

            <div class="form-group">
                <label for="news-category">
                    Category <span class="required">*</span>
                </label>
                <select id="news-category" required>
                    <option value="">-- Select Category --</option>
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
                <label for="news-description">
                    Article Content <span class="required">*</span>
                </label>
                <textarea 
                    id="news-description" 
                    placeholder="Write your blog post here..." 
                    maxlength="5000"
                    required></textarea>
                <div class="char-counter">
                    <span id="description-counter">0</span>/5000
                </div>
            </div>

            <div class="form-group">
                <label for="news-image-url">Article Image URL (Optional)</label>
                <input 
                    type="url" 
                    id="news-image-url" 
                    placeholder="https://example.com/image.jpg"
                    class="input-field"
                >
                <p style="font-size: 12px; color: #666; margin-top: 8px; line-height: 1.5;">
                     <strong>Do this:</strong> Upload image to 
                    <a href="https://imgur.com/upload" target="_blank" style="color: #ff0000; text-decoration: underline;">Imgur</a> or 
                    <a href="https://imgbb.com/" target="_blank" style="color: #ff0000; text-decoration: underline;">ImgBB</a> 
                    , paste the link here. Leave blank for a placeholder image.
                </p>
                <img id="image-preview" class="image-preview" src="" alt="Preview" style="display: none; max-width: 100%; margin-top: 15px; border-radius: 8px; border: 2px solid #e0e0e0;">
            </div>

            <button type="submit" class="btn-submit">
                📰 Publish Article
            </button>
        </form>
    `;
    
    // Initialize form functionality
    initializeForm();
}

function initializeForm() {
    const form = document.getElementById('create-news-form');
    const titleInput = document.getElementById('news-title');
    const descriptionInput = document.getElementById('news-description');
    const imageInput = document.getElementById('news-image');
    const imagePreview = document.getElementById('image-preview');
    
    // Character counters
    titleInput.addEventListener('input', () => {
        document.getElementById('title-counter').textContent = titleInput.value.length;
    });
    
    descriptionInput.addEventListener('input', () => {
        document.getElementById('description-counter').textContent = descriptionInput.value.length;
    });
    
    // Image URL preview (updated for URL input instead of file input)
const imageUrlInput = document.getElementById('news-image-url');
if (imageUrlInput) {
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
            
            imagePreview.onload = () => {
                // Image loaded successfully - no message needed
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
    await publishNews();
});
}

async function publishNews() {
    const title = document.getElementById('news-title').value.trim();
    const category = document.getElementById('news-category').value;
    const description = document.getElementById('news-description').value.trim();
    const submitBtn = document.querySelector('.btn-submit');
    
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
    submitBtn.textContent = '📤 Publishing...';
    
    try {
        // Get image URL from input or use placeholder
        const imageUrlInput = document.getElementById('news-image-url');
        const imageUrl = imageUrlInput?.value.trim() ||         'https://via.placeholder.com/800x400/c41e3a/ffffff?text=Blog+Cover+Image';
        
        // Create news document
        const newsData = {
            title: title,
            category: category,
            description: description,
            imageUrl: imageUrl,
            author: window.currentUser.name || 'Admin',
            authorEmail: window.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            likes: [],
            bookmarks: [],
            comments: [],
            status: 'published'
        };
        
        // Add to Firestore
        await firebase.firestore().collection('news').add(newsData);
        
        showMessage('✅ Blog published successfully!', 'success');
        
        // Reset form after 2 seconds
        setTimeout(() => {
            document.getElementById('create-news-form').reset();
            const imagePreview = document.getElementById('image-preview');
            if (imagePreview) {
                imagePreview.style.display = 'none';
                imagePreview.src = '';
            }
            const titleCounter = document.getElementById('title-counter');
            const descCounter = document.getElementById('description-counter');
            if (titleCounter) titleCounter.textContent = '0';
            if (descCounter) descCounter.textContent = '0';
            submitBtn.disabled = false;
            submitBtn.textContent = '📝 Publish Blog';
        }, 2000);
        
    } catch (error) {
        console.error('Error publishing blog:', error);
        showMessage('❌ Error publishing blog: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '📝 Publish Blog';
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