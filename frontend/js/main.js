document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            loginError.style.display = 'none';
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('/api/v1/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('access_token', data.access_token);
                    window.location.href = 'products.html';
                } else {
                    const err = await response.json();
                    loginError.textContent = err.detail || 'Invalid credentials';
                    loginError.style.display = 'block';
                }
            } catch (error) {
                loginError.textContent = 'Network error. Please try again.';
                loginError.style.display = 'block';
            }
        });
    }
});

// Utility: Get JWT token
function getToken() {
    return localStorage.getItem('access_token');
}

// Utility: Set up fetch headers with JWT
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
    };
}

// Function to handle image loading errors
async function handleImageError(img, productId) {
    // Show placeholder
    img.src = '/static/images/placeholder.png';
    
    // Get retry count from data attribute or initialize to 0
    const retryCount = parseInt(img.dataset.retryCount || '0');
    
    // If we've already tried 3 times, show toast and stop
    if (retryCount >= 3) {
        showToast('Some images could not be downloaded', false);
        return;
    }
    
    try {
        // Try to refresh the URL
        const res = await fetch(`/api/v1/products/refresh-image-url/${productId}`, {
            method: 'POST',
            headers: authHeaders()
        });
        
        if (res.ok) {
            const data = await res.json();
            // Update the image source with new URL
            img.src = data.url;
        } else {
            // Increment retry count
            img.dataset.retryCount = (retryCount + 1).toString();
            
            // Wait for 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try again
            handleImageError(img, productId);
        }
    } catch (e) {
        console.error('Failed to refresh image URL:', e);
        // Increment retry count
        img.dataset.retryCount = (retryCount + 1).toString();
        
        // Wait for 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try again
        handleImageError(img, productId);
    }
}

// Render products in table
async function fetchAndRenderProducts(search = '') {
    const tbody = document.getElementById('productsTbody');
    const noProductsMsg = document.getElementById('noProductsMsg');
    tbody.innerHTML = '';
    noProductsMsg.style.display = 'none';
    let url = '/api/v1/products/?page=1&size=50&sort_by=CreatedAt&order=desc';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    try {
        const res = await fetch(url, { headers: authHeaders() });
        if (res.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        const products = await res.json();
        if (!products.length) {
            noProductsMsg.style.display = 'block';
            return;
        }
        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <img src="${product.ImageLink || '/static/images/placeholder.png'}" 
                         alt="img" 
                         style="width:40px;height:40px;border-radius:8px;object-fit:cover;"
                         data-retry-count="0"
                         onerror="handleImageError(this, ${product.Id})">
                </td>
                <td>${product.ProductId}</td>
                <td>${product.Name}</td>
                <td>${product.Description || ''}</td>
                <td>${product.Quantity}</td>
                <td>₹${product.MRP}</td>
                <td>${product.DiscountAmount ? product.DiscountAmount + (product.DiscountType === 'Percentage' ? ' %' : '') : '0 %'}</td>
                <td>${product.TaxAmount ? product.TaxAmount + '% ' + (product.TaxType || '') : ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="editProduct(${product.Id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.Id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Failed to fetch products:', e);
        showToast('Failed to fetch products', false);
    }
}

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        fetchAndRenderProducts(this.value);
    });
}

