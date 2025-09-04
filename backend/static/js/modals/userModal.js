// User Modal JavaScript
class UserModal {
    constructor() {
        this.modal = null;
        this.currentUser = null;
        this.businesses = [];
        this.editingUserId = null;
        this.isEditMode = false;
        
        this.createModal();
    }

    createModal() {
        const modalHtml = `
            <div class="modal fade" id="userModal" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="userModalLabel">Create User</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="userForm">
                                <!-- Name (Full Width) -->
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="userName" class="form-label">Name <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="userName" name="Name" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Email and Phone Number -->
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userEmail" class="form-label">Email <span class="text-danger">*</span></label>
                                            <input type="email" class="form-control" id="userEmail" name="Email" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userPhone" class="form-label">Phone Number</label>
                                            <input type="tel" class="form-control" id="userPhone" name="PhoneNumber">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Username and Password -->
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userUsername" class="form-label">Username <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="userUsername" name="UserName" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userPassword" class="form-label">Password <span class="text-danger">*</span></label>
                                            <input type="password" class="form-control" id="userPassword" name="Password" required>
                                            <div class="form-text" id="passwordHelp">Leave blank to keep current password when editing</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Role and Business -->
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="userRole" class="form-label">Role <span class="text-danger">*</span></label>
                                            <select class="form-select" id="userRole" name="Role" required>
                                                <option value="">Select Role</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6" id="businessRow">
                                        <div class="mb-3">
                                            <label for="userBusiness" class="form-label">Business</label>
                                            <select class="form-select" id="userBusiness" name="BusinessId">
                                                <option value="">Select Business</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveUserBtn">Save User</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = new bootstrap.Modal(document.getElementById('userModal'));
        
        // Setup event listeners
        document.getElementById('saveUserBtn').addEventListener('click', () => {
            this.saveUser();
        });
        
        // Setup role change handler
        document.getElementById('userRole').addEventListener('change', () => {
            this.handleRoleChange();
        });
    }

    open(userId = null, currentUser = null, businesses = []) {
        this.currentUser = currentUser;
        this.businesses = businesses;
        this.editingUserId = userId;
        this.isEditMode = !!userId;
        
        // Update modal title
        const title = document.getElementById('userModalLabel');
        title.textContent = this.isEditMode ? 'Edit User' : 'Create User';
        
        // Reset form
        this.resetForm();
        
        // Setup form based on current user role
        this.setupFormForCurrentUser();
        
        // Load user data if editing
        if (this.isEditMode) {
            this.loadUserData(userId);
        }
        
        // Show modal
        this.modal.show();
    }

    resetForm() {
        const form = document.getElementById('userForm');
        form.reset();
        
        // Clear select options
        document.getElementById('userRole').innerHTML = '<option value="">Select Role</option>';
        document.getElementById('userBusiness').innerHTML = '<option value="">Select Business</option>';
        
        // Reset password field
        const passwordField = document.getElementById('userPassword');
        const passwordHelp = document.getElementById('passwordHelp');
        
        if (this.isEditMode) {
            passwordField.required = false;
            passwordHelp.textContent = 'Leave blank to keep current password';
        } else {
            passwordField.required = true;
            passwordHelp.textContent = '';
        }
    }

    setupFormForCurrentUser() {
        const roleSelect = document.getElementById('userRole');
        const businessSelect = document.getElementById('userBusiness');
        const businessRow = document.getElementById('businessRow');
        
        // Setup role options based on current user role
        const availableRoles = this.getAvailableRoles();
        availableRoles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            roleSelect.appendChild(option);
        });
        
        // Setup business options
        this.businesses.forEach(business => {
            const option = document.createElement('option');
            option.value = business.Id;
            option.textContent = business.Name;
            businessSelect.appendChild(option);
        });
        
        // Handle role-based visibility and restrictions
        if (['SuperAdmin', 'TechAdmin', 'SalesAdmin'].includes(this.currentUser.Role)) {
            // Can select any business
            businessRow.style.display = 'block';
        } else if (['WholesalerAdmin', 'Wholesaler', 'DealerAdmin', 'Dealer'].includes(this.currentUser.Role)) {
            // Pre-select their business and make it non-editable
            businessSelect.value = this.currentUser.BusinessId;
            businessSelect.disabled = true;
            businessRow.style.display = 'block';
        }
        
        // Handle role restrictions
        if (this.currentUser.Role === 'WholesalerAdmin') {
            // Can only create Wholesaler users
            roleSelect.value = 'Wholesaler';
            roleSelect.disabled = true;
        } else if (this.currentUser.Role === 'DealerAdmin') {
            // Can only create Dealer users
            roleSelect.value = 'Dealer';
            roleSelect.disabled = true;
        }
    }

    getAvailableRoles() {
        const allRoles = ['SuperAdmin', 'TechAdmin', 'SalesAdmin', 'WholesalerAdmin', 'Wholesaler', 'DealerAdmin', 'Dealer'];
        
        switch (this.currentUser.Role) {
            case 'SuperAdmin':
            case 'TechAdmin':
            case 'SalesAdmin':
                return allRoles;
            case 'WholesalerAdmin':
                return ['Wholesaler'];
            case 'DealerAdmin':
                return ['Dealer'];
            default:
                return [];
        }
    }

    handleRoleChange() {
        const selectedRole = document.getElementById('userRole').value;
        const businessSelect = document.getElementById('userBusiness');
        
        // Filter businesses based on selected role
        if (selectedRole === 'Wholesaler' || selectedRole === 'WholesalerAdmin') {
            // Show only Wholesaler businesses
            Array.from(businessSelect.options).forEach(option => {
                if (option.value) {
                    const business = this.businesses.find(b => b.Id == option.value);
                    option.style.display = business && business.Type === 'WHOLESALER' ? 'block' : 'none';
                }
            });
        } else if (selectedRole === 'Dealer' || selectedRole === 'DealerAdmin') {
            // Show only Dealer businesses
            Array.from(businessSelect.options).forEach(option => {
                if (option.value) {
                    const business = this.businesses.find(b => b.Id == option.value);
                    option.style.display = business && business.Type === 'DEALER' ? 'block' : 'none';
                }
            });
        } else {
            // Show all businesses
            Array.from(businessSelect.options).forEach(option => {
                option.style.display = 'block';
            });
        }
    }

    async loadUserData(userId) {
        try {
            const response = await fetch(`/api/v1/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load user data');
            }
            
