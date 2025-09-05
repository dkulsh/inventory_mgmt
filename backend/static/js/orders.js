// Global variables
let currentOrderType = 'booked';
let currentStatus = 'all';
let currentTenantId = null;
let currentDateRange = {
    type: '7',
    startDate: null,
    endDate: null
};
let autoRefreshInterval = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    startAutoRefresh();
});

// Initialize page components
async function initializePage() {
    // Set up date range
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    document.getElementById('startDate').value = sevenDaysAgo.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    // Initialize tenant selection based on user role
    await initializeTenantSelection();
    
    // Load initial orders
    loadOrders();
}

// Set up event listeners
function setupEventListeners() {
    // Tab change event
    document.querySelectorAll('#orderTabs button').forEach(button => {
        button.addEventListener('click', function(e) {
            currentOrderType = e.target.id.split('-')[0];
            loadOrders();
        });
    });

    // Status filter buttons
    document.querySelectorAll('[data-status]').forEach(button => {
        button.addEventListener('click', function(e) {
            document.querySelectorAll('[data-status]').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentStatus = e.target.dataset.status;
            loadOrders();
        });
    });
}

// Initialize tenant selection based on user role
async function initializeTenantSelection() {
    const userRole = localStorage.getItem('user_role');
    const tenantId = localStorage.getItem('tenant_id');
    const tenantSelect = document.getElementById('tenantSelect');
    
    if (['SuperAdmin', 'TechAdmin', 'SalesAdmin'].includes(userRole)) {
        // Load all tenants
        await loadTenants(tenantSelect);
    } else {
        // Pre-select and disable tenant dropdown
        await loadTenants(tenantSelect, tenantId);
        tenantSelect.disabled = true;
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
                currentTenantId = tenants[0].TenantId;
            }
        }
    } catch (error) {
        showToast('Error', 'Failed to load tenants', 'error');
    }
}

// Handle tenant selection change
function handleTenantChange() {
    currentTenantId = document.getElementById('tenantSelect').value;
    loadOrders();
}

// Handle date range selection change
function handleDateRangeChange() {
    const dateRangeSelect = document.getElementById('dateRangeSelect');
    const customDateRange = document.getElementById('customDateRange');
    
    currentDateRange.type = dateRangeSelect.value;
    
    if (currentDateRange.type === 'custom') {
        customDateRange.classList.remove('d-none');
    } else {
        customDateRange.classList.add('d-none');
        updateDateRange();
    }
    
    loadOrders();
}

// Handle custom date range change
function handleCustomDateChange() {
    updateDateRange();
    loadOrders();
}

// Update date range based on selection
function updateDateRange() {
    const today = new Date();
    let startDate = new Date();
    
    switch (currentDateRange.type) {
        case '7':
            startDate.setDate(today.getDate() - 7);
            break;
        case '30':
            startDate.setDate(today.getDate() - 30);
            break;
        case 'all':
            startDate = new Date(2000, 0, 1); // Far past date
            break;
        case 'custom':
            startDate = new Date(document.getElementById('startDate').value);
            break;
    }
    
    currentDateRange.startDate = startDate.toISOString().split('T')[0];
    currentDateRange.endDate = currentDateRange.type === 'custom' 
        ? document.getElementById('endDate').value 
        : today.toISOString().split('T')[0];
}

