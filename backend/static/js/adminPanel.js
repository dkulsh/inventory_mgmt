// Admin Panel functionality
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.initialize();
    }

    async initialize() {
        // Check if user is logged in
        const token = localStorage.getItem('access_token');
        console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');

        if (!token) {
            console.log('No token found, redirecting to login page');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('Fetching user info from /api/v1/users/me');
            // Get current user info
            const response = await fetch('/api/v1/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Auth response status:', response.status);
            
            if (!response.ok) {
                console.error('Auth response not OK:', response.status, response.statusText);
                throw new Error('Failed to get user info');
            }

            this.currentUser = await response.json();
            console.log('User info received:', this.currentUser);
            this.loadContent();
        } catch (error) {
            console.error('Error in initialize:', error);
            // Handle error (e.g., redirect to login)
            window.location.href = 'login.html';
        }
    }

    loadContent() {
        console.log('Loading content for user role:', this.currentUser?.Role);
        const adminContent = document.getElementById('adminContent');
        if (!adminContent) {
            console.error('adminContent element not found');
            return;
        }

        // Clear existing content
        adminContent.innerHTML = '';

        // Load content based on user role
        switch (this.currentUser.Role) {
            case 'SuperAdmin':
            case 'TechAdmin':
            case 'SalesAdmin':
                console.log('Loading admin content');
                this.loadAdminContent();
                break;
            case 'WholesalerAdmin':
                console.log('Loading wholesaler admin content');
                this.loadWholesalerAdminContent();
                break;
            case 'DealerAdmin':
                console.log('Loading dealer admin content');
                this.loadDealerAdminContent();
                break;
            default:
                console.log('No matching role found, showing access denied');
                adminContent.innerHTML = '<div class="alert alert-warning">You do not have access to the admin panel.</div>';
        }
    }

    loadAdminContent() {
        const adminContent = document.getElementById('adminContent');
        adminContent.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Tenant Management</h5>
                            <p class="card-text">Manage tenants and their configurations.</p>
                            <a href="#" class="btn btn-primary" onclick="adminPanel.loadTenantManagement()">Manage Tenants</a>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Business Management</h5>
                            <p class="card-text">Manage wholesalers and dealers.</p>
                            <a href="#" class="btn btn-primary" onclick="adminPanel.loadBusinessManagement()">Manage Businesses</a>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">User Management</h5>
                            <p class="card-text">Manage system users and their roles.</p>
                            <a href="#" class="btn btn-primary" onclick="adminPanel.loadUserManagement()">Manage Users</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadWholesalerAdminContent() {
        const adminContent = document.getElementById('adminContent');
        adminContent.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Manage Dealers</h5>
                            <p class="card-text">Manage dealers in your network.</p>
                            <a href="#" class="btn btn-primary" onclick="adminPanel.loadDealerManagement()">Manage Dealers</a>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Manage Wholesaler Users</h5>
                            <p class="card-text">Manage users within your wholesaler business.</p>
                            <a href="#" class="btn btn-primary" onclick="adminPanel.loadWholesalerUserManagement()">Manage Users</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadDealerAdminContent() {
        const adminContent = document.getElementById('adminContent');
        adminContent.innerHTML = `
            <div class="row">
                <div class="col-md-12 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">Manage Dealer Users</h5>
                            <p class="card-text">Manage users within your dealer business.</p>
                            <a href="#" class="btn btn-primary" onclick="adminPanel.loadDealerUserManagement()">Manage Users</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Placeholder methods for different management sections
    loadTenantManagement() {
        console.log('loadTenantManagement called');
        const adminContent = document.getElementById('adminContent');
        console.log('adminContent element:', adminContent);
        adminContent.innerHTML = `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Tenant Management</h2>
                    <button class="btn btn-primary" onclick="tenantModal.show()">
                        <i class="bi bi-plus"></i> Create Tenant
                    </button>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-search"></i>
                                    </span>
                                    <input type="text" class="form-control" id="tenantSearch" 
                                        placeholder="Search by tenant name...">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="tenantStatusFilter">
                                    <option value="all">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Tenant Name</th>
                                        <th>Status</th>
                                        <th>Type</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="tenantTableBody">
                                    <!-- Tenant rows will be inserted here -->
                                </tbody>
                            </table>
                        </div>

                        <nav aria-label="Tenant pagination">
                            <ul class="pagination justify-content-center" id="tenantPagination">
                                <!-- Pagination will be inserted here -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;

        // Initialize tenant management
        console.log('Initializing tenant management components');
        window.tenantManagement = new TenantManagement();
        window.tenantModal = new TenantModal();
        window.tenantManagement.initialize();
        console.log('Tenant management initialization complete');
    }

    loadBusinessManagement() {
        console.log('Loading business management...');
        // To be implemented
    }

    loadUserManagement() {
        console.log('Loading user management...');
        // To be implemented
    }

    loadDealerManagement() {
        console.log('Loading dealer management...');
        // To be implemented
    }

    loadWholesalerUserManagement() {
        console.log('Loading wholesaler user management...');
        // To be implemented
    }

    loadDealerUserManagement() {
        console.log('Loading dealer user management...');
        // To be implemented
    }
}

// Initialize admin panel when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
}); 