// Add Product Modal
function showProductModal(edit = false, product = {}) {
    let modal = document.getElementById('productModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'productModal';
        document.body.appendChild(modal);
    }
    // Modal HTML
    modal.innerHTML = `
    <style>
      /* Ensure dropdowns match input height and padding exactly */
      #productModalDialog .form-select {
        height: 38px !important;
        min-height: 38px !important;
        line-height: 1.5 !important;
        padding: 0.375rem 0.75rem !important;
        font-size: 1rem !important;
      }
    </style>
    <div class="modal fade" tabindex="-1" id="productModalDialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title fw-bold">${edit ? 'Edit' : 'Add'} Product</h5>
              <div class="text-muted small">Fill in the product details.</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="productForm">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Product ID</label>
                  <input type="text" class="form-control input-short" id="prodId" value="${product.ProductId || ''}" required ${edit ? 'readonly' : ''}>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Product Name</label>
                  <input type="text" class="form-control input-short" id="prodName" value="${product.Name || ''}" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="prodDesc" rows="3">${product.Description || ''}</textarea>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Quantity</label>
                  <input type="number" class="form-control" id="prodQty" value="${product.Quantity || 0}" min="0" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">MRP (₹)</label>
                  <input type="number" class="form-control" id="prodMRP" value="${product.MRP || 0}" min="0" step="0.01" required>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Discount</label>
                  <input type="number" class="form-control" id="prodDiscount" value="${product.DiscountAmount || 0}" min="0" step="0.01">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Discount Type</label>
                  <select class="form-select" id="prodDiscountType">
                    <option value="Percentage" ${!product.DiscountType || product.DiscountType === 'Percentage' ? 'selected' : ''}>Percent (%)</option>
                    <option value="Fixed" ${product.DiscountType === 'Fixed' ? 'selected' : ''}>Fixed (₹)</option>
                  </select>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label">Tax Percentage</label>
                  <select class="form-select" id="prodTaxAmt">
                    <option value="0" ${product.TaxAmount == 0 ? 'selected' : ''}>0%</option>
                    <option value="5" ${product.TaxAmount == 5 ? 'selected' : ''}>5%</option>
                    <option value="12" ${product.TaxAmount == 12 ? 'selected' : ''}>12%</option>
                    <option value="18" ${(product.TaxAmount == 18 || !product.TaxAmount) ? 'selected' : ''}>18%</option>
                    <option value="28" ${product.TaxAmount == 28 ? 'selected' : ''}>28%</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Tax Type</label>
                  <input type="text" class="form-control" id="prodTax" value="${product.TaxType || 'GST'}">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Product Image</label>
                <div id="imageDropArea" class="border rounded d-flex align-items-center justify-content-center" style="height: 120px; background: #fafbfc; cursor: pointer; position: relative;">
                  <span id="imageDropText">Drop image here or click to select</span>
                  <img id="imagePreview" src="${product.ImageLink || ''}" style="position: absolute; width: 100%; height: 100%; object-fit: contain; display:${product.ImageLink ? 'block' : 'none'};" />
                  <input type="file" id="prodImgFile" accept="image/*" style="display:none;">
                </div>
              </div>
              <div id="productFormError" class="text-danger mb-2" style="display:none;"></div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">${edit ? 'Update' : 'Add'} Product</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>`;

    // Image picker logic
    const dropArea = modal.querySelector('#imageDropArea');
    const fileInput = modal.querySelector('#prodImgFile');
    const preview = modal.querySelector('#imagePreview');
    const dropText = modal.querySelector('#imageDropText');
    dropArea.onclick = () => fileInput.click();
    dropArea.ondragover = e => { e.preventDefault(); dropArea.classList.add('border-primary'); };
    dropArea.ondragleave = e => { e.preventDefault(); dropArea.classList.remove('border-primary'); };
    dropArea.ondrop = e => {
        e.preventDefault();
        dropArea.classList.remove('border-primary');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            showImagePreview(fileInput.files[0]);
        }
    };
    fileInput.onchange = () => {
        if (fileInput.files.length) showImagePreview(fileInput.files[0]);
    };
    function showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.src = e.target.result;
            preview.style.display = 'block';
            dropText.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    // Show modal
    const modalDialog = new bootstrap.Modal(document.getElementById('productModalDialog'));
    modalDialog.show();

    // Form submit
    document.getElementById('productForm').onsubmit = async function(e) {
        e.preventDefault();
        const errorDiv = document.getElementById('productFormError');
        errorDiv.style.display = 'none';
        let imageUrl = product.ImageLink || '';
        let imagePath = product.ImagePath || '';
        const fileInput = document.getElementById('prodImgFile');
        const tenantId = localStorage.getItem('tenant_id') || 1; // Use actual tenantId if available
        // 1. Upload image if a new file is selected
        if (fileInput && fileInput.files && fileInput.files.length) {
            showLoader('Image upload in progress');
            const formData = new FormData();
            formData.append('tenantId', tenantId);
            formData.append('file', fileInput.files[0]);
            try {
                const res = await fetch('/api/v1/products/upload-image', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + getToken() },
                    body: formData
                });
                hideLoader();
                const data = await res.json();
                if (res.ok && data.url && data.path) {
                    imageUrl = data.url;
                    imagePath = data.path;
                } else {
                    showToast('Image upload failed', false);
                    return;
                }
            } catch (err) {
                hideLoader();
                showToast('Image upload failed', false);
                return;
            }
        }
        // 2. Save product
        showLoader('Saving product');
        const payload = {
            ProductId: document.getElementById('prodId').value,
            Name: document.getElementById('prodName').value,
            Description: document.getElementById('prodDesc').value,
            Quantity: parseInt(document.getElementById('prodQty').value),
            MRP: parseFloat(document.getElementById('prodMRP').value),
            DiscountType: document.getElementById('prodDiscountType').value,
            DiscountAmount: parseFloat(document.getElementById('prodDiscount').value),
            TaxType: document.getElementById('prodTax').value,
            TaxAmount: parseFloat(document.getElementById('prodTaxAmt').value),
            ImageLink: imageUrl,
            ImagePath: imagePath || product.ImagePath
        };
        try {
            let res;
            if (edit) {
                res = await fetch(`/api/v1/products/${product.Id}`, {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/v1/products/', {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify(payload)
                });
            }
            hideLoader();
            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('productModalDialog')).hide();
                fetchAndRenderProducts();
                showToast('Product saved successfully', true);
            } else {
                const err = await res.json();
                showToast('Product save failed', false);
                errorDiv.textContent = err.detail || 'Failed to save product.';
                errorDiv.style.display = 'block';
            }
        } catch (e) {
            hideLoader();
            showToast('Product save failed', false);
            errorDiv.textContent = 'Network error.';
            errorDiv.style.display = 'block';
        }
    };
}

