// Bookings page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initializeBookingsPage();
});

// Initialize bookings page
async function initializeBookingsPage() {
    // Get user role and tenant info from localStorage
    const userRole = localStorage.getItem('user_role');
    const tenantId = localStorage.getItem('tenant_id');
    const businessId = localStorage.getItem('business_id');

    // Initialize dropdowns based on user role
    await initializeDropdowns(userRole, tenantId, businessId);

    // Initialize product listing
    await fetchAndRenderProducts();

    // Add event listeners
    setupEventListeners();
}

// Initialize dropdowns based on user role
async function initializeDropdowns(userRole, tenantId, businessId) {
    const tenantSelect = document.getElementById('tenantSelect');
    const dealerSelect = document.getElementById('dealerSelect');

    // Handle tenant dropdown
    if (['SuperAdmin', 'TechAdmin', 'SalesAdmin'].includes(userRole)) {
        // Load all tenants
        await loadTenants(tenantSelect);
    } else {
        // Pre-select and disable tenant dropdown
        await loadTenants(tenantSelect, tenantId);
        tenantSelect.disabled = true;
    }

    // Handle dealer dropdown
    if (['DealerAdmin', 'Dealer'].includes(userRole)) {
        // Pre-select and disable dealer dropdown
        await loadDealers(dealerSelect, tenantId, businessId);
        dealerSelect.disabled = true;
    } else {
        // Load dealers based on selected tenant
        await loadDealers(dealerSelect, tenantId);
    }
}

// Load tenants into dropdown
async function loadTenants(selectElement, selectedTenantId = null) {
    try {
        const response = await fetch('/api/v1/tenants/', {
            headers: authHeaders()
        });
        if (response.ok) {
            const tenants = await response.json();
            
            // Clear existing options
            selectElement.innerHTML = '';
            
            if (tenants.length > 1) {
                // Multiple tenants - add "Select Tenant" option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select Tenant';
                selectElement.appendChild(defaultOption);
            }
            
            // Add tenant options
            tenants.forEach(tenant => {
                const option = document.createElement('option');
                option.value = tenant.TenantId;
                option.textContent = tenant.TenantName;
                if (selectedTenantId && tenant.TenantId === parseInt(selectedTenantId)) {
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
            
            // If only one tenant, select it automatically
            if (tenants.length === 1) {
                selectElement.value = tenants[0].TenantId;
            }
        }
    } catch (error) {
        showToast('Failed to load tenants', false);
    }
}

// Load dealers into dropdown
async function loadDealers(selectElement, tenantId, selectedDealerId = null) {
    try {
        // Ensure tenantId is not null or undefined
        if (!tenantId) {
            tenantId = document.getElementById('tenantSelect').value;
        }
        
        if (!tenantId) {
            selectElement.innerHTML = '<option value="">Select Dealer</option>';
            return;
        }

        const response = await fetch(`/api/v1/businesses/?tenantId=${tenantId}&type=DEALER`, {
            headers: authHeaders()
        });
        if (response.ok) {
            const dealers = await response.json();
            selectElement.innerHTML = '<option value="">Select Dealer</option>';
            
            // Auto-select logic: if only one dealer is available, select it automatically
            let shouldAutoSelect = false;
            let autoSelectId = null;
            
            if (dealers.length === 1) {
                shouldAutoSelect = true;
                autoSelectId = dealers[0].Id;
            } else if (selectedDealerId) {
                // If specific dealer ID is provided, use that
                autoSelectId = parseInt(selectedDealerId);
                shouldAutoSelect = true;
            }
            
            dealers.forEach(dealer => {
                const option = document.createElement('option');
                option.value = dealer.Id;
                option.textContent = dealer.Name;
                
                // Select the option if it should be auto-selected
                if (shouldAutoSelect && dealer.Id === autoSelectId) {
                    option.selected = true;
                }
                
                selectElement.appendChild(option);
            });
            
            // Trigger change event if dealer was auto-selected
            if (shouldAutoSelect) {
                selectElement.dispatchEvent(new Event('change'));
            }
        }
    } catch (error) {
        showToast('Failed to load dealers', false);
    }
}

// Fetch and render products
async function fetchAndRenderProducts(search = '') {
    const tbody = document.getElementById('productsTbody');
    const noProductsMsg = document.getElementById('noProductsMsg');
    tbody.innerHTML = '';
    noProductsMsg.style.display = 'none';

    const tenantId = document.getElementById('tenantSelect').value;
    const dealerId = document.getElementById('dealerSelect').value;

    if (!tenantId || !dealerId) {
        noProductsMsg.textContent = 'Please select a tenant and dealer';
        noProductsMsg.style.display = 'block';
        return;
    }

    let url = `/api/v1/products/?tenantId=${tenantId}&page=1&size=50&sort_by=CreatedAt&order=desc`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    try {
        const res = await fetch(url, { headers: authHeaders() });
        if (res.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        const products = await res.json();
        if (!products.length) {
            noProductsMsg.textContent = 'No products available';
            noProductsMsg.style.display = 'block';
            return;
        }

        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="form-check">
                        <input class="form-check-input product-checkbox" type="checkbox" value="${product.Id}" id="product${product.Id}">
                    </div>
                </td>
                <td>
                    <img src="${product.ImageLink || '/static/images/placeholder.png'}" 
                         alt="img" 
                         class="product-image-thumbnail"
                         style="width:40px;height:40px;border-radius:8px;object-fit:cover;"
                         data-retry-count="0"
                         data-product-name="${product.Name || 'Product'}"
                         data-image-url="${product.ImageLink || '/static/images/placeholder.png'}"
                         onerror="handleImageError(this, ${product.Id})"
                         onclick="showImagePreview('${product.ImageLink || '/static/images/placeholder.png'}', '${(product.Name || 'Product').replace(/'/g, "\\'")}')">
                </td>
                <td>${product.ProductId}</td>
                <td>${product.Name}</td>
                <td>${product.Description || ''}</td>
                <td>${product.Quantity}</td>
                <td>₹${product.MRP}</td>
                <td>${product.DiscountAmount ? product.DiscountAmount + (product.DiscountType === 'Percentage' ? ' %' : '') : '0 %'}</td>
                <td>${product.TaxAmount ? product.TaxAmount + '% ' + (product.TaxType || '') : ''}</td>
                <td>
                    <input type="number" class="form-control form-control-sm order-quantity" 
                           value="0" min="0" max="${product.Quantity}" 
                           style="width:80px;" data-product-id="${product.Id}">
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners for checkboxes and quantity inputs
        setupProductRowEventListeners();
    } catch (e) {
        console.error('Failed to fetch products:', e);
        showToast('Failed to fetch products', false);
    }
}

// Setup event listeners for product rows
function setupProductRowEventListeners() {
    // Handle checkbox changes
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateCreateBookingButton);
    });

    // Handle quantity input changes
    document.querySelectorAll('.order-quantity').forEach(input => {
        input.addEventListener('change', function() {
            const productId = this.dataset.productId;
            const checkbox = document.getElementById(`product${productId}`);
            if (parseInt(this.value) > 0) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
            updateCreateBookingButton();
        });
    });
}

