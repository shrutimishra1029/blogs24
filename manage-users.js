// manage-users.js
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

    // Check access and load users
    waitForUser(checkAccessAndLoadUsers);
});

function checkAccessAndLoadUsers() {
    const contentDiv = document.getElementById('manage-users-content');
    
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
    
    // Check if user is superadmin
    const userRole = window.currentUser.role || 'user';
    if (userRole !== 'superadmin') {
        contentDiv.innerHTML = `
            <div class="access-denied">
                <h2>❌ Access Denied</h2>
                <p>Only superadmins can manage users.</p>
                <p style="color: #666; margin-top: 10px;">Current role: <strong>${userRole}</strong></p>
                <a href="index.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px; padding: 12px 24px; text-decoration: none;">
                    Return to Home
                </a>
            </div>
        `;
        return;
    }
    
    // User is superadmin - load the management interface
    loadManagementInterface();
}

function loadManagementInterface() {
    const contentDiv = document.getElementById('manage-users-content');
    
    contentDiv.innerHTML = `
        <div id="form-message" class="form-message"></div>

        <!-- Stats Cards -->
        <div class="stats-cards">
            <div class="stat-card users">
                <h3>Total Users</h3>
                <div class="stat-number" id="stat-users">0</div>
            </div>
            <div class="stat-card admins">
                <h3>Admins</h3>
                <div class="stat-number" id="stat-admins">0</div>
            </div>
            <div class="stat-card superadmins">
                <h3>Superadmins</h3>
                <div class="stat-number" id="stat-superadmins">0</div>
            </div>
        </div>

        <!-- Add/Edit User Section -->
        <div class="add-user-section">
            <h2>Assign User Role</h2>
            <div class="add-user-form">
                <div class="form-field">
                    <label for="user-email">Google Account Email *</label>
                    <input type="email" id="user-email" placeholder="email">
                </div>
                
                <div class="form-field">
                    <label for="user-name">Name (Optional)</label>
                    <input type="text" id="user-name" placeholder="Name">
                </div>
                
                <div class="form-field">
                    <label for="user-role">Role *</label>
                    <select id="user-role">
                        <option value="">-- Select --</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                    </select>
                </div>
                
                <button class="btn-add-user" onclick="addOrUpdateUser()">
                    ✓ Assign Role
                </button>
            </div>
        </div>

        <!-- Users List -->
        <div class="users-list-section">
            <h2>📋 All Users</h2>
            <div class="users-table-container">
                <table class="users-table" id="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Assigned By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 40px; color: #999;">
                                Loading users...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Load users from Firestore
    loadUsersList();
}

function loadUsersList() {
    firebase.firestore().collection('users').get()
        .then((snapshot) => {
            const tbody = document.getElementById('users-tbody');
            
            if (snapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5">
                            <div class="empty-state">
                                <div class="empty-state-icon">👥</div>
                                <p>No users found. Add your first user above.</p>
                            </div>
                        </td>
                    </tr>
                `;
                updateStats(0, 0, 0);
                return;
            }
            
            let usersHTML = '';
            let userCount = 0;
            let adminCount = 0;
            let superadminCount = 0;
            
            snapshot.forEach((doc) => {
                const user = doc.data();
                const email = doc.id;
                const name = user.name || 'N/A';
                const role = user.role || 'user';
                const assignedBy = user.assignedBy || 'N/A';
                
                // Count roles
                if (role === 'user') userCount++;
                else if (role === 'admin') adminCount++;
                else if (role === 'superadmin') superadminCount++;
                
                // Prevent deleting yourself
                const isCurrentUser = email === window.currentUser.email;
                
                usersHTML += `
                    <tr>
                        <td>${name}</td>
                        <td>${email}</td>
                        <td><span class="role-badge role-${role}">${role}</span></td>
                        <td>${assignedBy}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-small btn-edit" onclick="editUser('${email}', '${name}', '${role}')">
                                    ✏️ Edit
                                </button>
                                ${!isCurrentUser ? `
                                    <button class="btn-small btn-delete" onclick="deleteUser('${email}')">
                                        🗑️ Delete
                                    </button>
                                ` : '<span style="color: #999; font-size: 0.85rem;">(You)</span>'}
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = usersHTML;
            updateStats(userCount, adminCount, superadminCount);
        })
        .catch((error) => {
            console.error('Error loading users:', error);
            document.getElementById('users-tbody').innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #c41e3a;">
                        ❌ Error loading users: ${error.message}
                    </td>
                </tr>
            `;
        });
}

function updateStats(users, admins, superadmins) {
    document.getElementById('stat-users').textContent = users;
    document.getElementById('stat-admins').textContent = admins;
    document.getElementById('stat-superadmins').textContent = superadmins;
}

function addOrUpdateUser() {
    const email = document.getElementById('user-email').value.trim();
    const name = document.getElementById('user-name').value.trim();
    const role = document.getElementById('user-role').value;
    
    if (!email || !role) {
        showMessage('❌ Please provide email and role.', 'error');
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('❌ Please enter a valid email address.', 'error');
        return;
    }
    
    const userData = {
        email: email,
        role: role,
        assignedBy: window.currentUser.email,
        assignedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (name) {
        userData.name = name;
    }
    
    // Save to Firestore
    firebase.firestore().collection('users').doc(email).set(userData, { merge: true })
        .then(() => {
            showMessage(`✅ Role "${role}" assigned to ${email} successfully!`, 'success');
            
            // Clear form
            document.getElementById('user-email').value = '';
            document.getElementById('user-name').value = '';
            document.getElementById('user-role').value = '';
            
            // Reload users list
            loadUsersList();
        })
        .catch((error) => {
            console.error('Error assigning role:', error);
            showMessage('❌ Error: ' + error.message, 'error');
        });
}

function editUser(email, name, currentRole) {
    // Pre-fill the form
    document.getElementById('user-email').value = email;
    document.getElementById('user-name').value = name === 'N/A' ? '' : name;
    document.getElementById('user-role').value = currentRole;
    
    // Scroll to form
    document.querySelector('.add-user-section').scrollIntoView({ behavior: 'smooth' });
    
    showMessage('ℹ️ User loaded. Modify role and click "Assign Role" to update.', 'info');
}

async function deleteUser(email) {
    if (email === window.currentUser.email) {
        showMessage('❌ You cannot delete your own account.', 'error');
        return;
    }
    
    const confirmDelete = await window.appPopup.confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`, {
        title: 'Delete user',
        type: 'warning',
        confirmLabel: 'Delete user'
    });
    
    if (!confirmDelete) return;
    
    const db = firebase.firestore();
    const batch = db.batch();
    batch.delete(db.collection('users').doc(email));
    batch.delete(db.collection('userSettings').doc(email));
    batch.delete(db.collection('publicProfiles').doc(email));
    batch.commit()
        .then(() => {
            showMessage(`✅ User ${email} deleted successfully.`, 'success');
            loadUsersList();
        })
        .catch((error) => {
            console.error('Error deleting user:', error);
            showMessage('❌ Error deleting user: ' + error.message, 'error');
        });
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