            const user = await response.json();
            
            // Populate form fields
            document.getElementById('userName').value = user.Name;
            document.getElementById('userUsername').value = user.UserName;
            document.getElementById('userEmail').value = user.Email;
            document.getElementById('userPhone').value = user.PhoneNumber || '';
            document.getElementById('userRole').value = user.Role;
            document.getElementById('userBusiness').value = user.BusinessId || '';
            
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showToast('Error loading user data', 'error');
        }
    }

    async saveUser() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Prepare user data
        // Get values directly from DOM elements to handle disabled fields
        const roleSelect = document.getElementById('userRole');
        const businessSelect = document.getElementById('userBusiness');
        
        const userData = {
            TenantId: this.currentUser.TenantId, // Include current user's tenant ID
            Name: formData.get('Name'),
            UserName: formData.get('UserName'),
            Email: formData.get('Email'),
            PhoneNumber: formData.get('PhoneNumber') || null,
            Role: roleSelect.value, // Get directly from DOM element
            BusinessId: businessSelect.value ? parseInt(businessSelect.value) : null // Get directly from DOM element
        };
        
        // Add password if provided (for create) or if editing and password is provided
        const password = formData.get('Password');
        if (password && (password.trim() !== '' || !this.isEditMode)) {
            userData.Password = password;
        }
        
        try {
            const url = this.isEditMode ? `/api/v1/users/${this.editingUserId}` : '/api/v1/users';
            const method = this.isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `Failed to ${this.isEditMode ? 'update' : 'create'} user`);
            }
            
            const action = this.isEditMode ? 'updated' : 'created';
            this.showToast(`User ${action} successfully`, 'success');
            
            // Close modal
            this.modal.hide();
            
            // Refresh users list
            if (window.userManagement) {
                window.userManagement.refreshUsers();
            }
            
        } catch (error) {
            console.error('Error saving user:', error);
            this.showToast(error.message || `Error ${this.isEditMode ? 'updating' : 'creating'} user`, 'error');
        }
    }

    showToast(message, type = 'info') {
        if (window.userManagement) {
            window.userManagement.showToast(message, type);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userModal = new UserModal();
});
