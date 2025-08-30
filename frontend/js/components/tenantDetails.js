class TenantDetails {
    constructor() {
        this.tenantId = null;
        this.tenantData = null;
        this.wholesalerData = null;
        this.dealers = [];
        this.userRole = null;
    }

    async initialize() {
        // Get tenant ID from URL
        const pathParts = window.location.pathname.split('/');
        this.tenantId = pathParts[pathParts.length - 1];
        
        // Get user role from sessionStorage
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        this.userRole = userInfo?.Role;

        // Load tenant data from sessionStorage (set by tenantManagement.js)
        const storedTenant = sessionStorage.getItem('currentTenant');
        if (storedTenant) {
            this.tenantData = JSON.parse(storedTenant);
            this.renderTenantInfo();
        } else {
            // If not in sessionStorage, fetch from API
            await this.fetchTenantData();
        }

        // Load wholesaler and dealers data
        await this.loadWholesalerData();
        await this.loadDealersData();

        // Setup event listeners
        this.setupEventListeners();
    }

    async fetchTenantData() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/v1/tenants/${this.tenantId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tenant details');
            }

            this.tenantData = await response.json();
            this.renderTenantInfo();
        } catch (error) {
            console.error('Error fetching tenant data:', error);
            showToast('Error fetching tenant details', 'error');
        }
    }

    renderTenantInfo() {
        const tenantInfo = document.getElementById('tenantInfo');
        if (!tenantInfo || !this.tenantData) return;

        tenantInfo.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Name:</strong> ${this.tenantData.TenantName}</p>
                    <p><strong>Status:</strong> <span class="badge bg-${getStatusBadgeClass(this.tenantData.TenantStatus)}">${this.tenantData.TenantStatus}</span></p>
                    <p><strong>Type:</strong> ${this.tenantData.TenantType || '-'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Start Date:</strong> ${formatDate(this.tenantData.TenantStartDateTime)}</p>
                    <p><strong>End Date:</strong> ${formatDate(this.tenantData.TenantEndDateTime)}</p>
                    <p><strong>Description:</strong> ${this.tenantData.TenantDescription || '-'}</p>
                </div>
            </div>
        `;
    }

    async loadWholesalerData() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/v1/businesses?tenantId=${this.tenantId}&type=WHOLESALER`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch wholesaler data');
            }

            const data = await response.json();
            this.wholesalerData = data.items?.[0] || null;
            this.renderWholesalerInfo();
        } catch (error) {
            console.error('Error loading wholesaler data:', error);
            showToast('Error loading wholesaler information', 'error');
        }
    }

    renderWholesalerInfo() {
        const wholesalerInfo = document.getElementById('wholesalerInfo');
        const createWholesalerBtn = document.getElementById('createWholesalerBtn');
        
        if (!wholesalerInfo) return;

        // Show/hide create button based on role and existing wholesaler
        if (createWholesalerBtn) {
            const canCreateWholesaler = ['SuperAdmin', 'TechAdmin', 'SalesAdmin'].includes(this.userRole);
            createWholesalerBtn.style.display = (!this.wholesalerData && canCreateWholesaler) ? 'block' : 'none';
        }

        if (this.wholesalerData) {
            wholesalerInfo.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Name:</strong> ${this.wholesalerData.Name}</p>
                        <p><strong>Email:</strong> ${this.wholesalerData.Email || '-'}</p>
                        <p><strong>Phone:</strong> ${this.wholesalerData.PhoneNumber || '-'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Status:</strong> <span class="badge bg-${getStatusBadgeClass(this.wholesalerData.Status)}">${this.wholesalerData.Status}</span></p>
                        <p><strong>Address:</strong> ${this.wholesalerData.AddressLine1 || '-'}</p>
                        ${this.wholesalerData.AddressLine2 ? `<p><strong>Address 2:</strong> ${this.wholesalerData.AddressLine2}</p>` : ''}
                    </div>
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-primary me-2" onclick="tenantDetails.editWholesaler(${this.wholesalerData.Id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-info me-2" onclick="tenantDetails.manageWholesalerUsers(${this.wholesalerData.Id})">
                        <i class="bi bi-people"></i> Manage Users
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="tenantDetails.deleteWholesaler(${this.wholesalerData.Id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            `;
        } else {
            wholesalerInfo.innerHTML = '<p class="text-muted">No wholesaler information available.</p>';
        }
    }

    async loadDealersData() {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`/api/v1/businesses?tenantId=${this.tenantId}&type=DEALER`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dealers data');
            }

            const data = await response.json();
            this.dealers = data.items || [];
            this.renderDealersTable();
        } catch (error) {
            console.error('Error loading dealers data:', error);
            showToast('Error loading dealers information', 'error');
        }
    }

    renderDealersTable() {
        const dealersTableBody = document.getElementById('dealersTableBody');
        const createDealerBtn = document.getElementById('createDealerBtn');
        
        if (!dealersTableBody) return;

        // Show/hide create button based on role
        if (createDealerBtn) {
            const canCreateDealer = ['SuperAdmin', 'TechAdmin', 'SalesAdmin', 'WholesalerAdmin'].includes(this.userRole);
            createDealerBtn.style.display = canCreateDealer ? 'block' : 'none';
        }

        dealersTableBody.innerHTML = this.dealers.map(dealer => `
            <tr>
                <td>${dealer.Name}</td>
                <td>${dealer.Email || '-'}</td>
                <td><span class="badge bg-${getStatusBadgeClass(dealer.Status)}">${dealer.Status}</span></td>
                <td>
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-primary" onclick="tenantDetails.editDealer(${dealer.Id})">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button type="button" class="btn btn-sm btn-info" onclick="tenantDetails.manageDealerUsers(${dealer.Id})">
                            <i class="bi bi-people"></i> Users
                        </button>
                        <button type="button" class="btn btn-sm btn-danger" onclick="tenantDetails.deleteDealer(${dealer.Id})">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        const createWholesalerBtn = document.getElementById('createWholesalerBtn');
        const createDealerBtn = document.getElementById('createDealerBtn');

        if (createWholesalerBtn) {
            createWholesalerBtn.addEventListener('click', () => this.createWholesaler());
        }

        if (createDealerBtn) {
            createDealerBtn.addEventListener('click', () => this.createDealer());
        }
    }

    // Placeholder methods for actions
    createWholesaler() {
        console.log('Create wholesaler clicked');
        // TODO: Implement create wholesaler functionality
    }

    editWholesaler(wholesalerId) {
        console.log('Edit wholesaler clicked:', wholesalerId);
        // TODO: Implement edit wholesaler functionality
    }

    manageWholesalerUsers(wholesalerId) {
        console.log('Manage wholesaler users clicked:', wholesalerId);
        // TODO: Implement manage wholesaler users functionality
    }

    deleteWholesaler(wholesalerId) {
        console.log('Delete wholesaler clicked:', wholesalerId);
        // TODO: Implement delete wholesaler functionality
    }

    createDealer() {
        console.log('Create dealer clicked');
        // TODO: Implement create dealer functionality
    }

    editDealer(dealerId) {
        console.log('Edit dealer clicked:', dealerId);
        // TODO: Implement edit dealer functionality
    }

    manageDealerUsers(dealerId) {
        console.log('Manage dealer users clicked:', dealerId);
        // TODO: Implement manage dealer users functionality
    }

    deleteDealer(dealerId) {
        console.log('Delete dealer clicked:', dealerId);
        // TODO: Implement delete dealer functionality
    }
}

// Export the class
window.TenantDetails = TenantDetails; 