class TenantManagement {
    constructor() {
        this.tenants = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.searchTerm = '';
        this.statusFilter = 'all';
    }

    async initialize() {
        await this.loadTenants();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Create Tenant button handler
        const createBtn = document.getElementById('createTenantBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                if (window.tenantModal) {
                    window.tenantModal.show();
                }
            });
        }

        // Search input handler
        const searchInput = document.getElementById('tenantSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                this.searchTerm = searchInput.value;
                this.currentPage = 1;
                this.loadTenants();
            }, 300));
        }

        // Status filter handler
        const statusFilter = document.getElementById('tenantStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.statusFilter = statusFilter.value;
                this.currentPage = 1;
                this.loadTenants();
            });
        }
    }

    async loadTenants() {
        try {
            const token = localStorage.getItem('access_token');
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize,
                search: this.searchTerm,
                status: this.statusFilter !== 'all' ? this.statusFilter : ''
            });

            console.log('Fetching tenants with params:', queryParams.toString());
            const response = await fetch(`/api/v1/tenants/?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tenants');
            }

            const data = await response.json();
            console.log('Received tenant data:', data);
            
            // Handle both response formats - direct array or object with items
            this.tenants = Array.isArray(data) ? data : (data.items || []);
            this.totalPages = data.totalPages || 1;
            
            console.log('Processed tenants:', this.tenants);
            this.renderTenants();
        } catch (error) {
            console.error('Error loading tenants:', error);
            showToast('Error loading tenants', 'error');
        }
    }

    renderTenants() {
        const tableBody = document.getElementById('tenantTableBody');
        console.log('Table body element:', tableBody);
        console.log('Current tenants:', this.tenants);
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }

        tableBody.innerHTML = this.tenants.map(tenant => `
            <tr>
                <td>${tenant.TenantName}</td>
                <td><span class="badge bg-${getStatusBadgeClass(tenant.TenantStatus)}">${tenant.TenantStatus}</span></td>
                <td>${tenant.TenantType || '-'}</td>
                <td>${formatDate(tenant.TenantStartDateTime)}</td>
                <td>${formatDate(tenant.TenantEndDateTime)}</td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" onclick="tenantManagement.editTenant(${tenant.TenantId})" title="Edit Tenant">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="tenantManagement.deleteTenant(${tenant.TenantId})" title="Delete Tenant">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    renderPagination() {
        const pagination = document.getElementById('tenantPagination');
        if (!pagination) return;

        let paginationHtml = `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="tenantManagement.changePage(${this.currentPage - 1})">Previous</a>
            </li>
        `;

        for (let i = 1; i <= this.totalPages; i++) {
            paginationHtml += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="tenantManagement.changePage(${i})">${i}</a>
                </li>
            `;
        }

        paginationHtml += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="tenantManagement.changePage(${this.currentPage + 1})">Next</a>
            </li>
        `;

        pagination.innerHTML = paginationHtml;
    }

    async changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        await this.loadTenants();
    }

    async createTenant(tenantData) {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/v1/tenants/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tenantData)
            });

            if (!response.ok) {
                throw new Error('Failed to create tenant');
            }

            showToast('Tenant created successfully', 'success');
            await this.loadTenants();
            return true;
        } catch (error) {
            console.error('Error creating tenant:', error);
            showToast('Error creating tenant', 'error');
            return false;
        }
    }

    async editTenant(tenantId) {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/v1/tenants/${tenantId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tenant details');
            }

            const tenant = await response.json();
            window.tenantModal.show(tenant);
        } catch (error) {
            console.error('Error fetching tenant details:', error);
            showToast('Error fetching tenant details', 'error');
        }
    }

    async updateTenant(tenantId, tenantData) {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/v1/tenants/${tenantId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tenantData)
            });

            if (!response.ok) {
                throw new Error('Failed to update tenant');
            }

            showToast('Tenant updated successfully', 'success');
            await this.loadTenants();
            return true;
        } catch (error) {
            console.error('Error updating tenant:', error);
            showToast('Error updating tenant', 'error');
            return false;
        }
    }

    async deleteTenant(tenantId) {
        // Remove any existing delete modal
        const existingModal = document.getElementById('deleteTenantModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create new modal container
        const deleteModalContainer = document.createElement('div');
        deleteModalContainer.id = 'deleteTenantModal';
        document.body.appendChild(deleteModalContainer);
        
        deleteModalContainer.innerHTML = `
        <div class="modal fade" tabindex="-1" id="deleteTenantModalDialog" aria-labelledby="deleteTenantModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 12px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div class="modal-body text-center p-5">
                        <div class="mb-4">
                            <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="fw-bold mb-3">Delete Tenant</h5>
                        <p class="text-muted mb-4" style="font-size: 0.95rem; line-height: 1.5;">Are you sure you want to delete this tenant? This action cannot be undone.</p>
                        <div class="d-flex justify-content-center gap-3">
                            <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal" style="border-radius: 8px;">Cancel</button>
                            <button type="button" class="btn btn-danger px-4" id="confirmDeleteBtn" style="border-radius: 8px;">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        // Get the modal element and initialize it
        const deleteModalElement = document.getElementById('deleteTenantModalDialog');
        if (!deleteModalElement) {
            console.error('Modal element not found!');
            return;
        }

        // Wait for the next tick to ensure DOM is updated
        setTimeout(() => {
            const deleteModalInstance = new bootstrap.Modal(deleteModalElement);
            deleteModalInstance.show();

            // Handle delete confirmation
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            if (confirmBtn) {
                confirmBtn.onclick = async () => {
                    try {
                        const token = localStorage.getItem('access_token');
                        const response = await fetch(`/api/v1/tenants/${tenantId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error('Failed to delete tenant');
                        }

                        showToast('Tenant deleted successfully', 'success');
                        deleteModalInstance.hide();
                        await this.loadTenants();
                    } catch (error) {
                        console.error('Error deleting tenant:', error);
                        showToast('Error deleting tenant', 'error');
                    }
                };
            }

            // Clean up modal when hidden
            deleteModalElement.addEventListener('hidden.bs.modal', function () {
                deleteModalContainer.remove();
            });
        }, 0);
    }


}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'active':
            return 'success';
        case 'inactive':
            return 'warning';
        case 'suspended':
            return 'danger';
        default:
            return 'secondary';
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
}

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

// Export the class
window.TenantManagement = TenantManagement;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tenantManagement = new TenantManagement();
    window.tenantManagement.initialize();
});

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/static/login.html';
} 