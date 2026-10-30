// sidebar.js - Shared across all pages
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'enabled' || savedDarkMode === 'disabled') {
    document.body.classList.toggle('dark-mode', savedDarkMode === 'enabled');
}

document.addEventListener('DOMContentLoaded', () => {
    
    console.log("Sidebar script loaded");
    
    // Hamburger Sidebar
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const closeSidebar = document.querySelector('.close-sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Mobile Menu Toggle
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Sidebar Functions
    if (hamburger && sidebar && sidebarOverlay) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeSidebar && sidebar && sidebarOverlay) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (sidebarOverlay && sidebar) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

function waitForUser(callback) {
    if (window.currentUser !== undefined) {
        // User data is loaded (could be null or object)
        callback();
    } else {
        // Wait and check again
        setTimeout(() => waitForUser(callback), 100);
    }
}
