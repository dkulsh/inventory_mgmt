// Sidebar functionality for expandable Admin Panel with role-based navigation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize role-based navigation
    initializeRoleBasedNavigation();
    
    const adminPanelToggle = document.getElementById('adminPanelToggle');
    const adminSubmenu = document.getElementById('adminSubmenu');
    const adminPanelIcon = document.getElementById('adminPanelIcon');

    if (adminPanelToggle && adminSubmenu && adminPanelIcon) {
        adminPanelToggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Toggle submenu visibility
            if (adminSubmenu.style.display === 'none' || adminSubmenu.style.display === '') {
                adminSubmenu.style.display = 'block';
                adminPanelIcon.classList.remove('bi-chevron-down');
                adminPanelIcon.classList.add('bi-chevron-up');
            } else {
                adminSubmenu.style.display = 'none';
                adminPanelIcon.classList.remove('bi-chevron-up');
                adminPanelIcon.classList.add('bi-chevron-down');
            }
        });

        // Check if current page is user-management.html, business-management.html, or tenant-management.html and expand Admin Panel
        if (window.location.pathname.includes('user-management.html') || window.location.pathname.includes('business-management.html') || window.location.pathname.includes('tenant-management.html')) {
            adminSubmenu.style.display = 'block';
            adminPanelIcon.classList.remove('bi-chevron-down');
            adminPanelIcon.classList.add('bi-chevron-up');
        }
    }
});

// Initialize role-based navigation
async function initializeRoleBasedNavigation() {
    try {
        // Get current user info
        const response = await fetch('/api/v1/users/me', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            console.error('Failed to get current user');
            return;
        }
        
        const currentUser = await response.json();
        
        // Apply role-based visibility
        applyRoleBasedVisibility(currentUser.Role);
        
    } catch (error) {
        console.error('Error initializing role-based navigation:', error);
    }
}

// Apply role-based visibility to menu items
function applyRoleBasedVisibility(userRole) {
    const adminSubmenu = document.getElementById('adminSubmenu');
    const adminPanelToggle = document.getElementById('adminPanelToggle');
    
    // Hide Products menu item for Dealers
    const productsMenuItem = document.querySelector('a[href="products.html"]')?.closest('.nav-item');
    if (productsMenuItem) {
        if (['DealerAdmin', 'Dealer'].includes(userRole)) {
            productsMenuItem.style.display = 'none';
        } else {
            productsMenuItem.style.display = 'block';
        }
    }
    
    if (!adminSubmenu || !adminPanelToggle) {
        return;
    }
    
    // Get all menu items
    const menuItems = adminSubmenu.querySelectorAll('.nav-item');
    
    // Hide all menu items first
    menuItems.forEach(item => {
        item.style.display = 'none';
    });
    
    // Show menu items based on role
    switch (userRole) {
        case 'SuperAdmin':
        case 'TechAdmin':
        case 'SalesAdmin':
            // Show all admin menu items
            menuItems.forEach(item => {
                item.style.display = 'block';
            });
            // Show admin panel toggle
            adminPanelToggle.style.display = 'block';
            break;
            
        case 'WholesalerAdmin':
        case 'Wholesaler':
            // Show only business management and user management
            menuItems.forEach(item => {
                const link = item.querySelector('a');
                if (link && (link.href.includes('business-management.html') || link.href.includes('user-management.html'))) {
                    item.style.display = 'block';
                }
            });
            // Show admin panel toggle
            adminPanelToggle.style.display = 'block';
            break;
            
        case 'DealerAdmin':
        case 'Dealer':
            // Show only user management
            menuItems.forEach(item => {
                const link = item.querySelector('a');
                if (link && link.href.includes('user-management.html')) {
                    item.style.display = 'block';
                }
            });
            // Show admin panel toggle
            adminPanelToggle.style.display = 'block';
            break;
            
        default:
            // Hide admin panel completely for other roles
            adminPanelToggle.style.display = 'none';
            break;
    }
}

// Logout function
function logout() {
    // Clear any stored tokens or user data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    
    // Redirect to login page
    window.location.href = 'login.html';
}