// Load orders based on current filters
async function loadOrders() {
    showLoading(true);
    
    try {
        const response = await fetchOrders();
        displayOrders(response);
    } catch (error) {
        showError('Failed to load orders. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Fetch orders from the API
async function fetchOrders() {
    const queryParams = new URLSearchParams({
        type: currentOrderType,
        status: currentStatus,
        tenantId: currentTenantId,
        startDate: currentDateRange.startDate,
        endDate: currentDateRange.endDate
    });
    
    const response = await fetch(`/api/v1/orders/?${queryParams}`, {
        headers: authHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to fetch orders');
    }
    
    return await response.json();
}

// Display orders in the table
function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';
    
    if (orders.length === 0) {
        document.getElementById('noOrdersMessage').classList.remove('d-none');
        return;
    }
    
    document.getElementById('noOrdersMessage').classList.add('d-none');
    
    orders.forEach(order => {
        // Calculate total amount from ordered products
        const totalAmount = order.ordered_products.reduce((sum, product) => sum + product.TotalCost, 0);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.Id}</td>
            <td>${formatDate(order.OrderDateTime)}</td>
            <td>${order.dealerName || '-'}</td>
            <td>${formatCurrency(totalAmount)}</td>
            <td><span class="badge bg-${getStatusColor(order.OrderStatus)}">${order.OrderStatus}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="showOrderDetails(${order.Id})">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="showStatusUpdateModal(${order.Id})">
                    <i class="bi bi-pencil"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Show order details
async function showOrderDetails(orderId) {
    try {
        const order = await fetchOrderDetails(orderId);
        displayOrderDetails(order);
    } catch (error) {
        showError('Failed to load order details. Please try again.');
    }
}

// Fetch order details from the API
async function fetchOrderDetails(orderId) {
    const response = await fetch(`/api/v1/orders/${orderId}`, {
        headers: authHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to fetch order details');
    }
    return await response.json();
}

// Display order details in the modal
function displayOrderDetails(order) {
    try {
        // Update order information
        document.getElementById('detailOrderId').textContent = order.Id;
        document.getElementById('detailOrderDate').textContent = formatDate(order.OrderDateTime);
        document.getElementById('detailOrderStatus').innerHTML = `<span class="badge bg-${getStatusColor(order.OrderStatus)}">${order.OrderStatus}</span>`;
        
        // Update dealer information
        document.getElementById('detailDealerName').textContent = order.dealerName || '-';
        document.getElementById('detailDealerEmail').textContent = order.dealerEmail || '-';
        document.getElementById('detailDealerPhone').textContent = order.dealerPhone || '-';
        
        // Update order items
        const tableBody = document.getElementById('orderItemsTableBody');
        tableBody.innerHTML = '';
        
        order.ordered_products.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.ProductId}</td>
                <td>${item.Quantity}</td>
                <td>${formatCurrency(item.Price)}</td>
                <td>${formatDiscount(item.DiscountType, item.DiscountAmount)}</td>
                <td>${formatTax(item.TaxType, item.TaxAmount)}</td>
                <td>${formatCurrency(item.TotalCost)}</td>
            `;
            tableBody.appendChild(row);
        });
        
        // Update total amount
        const totalAmount = order.ordered_products.reduce((sum, product) => sum + product.TotalCost, 0);
        document.getElementById('detailTotalAmount').textContent = formatCurrency(totalAmount);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    } catch (error) {
        console.error('Error displaying order details:', error);
        showError('Failed to load order details. Please try again.');
    }
}

// Format discount display
function formatDiscount(type, amount) {
    if (!type || !amount) return '-';
    return type === 'Percentage' ? `${amount}%` : formatCurrency(amount);
}

// Format tax display
function formatTax(type, amount) {
    if (!type || !amount) return '-';
    return `${type} (${amount}%)`;
}

// Show toast notification
function showToast(title, message, type = 'success') {
    // Convert type to success boolean for compatibility with Products page format
    const success = type === 'success';
    
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
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        document.body.appendChild(toast);
    } else {
        toast.querySelector('.toast-body').textContent = message;
        toast.className = `toast align-items-center text-white bg-${success ? 'success' : 'danger'} border-0 position-fixed bottom-0 end-0 m-4`;
    }
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Show error notification
function showError(message) {
    showToast('Error', message, 'error');
}

// Show success notification
function showSuccess(message) {
    showToast('Success', message, 'success');
}

// Show status update modal
function showStatusUpdateModal(orderId) {
    const modal = new bootstrap.Modal(document.getElementById('statusUpdateModal'));
    document.getElementById('statusUpdateModal').dataset.orderId = orderId;
    modal.show();
}

// Update order status
async function updateOrderStatus() {
    const orderId = document.getElementById('statusUpdateModal').dataset.orderId;
    const newStatus = document.getElementById('orderStatusSelect').value;
    
    try {
        const response = await fetch(`/api/v1/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders()
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update order status');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('statusUpdateModal')).hide();
        loadOrders();
        showSuccess('Order status updated successfully');
    } catch (error) {
        showError('Failed to update order status. Please try again.');
    }
}

// Refresh orders
function refreshOrders() {
    loadOrders();
}

// Start auto-refresh
function startAutoRefresh() {
    // Clear any existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Set up new interval (15 minutes)
    autoRefreshInterval = setInterval(loadOrders, 15 * 60 * 1000);
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function getStatusColor(status) {
    const colors = {
        'New': 'primary',
        'InProgress': 'warning',
        'Done': 'success',
        'Cancelled': 'danger'
    };
    return colors[status] || 'secondary';
}

function showLoading(show) {
    document.getElementById('loadingSpinner').classList.toggle('d-none', !show);
}

// Helper functions for user context
function getUserRole() {
    return localStorage.getItem('user_role');
}

function getUserTenantId() {
    return localStorage.getItem('tenant_id');
}

// API helper functions
async function fetchTenants() {
    const response = await fetch('/api/v1/tenants/');
    if (!response.ok) {
        throw new Error('Failed to fetch tenants');
    }
    return await response.json();
}

async function fetchTenantDetails(tenantId) {
    const response = await fetch(`/api/v1/tenants/${tenantId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
    }
    return await response.json();
} 