// Update create booking button state
function updateCreateBookingButton() {
    const createBookingBtn = document.getElementById('createBookingBtn');
    const hasSelectedProducts = Array.from(document.querySelectorAll('.product-checkbox'))
        .some(checkbox => checkbox.checked && 
            parseInt(document.querySelector(`.order-quantity[data-product-id="${checkbox.value}"]`).value) > 0);
    createBookingBtn.disabled = !hasSelectedProducts;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            fetchAndRenderProducts(this.value);
        });
    }

    // Tenant selection change
    const tenantSelect = document.getElementById('tenantSelect');
    if (tenantSelect) {
        tenantSelect.addEventListener('change', async function() {
            const dealerSelect = document.getElementById('dealerSelect');
            await loadDealers(dealerSelect, this.value);
            fetchAndRenderProducts();
        });
    }

    // Dealer selection change
    const dealerSelect = document.getElementById('dealerSelect');
    if (dealerSelect) {
        dealerSelect.addEventListener('change', function() {
            fetchAndRenderProducts();
        });
    }

    // Create booking button
    const createBookingBtn = document.getElementById('createBookingBtn');
    if (createBookingBtn) {
        createBookingBtn.addEventListener('click', createBooking);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            fetchAndRenderProducts();
        });
    }
}

// Create booking
async function createBooking() {
    const selectedProducts = Array.from(document.querySelectorAll('.product-checkbox'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => {
            const quantityInput = document.querySelector(`.order-quantity[data-product-id="${checkbox.value}"]`);
            const productRow = checkbox.closest('tr');
            const mrp = parseFloat(productRow.cells[6].textContent.replace('₹', ''));
            const discountText = productRow.cells[7].textContent;
            const discountType = discountText.includes('%') ? 'Percentage' : 'Fixed';
            const discountAmount = parseFloat(discountText) || 0;
            const taxText = productRow.cells[8].textContent;
            const taxAmount = parseFloat(taxText) || 0;
            const taxType = taxText.includes('GST') ? 'GST' : '';
            const availableQuantity = parseInt(productRow.cells[5].textContent);
            const orderQuantity = parseInt(quantityInput.value);
            
            return {
                productId: parseInt(checkbox.value),
                orderQuantity: orderQuantity,
                availableQuantity: availableQuantity,
                price: mrp,
                discountType: discountType,
                discountAmount: discountAmount,
                taxType: taxType,
                taxAmount: taxAmount,
                totalCost: mrp * orderQuantity
            };
        });

    if (selectedProducts.length === 0) {
        showToast('Please select at least one product', false);
        return;
    }

    showLoader('Creating booking...');
    try {
        // Split products into booked and requested
        const bookedProducts = [];
        const requestedProducts = [];
        
        selectedProducts.forEach(product => {
            if (product.orderQuantity <= product.availableQuantity) {
                // Full quantity can be booked
                bookedProducts.push({
                    ProductId: product.productId,
                    Quantity: product.orderQuantity,
                    Price: product.price,
                    DiscountType: product.discountType,
                    DiscountAmount: product.discountAmount,
                    TaxType: product.taxType,
                    TaxAmount: product.taxAmount,
                    TotalCost: product.totalCost
                });
            } else {
                // Split into booked and requested
                if (product.availableQuantity > 0) {
                    // Add booked portion
                    bookedProducts.push({
                        ProductId: product.productId,
                        Quantity: product.availableQuantity,
                        Price: product.price,
                        DiscountType: product.discountType,
                        DiscountAmount: product.discountAmount,
                        TaxType: product.taxType,
                        TaxAmount: product.taxAmount,
                        TotalCost: product.price * product.availableQuantity
                    });
                }
                
                // Add requested portion
                const requestedQuantity = product.orderQuantity - product.availableQuantity;
                requestedProducts.push({
                    ProductId: product.productId,
                    Quantity: requestedQuantity,
                    Price: product.price,
                    DiscountType: product.discountType,
                    DiscountAmount: product.discountAmount,
                    TaxType: product.taxType,
                    TaxAmount: product.taxAmount,
                    TotalCost: product.price * requestedQuantity
                });
            }
        });

        // Prepare orders array
        const orders = [];
        
        // Add booked order if there are booked products
        if (bookedProducts.length > 0) {
            orders.push({
                BusinessId: document.getElementById('dealerSelect').value,
                Type: 'Booked',
                OrderStatus: 'New',
                SubType: null,
                AdditionalData: null,
                ordered_products: bookedProducts
            });
        }
        
        // Add requested order if there are requested products
        if (requestedProducts.length > 0) {
            orders.push({
                BusinessId: document.getElementById('dealerSelect').value,
                Type: 'Requested',
                OrderStatus: 'New',
                SubType: null,
                AdditionalData: null,
                ordered_products: requestedProducts
            });
        }

        const response = await fetch('/api/v1/orders/', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ orders: orders })
        });

        if (response.ok) {
            const result = await response.json();
            let message = 'Booking created successfully';
            if (result.booked_order && result.requested_order) {
                message = 'Booking created with both booked and requested orders';
            } else if (result.requested_order) {
                message = 'Requested order created (no items were available for booking)';
            }
            showToast(message, true);
            fetchAndRenderProducts(); // Refresh the product list
        } else {
            const error = await response.json();
            showToast(error.detail || 'Failed to create booking', false);
        }
    } catch (error) {
        showToast('Failed to create booking', false);
    } finally {
        hideLoader();
    }
}