// Add Product button
const addProductBtn = document.getElementById('addProductBtn');
if (addProductBtn) {
    addProductBtn.onclick = function() {
        showProductModal(false);
    };
}

// Edit product
window.editProduct = async function(id) {
    try {
        const res = await fetch(`/api/v1/products/${id}`, { headers: authHeaders() });
        if (res.ok) {
            const product = await res.json();
            showProductModal(true, product);
        }
    } catch (e) {}
};

// Delete product
window.deleteProduct = async function(id) {
    console.log('Delete button clicked for product:', id);
    
    // Remove any existing delete modal
    const existingModal = document.getElementById('deleteProductModal');
    if (existingModal) {
        console.log('Removing existing modal');
        existingModal.remove();
    }
    
    // Create new modal container
    console.log('Creating new modal container');
    const deleteModalContainer = document.createElement('div');
    deleteModalContainer.id = 'deleteProductModal';
    document.body.appendChild(deleteModalContainer);
    
    console.log('Setting modal HTML');
    deleteModalContainer.innerHTML = `
    <div class="modal fade" tabindex="-1" id="deleteProductModalDialog" aria-labelledby="deleteProductModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="border-radius: 12px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <div class="modal-body text-center p-5">
                    <div class="mb-4">
                        <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size: 3rem;"></i>
                    </div>
                    <h5 class="fw-bold mb-3">Delete Product</h5>
                    <p class="text-muted mb-4" style="font-size: 0.95rem; line-height: 1.5;">Are you sure you want to delete this product? This action cannot be undone.</p>
                    <div class="d-flex justify-content-center gap-3">
                        <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal" style="border-radius: 8px;">Cancel</button>
                        <button type="button" class="btn btn-danger px-4" id="confirmDeleteBtn" style="border-radius: 8px;">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    // Get the modal element and initialize it
    const deleteModalElement = document.getElementById('deleteProductModalDialog');
    console.log('Modal element found:', deleteModalElement);
    
    if (!deleteModalElement) {
        console.error('Modal element not found!');
        return;
    }

    // Wait for the next tick to ensure DOM is updated
    setTimeout(() => {
        console.log('Initializing Bootstrap modal');
        const deleteModalInstance = new bootstrap.Modal(deleteModalElement);
        
        console.log('Showing modal');
        deleteModalInstance.show();

        // Handle delete confirmation
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        console.log('Confirm button found:', confirmBtn);
        
        if (confirmBtn) {
            confirmBtn.onclick = async function() {
                console.log('Delete confirmed for product:', id);
                try {
                    const res = await fetch(`/api/v1/products/${id}`, {
                        method: 'DELETE',
                        headers: authHeaders()
                    });
                    if (res.ok) {
                        console.log('Product deleted successfully');
                        deleteModalInstance.hide();
                        fetchAndRenderProducts();
                        showToast('Product deleted successfully', true);
                    } else {
                        console.error('Failed to delete product');
                        showToast('Failed to delete product', false);
                    }
                } catch (e) {
                    console.error('Error deleting product:', e);
                    showToast('Failed to delete product', false);
                }
            };
        } else {
            console.error('Confirm button not found!');
        }

        // Clean up modal when hidden
        deleteModalElement.addEventListener('hidden.bs.modal', function () {
            console.log('Modal hidden, cleaning up');
            deleteModalContainer.remove();
        });
    }, 0);
};

// On page load, render products if on products page
if (document.getElementById('productsTable')) {
    fetchAndRenderProducts();
}

// Utility: Show loader
function showLoader(text) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.innerHTML = `
        <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="z-index:2000;background:rgba(255,255,255,0.6);">
            <div class="text-center">
                <div class="spinner-border text-primary mb-2" style="width:3rem;height:3rem;" role="status"></div>
                <div class="fw-semibold">${text}</div>
            </div>
        </div>`;
        document.body.appendChild(loader);
    } else {
        loader.querySelector('.fw-semibold').textContent = text;
        loader.style.display = 'block';
    }
}
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

// Utility: Show toast
function showToast(msg, success=true) {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.innerHTML = `<div class="toast align-items-center text-white bg-${success ? 'success' : 'danger'} border-0 position-fixed bottom-0 end-0 m-4" role="alert" aria-live="assertive" aria-atomic="true" style="z-index:3000;min-width:200px;">
            <div class="d-flex">
                <div class="toast-body">${msg}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;
        document.body.appendChild(toast);
    } else {
        toast.querySelector('.toast-body').textContent = msg;
        toast.className = `toast align-items-center text-white bg-${success ? 'success' : 'danger'} border-0 position-fixed bottom-0 end-0 m-4`;
    }
    const bsToast = new bootstrap.Toast(toast.querySelector('.toast'));
    bsToast.show();
}

// New Dialog Modal logic
const newDialogBtn = document.getElementById('newDialogBtn');
if (newDialogBtn) {
    newDialogBtn.onclick = function() {
        const modal = new bootstrap.Modal(document.getElementById('newDialogModal'));
        modal.show();
    };
}
const saveNewDialogBtn = document.getElementById('saveNewDialogBtn');
if (saveNewDialogBtn) {
    saveNewDialogBtn.onclick = function() {
        // Just close the modal, no backend integration
        const modal = bootstrap.Modal.getInstance(document.getElementById('newDialogModal'));
        modal.hide();
    };
}

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('business_id');
    window.location.href = 'login.html';
}


