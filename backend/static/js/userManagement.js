// User Management JavaScript
class UserManagement {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.businesses = [];
        this.searchTimeout = null;
        
        this.init();
    }

    async init() {
        try {
            // Get current user info
            await this.getCurrentUser();
            
            // Load initial data
            await this.loadUsers();
            await this.loadBusinesses();
            
            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error initializing user management:', error);
            this.showToast('Error loading user management page', 'error');
        }
    }

    async getCurrentUser() {
        try {
            const response = await fetch('/api/v1/users/me', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to get current user');
            }
            
            this.currentUser = await response.json();
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    async loadUsers(search = '') {
        try {
            const params = new URLSearchParams();
            if (search) {
                params.append('search', search);
            }
            
            const response = await fetch(`/api/v1/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load users');
            }
            
            this.users = await response.json();
            this.renderUsersTable();
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.showToast('Error loading users', 'error');
        }
    }

    async loadBusinesses() {
        try {
            const response = await fetch('/api/v1/users/businesses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load businesses');
            }
            
            this.businesses = await response.json();
            
        } catch (error) {
            console.error('Error loading businesses:', error);
            this.showToast('Error loading businesses', 'error');
        }
    }

    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        
        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-people" style="font-size: 2rem;"></i>
                        <p class="mt-2 mb-0">No users found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                            ${user.Name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-medium">${user.Name}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-muted">${user.UserName}</span>
                </td>
                <td>
                    <span class="text-muted">${user.Email}</span>
                </td>
                <td>
                    <span class="badge bg-${this.getRoleBadgeColor(user.Role)}">${user.Role}</span>
                </td>
                <td>
                    <span class="text-muted">${user.businessName || 'N/A'}</span>
                </td>
                <td>
                    <span class="text-muted">${user.PhoneNumber || 'N/A'}</span>
                </td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" onclick="userManagement.editUser(${user.Id})" title="Edit User">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="userManagement.deleteUser(${user.Id})" title="Delete User">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getRoleBadgeColor(role) {
        const colors = {
            'SuperAdmin': 'danger',
            'TechAdmin': 'warning',
            'SalesAdmin': 'info',
            'WholesalerAdmin': 'primary',
            'Wholesaler': 'secondary',
            'DealerAdmin': 'success',
            'Dealer': 'light text-dark'
        };
        return colors[role] || 'secondary';
    }

    setupEventListeners() {
        // Create User button
        document.getElementById('createUserBtn').addEventListener('click', () => {
            this.openUserModal();
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.loadUsers(e.target.value);
            }, 300);
        });
    }

    openUserModal(userId = null) {
        // This will be handled by the userModal.js
        if (window.userModal) {
            window.userModal.open(userId, this.currentUser, this.businesses);
        }
    }

    async editUser(userId) {
        this.openUserModal(userId);
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.Id === userId);
        if (!user) return;

        // Remove any existing delete modal
        const existingModal = document.getElementById('deleteUserModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create new modal container
        const deleteModalContainer = document.createElement('div');
        deleteModalContainer.id = 'deleteUserModal';
        document.body.appendChild(deleteModalContainer);
        
        deleteModalContainer.innerHTML = `
        <div class="modal fade" tabindex="-1" id="deleteUserModalDialog" aria-labelledby="deleteUserModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 12px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div class="modal-body text-center p-5">
                        <div class="mb-4">
                            <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="fw-bold mb-3">Delete User</h5>
                        <p class="text-muted mb-4" style="font-size: 0.95rem; line-height: 1.5;">Are you sure you want to delete user "${user.Name}"? This action cannot be undone.</p>
                        <div class="d-flex justify-content-center gap-3">
                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal" style="border-radius: 8px;">Cancel</button>
                            <button type="button" class="btn btn-danger px-4" id="confirmDeleteUserBtn" style="border-radius: 8px;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        // Get the modal element and initialize it
        const deleteModalElement = document.getElementById('deleteUserModalDialog');
        
        if (!deleteModalElement) {
            console.error('Modal element not found!');
            return;
        }

        // Wait for the next tick to ensure DOM is updated
        setTimeout(() => {
            const deleteModalInstance = new bootstrap.Modal(deleteModalElement);
            deleteModalInstance.show();

            // Handle delete confirmation
            const confirmBtn = document.getElementById('confirmDeleteUserBtn');
            
            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    try {
                        const response = await fetch(`/api/v1/users/${userId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                            }
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.detail || 'Failed to delete user');
                        }

                        this.showToast('User deleted successfully', 'success');
                        await this.loadUsers();
                        
                        // Close modal
                        deleteModalInstance.hide();
                        
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        this.showToast(error.message || 'Error deleting user', 'error');
                    }
                };
            }

            // Clean up modal when hidden
            deleteModalElement.addEventListener('hidden.bs.modal', () => {
                deleteModalContainer.remove();
            });
        }, 10);
    }

    async refreshUsers() {
        const searchInput = document.getElementById('searchInput');
        await this.loadUsers(searchInput.value);
    }

    showToast(message, type = 'info') {
        // Use the same toast function as products page
        const success = type === 'success';
        showToast(message, success);
    }
}

// Utility: Show toast (same as products page)
function showToast(msg, success=true) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = `toast align-items-center text-white bg-${success ? 'success' : 'danger'} border-0 position-fixed bottom-0 end-0 m-4`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.style.zIndex = '3000';
        toast.style.minWidth = '200px';
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${msg}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        document.body.appendChild(toast);
    } else {
        toast.querySelector('.toast-body').textContent = msg;
        toast.className = `toast align-items-center text-white bg-${success ? 'success' : 'danger'} border-0 position-fixed bottom-0 end-0 m-4`;
    }
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManagement = new UserManagement();
});

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/static/login.html';
}
