// Sidebar functionality for expandable Admin Panel
document.addEventListener('DOMContentLoaded', function() {
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

        // Check if current page is user-management.html and expand Admin Panel
        if (window.location.pathname.includes('user-management.html')) {
            adminSubmenu.style.display = 'block';
            adminPanelIcon.classList.remove('bi-chevron-down');
            adminPanelIcon.classList.add('bi-chevron-up');
        }
    }
});

// Logout function
function logout() {
    // Clear any stored tokens or user data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

