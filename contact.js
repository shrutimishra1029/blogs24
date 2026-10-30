// contact.js
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

    // Initialize contact form
    initContactForm();
});

function initContactForm() {
    const form = document.getElementById('contact-form');
    
    if (!form) return;

    // Pre-fill name and email if user is logged in
    if (window.currentUser) {
        document.getElementById('contact-name').value = window.currentUser.name || '';
        document.getElementById('contact-email').value = window.currentUser.email || '';
    }

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const category = document.getElementById('contact-category').value;
        const subject = document.getElementById('contact-subject').value.trim();
        const message = document.getElementById('contact-message').value.trim();
        
        if (!name || !email || !category || !subject || !message) {
            showMessage('Please fill in all fields', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            // Save feedback to Firestore
            await firebase.firestore().collection('feedback').add({
                name: name,
                email: email,
                category: category,
                subject: subject,
                message: message,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userId: window.currentUser?.email || 'anonymous'
            });
            
            showMessage('✅ Thank you! Your message has been sent successfully.', 'success');
            form.reset();
            
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showMessage('❌ Error sending message. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.textContent = text;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    
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