// Image Preview Modal functionality
function showImagePreview(imageUrl, productName) {
    // Skip preview for placeholder images
    if (imageUrl.includes('placeholder.png')) {
        showToast('No image available for this product', false);
        return;
    }

    // Create or get existing modal
    let modal = document.getElementById('imagePreviewModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imagePreviewModal';
        modal.className = 'modal fade image-preview-modal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        document.body.appendChild(modal);
    }

    // Modal HTML with loading state
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${productName}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="loading-spinner" id="imageLoadingSpinner">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div class="ms-2">Loading image...</div>
                    </div>
                    <div class="error-message" id="imageErrorMessage" style="display: none;">
                        <i class="bi bi-image"></i>
                        <p>Failed to load image</p>
                        <small class="text-muted">The image may be unavailable or corrupted</small>
                    </div>
                    <img class="preview-image" id="previewImage" style="display: none;" alt="${productName}">
                </div>
            </div>
        </div>
    `;

    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Load the image
    const previewImg = modal.querySelector('#previewImage');
    const loadingSpinner = modal.querySelector('#imageLoadingSpinner');
    const errorMessage = modal.querySelector('#imageErrorMessage');

    // Create new image to test loading
    const testImg = new Image();
    
    testImg.onload = function() {
        // Image loaded successfully
        previewImg.src = imageUrl;
        previewImg.style.display = 'block';
        loadingSpinner.style.display = 'none';
    };

    testImg.onerror = function() {
        // Image failed to load
        loadingSpinner.style.display = 'none';
        errorMessage.style.display = 'block';
    };

    // Start loading the image
    testImg.src = imageUrl;

    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', function() {
        modal.remove();
    });
} 