class TenantModal {
    constructor() {
        this.modal = null;
        this.form = null;
        this.currentTenant = null;
    }

    show(tenant = null) {
        this.currentTenant = tenant;
        this.render();
        this.modal.show();
        this.setupEventListeners();
    }

    render() {
        const modalHtml = `
            <div class="modal fade" id="tenantModal" tabindex="-1" aria-labelledby="tenantModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="tenantModalLabel">
                                ${this.currentTenant ? 'Edit Tenant' : 'Create Tenant'}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="tenantForm">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="tenantName" class="form-label">Tenant Name *</label>
                                        <input type="text" class="form-control" id="tenantName" name="TenantName" 
                                            value="${this.currentTenant?.TenantName || ''}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="tenantStatus" class="form-label">Status *</label>
                                        <select class="form-select" id="tenantStatus" name="TenantStatus" required>
                                            <option value="Active" ${this.currentTenant?.TenantStatus === 'Active' ? 'selected' : ''}>Active</option>
                                            <option value="Inactive" ${this.currentTenant?.TenantStatus === 'Inactive' ? 'selected' : ''}>Inactive</option>
                                            <option value="Suspended" ${this.currentTenant?.TenantStatus === 'Suspended' ? 'selected' : ''}>Suspended</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="tenantType" class="form-label">Type</label>
                                        <select class="form-select" id="tenantType" name="TenantType">
                                            <option value="">Select Type</option>
                                            <option value="Standard" ${this.currentTenant?.TenantType === 'Standard' ? 'selected' : ''}>Standard</option>
                                            <option value="Premium" ${this.currentTenant?.TenantType === 'Premium' ? 'selected' : ''}>Premium</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="tenantSubType" class="form-label">Sub Type</label>
                                        <input type="text" class="form-control" id="tenantSubType" name="TenantSubType"
                                            value="${this.currentTenant?.TenantSubType || ''}">
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="startDateTime" class="form-label">Start Date</label>
                                        <input type="datetime-local" class="form-control" id="startDateTime" name="TenantStartDateTime"
                                            value="${this.currentTenant?.TenantStartDateTime ? new Date(this.currentTenant.TenantStartDateTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="endDateTime" class="form-label">End Date</label>
                                        <input type="datetime-local" class="form-control" id="endDateTime" name="TenantEndDateTime"
                                            value="${this.currentTenant?.TenantEndDateTime ? new Date(this.currentTenant.TenantEndDateTime).toISOString().slice(0, 16) : '9999-12-31T23:59'}">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="tenantDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="tenantDescription" name="TenantDescription" rows="3">${this.currentTenant?.TenantDescription || ''}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="saveTenantBtn">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('tenantModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Initialize modal
        this.modal = new bootstrap.Modal(document.getElementById('tenantModal'));
        this.form = document.getElementById('tenantForm');
    }

    setupEventListeners() {
        const saveButton = document.getElementById('saveTenantBtn');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.handleSave());
        }

        // Additional data validation
        const additionalDataInput = document.getElementById('additionalData');
        if (additionalDataInput) {
            additionalDataInput.addEventListener('input', () => {
                try {
                    if (additionalDataInput.value) {
                        JSON.parse(additionalDataInput.value);
                        additionalDataInput.classList.remove('is-invalid');
                    }
                } catch (e) {
                    additionalDataInput.classList.add('is-invalid');
                }
            });
        }
    }

    async handleSave() {
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }

        const formData = new FormData(this.form);
        const tenantData = {
            TenantName: formData.get('TenantName'),
            TenantStatus: formData.get('TenantStatus'),
            TenantType: formData.get('TenantType') || null,
            TenantSubType: formData.get('TenantSubType') || null,
            TenantStartDateTime: formData.get('TenantStartDateTime') || null,
            TenantEndDateTime: formData.get('TenantEndDateTime') || null,
            TenantDescription: formData.get('TenantDescription') || null
        };

        let success;
        if (this.currentTenant) {
            success = await window.tenantManagement.updateTenant(this.currentTenant.TenantId, tenantData);
        } else {
            success = await window.tenantManagement.createTenant(tenantData);
        }

        if (success) {
            this.modal.hide();
        }
    }
}

// Export the class
window.TenantModal = TenantModal;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tenantModal = new TenantModal();
}); 