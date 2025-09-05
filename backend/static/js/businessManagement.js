// Business Management JavaScript
class BusinessManagement {
    constructor() {
        this.businesses = [];
        this.currentUser = null;
        this.tenants = [];
        this.searchTimeout = null;
        this.currentTenantId = null;
        this.currentTypeFilter = '';
        
        this.init();
    }

    async init() {
        try {
            // Get current user info
            await this.getCurrentUser();
            
            // Load initial data
            await this.loadTenants();
            await this.loadBusinesses();
            
            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error initializing business management:', error);
            this.showToast('Error loading business management page', 'error');
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
            
            // Set initial tenant based on user role
            if (['SuperAdmin', 'TechAdmin', 'SalesAdmin'].includes(this.currentUser.Role)) {
                // Admin roles can select any tenant
                this.currentTenantId = null;
            } else {
                // Other roles are restricted to their tenant
                this.currentTenantId = this.currentUser.TenantId;
            }
            
        } catch (error) {
            console.error('Error getting current user:', error);
            throw error;
        }
    }

    async loadTenants() {
        try {
            const response = await fetch('/api/v1/tenants/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load tenants');
            }
            
            this.tenants = await response.json();
            this.renderTenantDropdown();
            
        } catch (error) {
            console.error('Error loading tenants:', error);
            this.showToast('Error loading tenants', 'error');
        }
    }

    renderTenantDropdown() {
        const tenantSelect = document.getElementById('tenantSelect');
        
        // Clear existing options except the first one
        tenantSelect.innerHTML = '<option value="">Select Tenant</option>';
        
        // Add tenant options
        this.tenants.forEach(tenant => {
            const option = document.createElement('option');
            option.value = tenant.TenantId;
            option.textContent = tenant.TenantName;
            tenantSelect.appendChild(option);
        });
        
        // Set initial selection based on user role
        if (this.currentTenantId) {
            tenantSelect.value = this.currentTenantId;
            tenantSelect.disabled = true; // Disable for non-admin roles
        }
    }

    async loadBusinesses(search = '', tenantId = null, type = '') {
        try {
            // Use current tenant if not specified
            const targetTenantId = tenantId || this.currentTenantId;
            
            if (!targetTenantId) {
                this.renderBusinessesTable([]);
                return;
            }
            
            const params = new URLSearchParams();
            params.append('tenantId', targetTenantId);
            
            if (type) {
                params.append('type', type);
            }
            
            const response = await fetch(`/api/v1/businesses?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load businesses');
            }
            
            let businesses = await response.json();
            
            // Filter by search term (name only)
            if (search) {
                businesses = businesses.filter(business => 
                    business.Name.toLowerCase().includes(search.toLowerCase())
                );
            }
            
            this.businesses = businesses;
            this.renderBusinessesTable(businesses);
            
        } catch (error) {
            console.error('Error loading businesses:', error);
            this.showToast('Error loading businesses', 'error');
        }
    }

    renderBusinessesTable(businesses) {
        const tbody = document.getElementById('businessesTableBody');
        
        if (businesses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="bi bi-building" style="font-size: 2rem;"></i>
                        <p class="mt-2 mb-0">No businesses found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = businesses.map(business => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3">
                            ${business.Name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="fw-medium">${business.Name}</div>
                            <small class="text-muted">${business.Description || 'No description'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-muted">${business.Email || 'N/A'}</span>
                </td>
                <td>
                    <span class="text-muted">${business.PhoneNumber || 'N/A'}</span>
                </td>
                <td>
                    <span class="badge bg-${this.getTypeBadgeColor(business.Type)}">${business.Type}</span>
                </td>
                <td>
                    <span class="badge bg-${business.Status === 'Active' ? 'success' : 'secondary'}">${business.Status}</span>
                </td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" onclick="businessManagement.editBusiness(${business.Id})" title="Edit Business">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="businessManagement.deleteBusiness(${business.Id})" title="Delete Business">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getTypeBadgeColor(type) {
        return type === 'WHOLESALER' ? 'primary' : 'info';
    }

    setupEventListeners() {
        // Create Business button
        document.getElementById('createBusinessBtn').addEventListener('click', () => {
            this.openBusinessModal();
        });

        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.loadBusinesses(e.target.value, this.currentTenantId, this.currentTypeFilter);
            }, 300);
        });

        // Tenant select
        const tenantSelect = document.getElementById('tenantSelect');
        tenantSelect.addEventListener('change', (e) => {
            this.currentTenantId = e.target.value ? parseInt(e.target.value) : null;
            this.loadBusinesses(document.getElementById('searchInput').value, this.currentTenantId, this.currentTypeFilter);
        });

        // Type filter
        const typeFilter = document.getElementById('typeFilter');
        typeFilter.addEventListener('change', (e) => {
            this.currentTypeFilter = e.target.value;
            this.loadBusinesses(document.getElementById('searchInput').value, this.currentTenantId, this.currentTypeFilter);
        });
    }

    openBusinessModal(businessId = null) {
        // This will be handled by the businessModal.js
        if (window.businessModal) {
            window.businessModal.open(businessId, this.currentUser, this.tenants);
        }
    }

    async editBusiness(businessId) {
        this.openBusinessModal(businessId);
    }

    async deleteBusiness(businessId) {
        const business = this.businesses.find(b => b.Id === businessId);
        if (!business) return;

        // Remove any existing delete modal
        const existingModal = document.getElementById('deleteBusinessModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create new modal container
        const deleteModalContainer = document.createElement('div');
        deleteModalContainer.id = 'deleteBusinessModal';
        document.body.appendChild(deleteModalContainer);
        
        deleteModalContainer.innerHTML = `
        <div class="modal fade" tabindex="-1" id="deleteBusinessModalDialog" aria-labelledby="deleteBusinessModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 12px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div class="modal-body text-center p-5">
                        <div class="mb-4">
                            <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="fw-bold mb-3">Delete Business</h5>
                        <p class="text-muted mb-4" style="font-size: 0.95rem; line-height: 1.5;">Are you sure you want to delete business "${business.Name}"? This action cannot be undone.</p>
                        <div class="d-flex justify-content-center gap-3">
                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal" style="border-radius: 8px;">Cancel</button>
                            <button type="button" class="btn btn-danger px-4" id="confirmDeleteBusinessBtn" style="border-radius: 8px;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        // Get the modal element and initialize it
        const deleteModalElement = document.getElementById('deleteBusinessModalDialog');
        
        if (!deleteModalElement) {
            console.error('Modal element not found!');
            return;
        }

        // Wait for the next tick to ensure DOM is updated
        setTimeout(() => {
            const deleteModalInstance = new bootstrap.Modal(deleteModalElement);
            deleteModalInstance.show();

            // Handle delete confirmation
            const confirmBtn = document.getElementById('confirmDeleteBusinessBtn');
            
            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    try {
                        const response = await fetch(`/api/v1/businesses/${businessId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                            }
                        });

                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.detail || 'Failed to delete business');
                        }

                        this.showToast('Business deleted successfully', 'success');
                        await this.loadBusinesses(
                            document.getElementById('searchInput').value, 
                            this.currentTenantId, 
                            this.currentTypeFilter
                        );
                        
                        // Close modal
                        deleteModalInstance.hide();
                        
                    } catch (error) {
                        console.error('Error deleting business:', error);
                        this.showToast(error.message || 'Error deleting business', 'error');
                    }
                };
            }

            // Clean up modal when hidden
            deleteModalElement.addEventListener('hidden.bs.modal', () => {
                deleteModalContainer.remove();
            });
        }, 10);
    }

    async refreshBusinesses() {
        const searchInput = document.getElementById('searchInput');
        await this.loadBusinesses(searchInput.value, this.currentTenantId, this.currentTypeFilter);
    }

    showToast(message, type = 'info') {
        // Use the same toast function as other pages
        const success = type === 'success';
        showToast(message, success);
    }
}

// Utility: Show toast (same as other pages)
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
    window.businessManagement = new BusinessManagement();
});

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/static/login.html';
}
