class TenantDetail {
    constructor() {
        console.log('TenantDetail constructor called');
        this.tenantId = null;
        this.tenantData = null;
        this.businessManagement = null;
    }

    async initialize() {
        console.log('TenantDetail initialize called');
        // Get tenant ID from URL
        const pathParts = window.location.pathname.split('/');
        this.tenantId = pathParts[pathParts.length - 1];
        console.log('Extracted tenantId from URL:', this.tenantId);
        
        // Get tenant data from sessionStorage
        const storedTenant = sessionStorage.getItem('currentTenant');
        console.log('Stored tenant data in sessionStorage:', storedTenant);
        if (storedTenant) {
            this.tenantData = JSON.parse(storedTenant);
            console.log('Parsed tenant data:', this.tenantData);
            this.renderTenantInfo();
        } else {
            console.log('No stored tenant data, fetching from API');
            // If no data in sessionStorage, fetch from API
            await this.fetchTenantData();
        }

        // Initialize business management
        console.log('Initializing business management');
        this.businessManagement = new BusinessManagement(this.tenantId);
        await this.businessManagement.initialize();

        this.setupEventListeners();
        console.log('TenantDetail initialization complete');
    }

    async fetchTenantData() {
        console.log('Fetching tenant data for ID:', this.tenantId);
        try {
            const token = localStorage.getItem('access_token');
            console.log('Token available:', !!token);
            
            const url = `/api/v1/tenants/${this.tenantId}`;
            console.log('Making API call to:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('API Response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to fetch tenant details');
            }

            this.tenantData = await response.json();
            console.log('Received tenant data:', this.tenantData);
            this.renderTenantInfo();
        } catch (error) {
            console.error('Error in fetchTenantData:', error);
            showToast('Error fetching tenant details', 'error');
        }
    }

    renderTenantInfo() {
        console.log('Rendering tenant info with data:', this.tenantData);
        if (!this.tenantData) {
            console.log('No tenant data available to render');
            return;
        }

        // Update breadcrumb
        document.getElementById('tenantNameBreadcrumb').textContent = this.tenantData.TenantName;

        // Update tenant information
        document.getElementById('tenantName').textContent = this.tenantData.TenantName;
        document.getElementById('tenantStatus').innerHTML = `<span class="badge bg-${getStatusBadgeClass(this.tenantData.TenantStatus)}">${this.tenantData.TenantStatus}</span>`;
        document.getElementById('tenantType').textContent = this.tenantData.TenantType || '-';
        document.getElementById('tenantStartDate').textContent = formatDate(this.tenantData.TenantStartDateTime);
        document.getElementById('tenantEndDate').textContent = formatDate(this.tenantData.TenantEndDateTime);
        document.getElementById('tenantDescription').textContent = this.tenantData.TenantDescription || '-';
        console.log('Tenant info rendered successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                console.log('Refresh button clicked');
                await this.fetchTenantData();
                await this.businessManagement.loadBusinesses();
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing TenantDetail');
    window.tenantDetail = new TenantDetail();
    window.tenantDetail.initialize();
}); 