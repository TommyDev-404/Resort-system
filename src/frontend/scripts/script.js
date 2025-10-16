import { dashboardData } from "./dashboard.js";


//lucide.createIcons();

const sidebarItems = document.querySelectorAll('.sidebar-item');
const contentSections = document.querySelectorAll('.content-section');
const menuButton = document.getElementById('menu-button');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

/*---------------- MAIN SYSTEM EVENT LISTENER ----------------*/
function toggleSidebar() {
      const isHidden = sidebar.classList.contains('-translate-x-full');
      
      if (isHidden) {
            // Show sidebar
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            sidebarOverlay.classList.remove('opacity-0', 'pointer-events-none');
            sidebarOverlay.classList.add('opacity-50');
      } else {
            // Hide sidebar
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
            sidebarOverlay.classList.add('opacity-0', 'pointer-events-none');
            sidebarOverlay.classList.remove('opacity-50');
      }
}

function switchContent(sectionId) {
      // 1. Hide all content sections
      contentSections.forEach(section => {
            section.style.display = 'none';
      });

      // 2. Show the selected content section
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
            targetSection.style.display = 'block';
      }

      // 3. Update active state in sidebar
      sidebarItems.forEach(item => {
            item.classList.remove('active', 'text-white', 'text-gray-700');
            if (item.getAttribute('data-section') === sectionId) { // active the current sidebar selected
                  item.classList.add('active');
            } else {
                  item.classList.add('text-gray-700');
            }
      });

      // 4. Hide sidebar on mobile after selection
      if (window.innerWidth < 1024) {
            toggleSidebar();
      }
}

// --- Event Listeners ---
sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
      const sectionId = item.getAttribute('data-section');
      if (sectionId) {
            switchContent(sectionId);
      }
      });
});

menuButton.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

// Initial load: ensure the default content is shown and charts are drawn
window.onload = function () {
      // Default to Home Dashboard
      switchContent('home-dashboard');
      dashboardData();
};