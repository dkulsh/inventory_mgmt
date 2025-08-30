// Get current user from localStorage
const currentUser = JSON.parse(localStorage.getItem('user'));

// Initialize admin panel based on user role
function initializeAdminPanel() {
    const adminMenu = document.getElementById('adminMenu');
    adminMenu.innerHTML = ''; // Clear existing menu items

    // Add menu items based on user role
    switch (currentUser.Role) {
        case 'SuperAdmin':
        case 'TechAdmin':
        case 'SalesAdmin':
            addMenuItem(adminMenu, 'Tenant Management', 'tenants', 'bi-building');
            addMenuItem(adminMenu, 'Business Management', 'businesses', 'bi-shop');
            addMenuItem(adminMenu, 'User Management', 'users', 'bi-people');
            break;
        case 'WholesalerAdmin':
            addMenuItem(adminMenu, 'Manage Dealers', 'dealers', 'bi-shop');
            addMenuItem(adminMenu, 'Manage Wholesaler Users', 'wholesaler-users', 'bi-people');
            break;
        case 'DealerAdmin':
            addMenuItem(adminMenu, 'Manage Dealer Users', 'dealer-users', 'bi-people');
            break;
    }

    // Load default section
    loadSection('tenants');
}

// Add menu item to sidebar
function addMenuItem(menu, text, section, icon) {
    const li = document.createElement('li');
    li.className = 'nav-item';
    
    const a = document.createElement('a');
    a.className = 'nav-link d-flex align-items-center';
    a.href = '#';
    a.dataset.section = section;
    
    const iconSpan = document.createElement('i');
    iconSpan.className = `bi ${icon} me-2`;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    a.appendChild(iconSpan);
    a.appendChild(textSpan);
    li.appendChild(a);
    menu.appendChild(li);
}

// Load section content
function loadSection(section) {
    const adminContent = document.getElementById('adminContent');
    
    // Update page title and description based on section
    const pageTitle = document.querySelector('.container-fluid h4');
    const pageDescription = document.querySelector('.container-fluid p.text-muted');
    
    switch (section) {
        case 'tenants':
            pageTitle.textContent = 'Tenant Management';
            pageDescription.textContent = 'Create and manage tenants';
            loadTenantManagement();
            break;
        case 'businesses':
            pageTitle.textContent = 'Business Management';
            pageDescription.textContent = 'Create and manage wholesalers and dealers';
            loadBusinessManagement();
            break;
        case 'users':
            pageTitle.textContent = 'User Management';
            pageDescription.textContent = 'Create and manage system users';
            loadUserManagement();
            break;
        case 'dealers':
            pageTitle.textContent = 'Dealer Management';
            pageDescription.textContent = 'Manage dealers for your wholesaler';
            loadDealerManagement();
            break;
        case 'wholesaler-users':
            pageTitle.textContent = 'Wholesaler User Management';
            pageDescription.textContent = 'Manage users for your wholesaler';
            loadWholesalerUserManagement();
            break;
        case 'dealer-users':
            pageTitle.textContent = 'Dealer User Management';
            pageDescription.textContent = 'Manage users for your dealer';
            loadDealerUserManagement();
            break;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Menu click handlers
    document.getElementById('adminMenu').addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) {
            e.preventDefault();
            const section = link.dataset.section;
            loadSection(section);
            
            // Update active state
            document.querySelectorAll('#adminMenu .nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
        }
    });

    // Sidebar collapse button
    document.getElementById('sidebarCollapse').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    });

    // Modal save button
    document.getElementById('adminModalSave').addEventListener('click', handleModalSave);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeAdminPanel();
}); 