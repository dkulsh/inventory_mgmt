// Business Modal JavaScript
class BusinessModal {
    constructor() {
        this.modal = null;
        this.currentUser = null;
        this.tenants = [];
        this.editingBusinessId = null;
        this.isEditMode = false;
        
        this.createModal();
    }

    createModal() {
        const modalHtml = `
            <div class="modal fade" id="businessModal" tabindex="-1" aria-labelledby="businessModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="businessModalLabel">Create Business</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="businessForm">
                                <!-- Name (Full Width) -->
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="businessName" class="form-label">Business Name <span class="text-danger">*</span></label>
                                            <input type="text" class="form-control" id="businessName" name="Name" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Description (Full Width) -->
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="businessDescription" class="form-label">Description</label>
                                            <textarea class="form-control" id="businessDescription" name="Description" rows="3"></textarea>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Email and Phone Number -->
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="businessEmail" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="businessEmail" name="Email">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="businessPhone" class="form-label">Phone Number</label>
                                            <input type="tel" class="form-control" id="businessPhone" name="PhoneNumber">
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Tenant and Type -->
                                <div class="row">
                                    <div class="col-md-6" id="tenantRow">
                                        <div class="mb-3">
                                            <label for="businessTenant" class="form-label">Tenant <span class="text-danger">*</span></label>
                                            <select class="form-select" id="businessTenant" name="TenantId" required>
                                                <option value="">Select Tenant</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="businessType" class="form-label">Business Type <span class="text-danger">*</span></label>
                                            <select class="form-select" id="businessType" name="Type" required>
                                                <option value="">Select Type</option>
                                                <option value="WHOLESALER">Wholesaler</option>
                                                <option value="DEALER">Dealer</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- SubType and Status -->
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="businessSubType" class="form-label">Sub Type</label>
                                            <input type="text" class="form-control" id="businessSubType" name="SubType" placeholder="e.g., Regional Dealer">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="businessStatus" class="form-label">Status <span class="text-danger">*</span></label>
                                            <select class="form-select" id="businessStatus" name="Status" required>
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Address Line 1 and 2 -->
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="businessAddress1" class="form-label">Address Line 1</label>
                                            <input type="text" class="form-control" id="businessAddress1" name="AddressLine1">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="businessAddress2" class="form-label">Address Line 2</label>
                                            <input type="text" class="form-control" id="businessAddress2" name="AddressLine2">
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveBusinessBtn">Save Business</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = new bootstrap.Modal(document.getElementById('businessModal'));
        
        // Setup event listeners
        document.getElementById('saveBusinessBtn').addEventListener('click', () => {
            this.saveBusiness();
        });
    }

    open(businessId = null, currentUser = null, tenants = []) {
        this.currentUser = currentUser;
        this.tenants = tenants;
        this.editingBusinessId = businessId;
        this.isEditMode = !!businessId;
        
        // Update modal title
        const title = document.getElementById('businessModalLabel');
        title.textContent = this.isEditMode ? 'Edit Business' : 'Create Business';
        
        // Reset form
        this.resetForm();
        
        // Setup form based on current user role
        this.setupFormForCurrentUser();
        
        // Load business data if editing
        if (this.isEditMode) {
            this.loadBusinessData(businessId);
        }
        
        // Show modal
        this.modal.show();
    }

    resetForm() {
        const form = document.getElementById('businessForm');
        form.reset();
        
        // Clear select options
        document.getElementById('businessTenant').innerHTML = '<option value="">Select Tenant</option>';
        document.getElementById('businessType').value = '';
        document.getElementById('businessStatus').value = 'Active';
    }

    setupFormForCurrentUser() {
        const tenantSelect = document.getElementById('businessTenant');
        const tenantRow = document.getElementById('tenantRow');
        
        // Setup tenant options
        this.tenants.forEach(tenant => {
            const option = document.createElement('option');
            option.value = tenant.TenantId;
            option.textContent = tenant.TenantName;
            tenantSelect.appendChild(option);
        });
        
        // Handle role-based tenant selection
        if (['SuperAdmin', 'TechAdmin', 'SalesAdmin'].includes(this.currentUser.Role)) {
            // Admin roles can select any tenant
            tenantSelect.disabled = false;
            tenantRow.style.display = 'block';
        } else {
            // Other roles are restricted to their tenant
            tenantSelect.value = this.currentUser.TenantId;
            tenantSelect.disabled = true;
            tenantRow.style.display = 'block';
        }
    }

    async loadBusinessData(businessId) {
        try {
            const response = await fetch(`/api/v1/businesses/${businessId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load business data');
            }
            
            const business = await response.json();
            
            // Populate form fields
            document.getElementById('businessName').value = business.Name;
            document.getElementById('businessDescription').value = business.Description || '';
            document.getElementById('businessEmail').value = business.Email || '';
            document.getElementById('businessPhone').value = business.PhoneNumber || '';
            document.getElementById('businessTenant').value = business.TenantId;
            document.getElementById('businessType').value = business.Type;
            document.getElementById('businessSubType').value = business.SubType || '';
            document.getElementById('businessStatus').value = business.Status;
            document.getElementById('businessAddress1').value = business.AddressLine1 || '';
            document.getElementById('businessAddress2').value = business.AddressLine2 || '';
            
        } catch (error) {
            console.error('Error loading business data:', error);
            this.showToast('Error loading business data', 'error');
        }
    }

    async saveBusiness() {
        const form = document.getElementById('businessForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Prepare business data
        const tenantSelect = document.getElementById('businessTenant');
        
        const businessData = {
            TenantId: parseInt(tenantSelect.value),
            Name: formData.get('Name'),
            Description: formData.get('Description') || null,
            Email: formData.get('Email') || null,
            PhoneNumber: formData.get('PhoneNumber') || null,
            Type: formData.get('Type'),
            SubType: formData.get('SubType') || null,
            Status: formData.get('Status'),
            AddressLine1: formData.get('AddressLine1') || null,
            AddressLine2: formData.get('AddressLine2') || null
        };
        
        try {
            const url = this.isEditMode ? `/api/v1/businesses/${this.editingBusinessId}` : '/api/v1/businesses';
            const method = this.isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(businessData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `Failed to ${this.isEditMode ? 'update' : 'create'} business`);
            }
            
            const action = this.isEditMode ? 'updated' : 'created';
            this.showToast(`Business ${action} successfully`, 'success');
            
            // Close modal
            this.modal.hide();
            
            // Refresh businesses list
            if (window.businessManagement) {
                window.businessManagement.refreshBusinesses();
            }
            
        } catch (error) {
            console.error('Error saving business:', error);
            this.showToast(error.message || `Error ${this.isEditMode ? 'updating' : 'creating'} business`, 'error');
        }
    }

    showToast(message, type = 'info') {
        if (window.businessManagement) {
            window.businessManagement.showToast(message, type);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.businessModal = new BusinessModal();
});
