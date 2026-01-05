import { notifications } from './home-dashboard.js';
import {failedToast } from './helper.js';

lucide.createIcons();

// DOM Elements
const sidebarItems = document.querySelectorAll('.sidebar-item');
const contentSections = document.querySelectorAll('.content-section');
const sidebar = document.getElementById('sidebar');
let prev_item = null;

const sectionControllerMap = {
      'home-dashboard': () => import('./home-dashboard.js'),
      'analytics': () => import('./analytics.js'),
      'all-reservations': () => import('./all-reservations.js'),
      'housekeeping': () => import('./housekeeping.js'),
      'rates-availability': () => import('./rates_availability.js'),
      'accounting': () => import('./accounting.js'),
      'revenue-management': () => import('./revenue_mgmt.js'),
      'staff-management': () => import('./staff_mgmt.js'),
      'admin-profile': () => import('./admin.js')
};

/*---------------- SIDEBAR TOGGLE ----------------*/
function loadingAnimation0(){
      const load = `
            <div id="loading" class="absolute top-0 left-0 flex flex-col items-center justify-center h-screen inset-0 bg-black/5 text-white space-y-2 backdrop-blur-[2px]">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black dark:text-white">Loading data...</p>
            </div>
      `;      

      document.getElementById('loadingPortal').innerHTML += load;
}

function successToastRedirect(message, redirect = null, duration = 3000) {
      const toast = `
      <div class="fixed top-4 left-1/2 z-50 flex items-center gap-4 dark:text-gray-100 bg-gray-50  dark:bg-gray-600 border   border-gray-200 dark:border-gray-500 shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-xl px-5 py-4 text-gray-800 transform -translate-x-1/2 -translate-y-full scale-95 opacity-0 transition-all duration-300 ease-out" data-toast>

      <!-- Icon -->
      <div class="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 dark:bg-green-500  border border-green-500">
            <i data-lucide="check" class="w-5 h-5 text-green-600 dark:text-white"></i>
      </div>

      <!-- Message -->
      <span class="text-sm font-medium leading-tight">
            ${message}
      </span>
</div>
      `;

      const portal = document.getElementById('messagePortal');
      portal.insertAdjacentHTML('beforeend', toast);
      lucide.createIcons();

      const toastEl = portal.querySelector('[data-toast]:last-child');

      // trigger slide-in
      requestAnimationFrame(() => {
            toastEl.classList.remove('-translate-y-full', 'opacity-0');
      });

      // auto remove (slide out)
      setTimeout(() => {
            toastEl.classList.add('-translate-y-full', 'opacity-0');
            setTimeout(() => toastEl.remove(), 300);
      }, duration);
      
      if (redirect) {
            showLoader('Logging out...');
            window.location.href = redirect;
      }
}

function loadingAnimationLogout(message){
      const load = `
            <div id="loading" class="absolute top-0 left-0 flex flex-col items-center justify-center h-screen inset-0 bg-black/20 text-white space-y-2 backdrop-blur-[2px] z-50">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black dark:text-white">${message}</p>
            </div>
      `;      

      document.getElementById('loadingDataPortal').innerHTML += load;
}

function showLoader(sectionId) {
      // Hide all sections
      contentSections.forEach(section => section.classList.add('hidden'));

      loadingAnimation0(); // adds #loading inside #loadingPortal
}

function hideLoaderLogout() {
      const loader = document.querySelector('#loading');
      if (loader) loader.remove();
}

function hideLoader(sectionId) {
      const loader = document.querySelector('#loading');
      if (loader) loader.remove();
      
      // Show target section
      const targetSection = document.getElementById(sectionId);
      if (targetSection) targetSection.classList.remove('hidden');
}

/*---------------- SWITCH CONTENT ----------------*/
async function switchContent(sectionId) {
      if (!sectionId) return;

      // Update sidebar active state
      sidebarItems.forEach(item => {
            const isActive = item.dataset.section === sectionId;
            if (item.getAttribute('data-section') !== 'logout') {
                  item.classList.toggle('active', isActive);
                  item.classList.toggle('text-white', isActive);
                  item.classList.toggle('text-gray-900', !isActive);
            }
      });
      
      showLoader(sectionId);
      
      try {
            // Dynamically import module if exists
            if (sectionControllerMap[sectionId]) {
                  const module = await sectionControllerMap[sectionId]();
                  const initFunc = Object.values(module)[0];
                  if (initFunc) await initFunc(); // wait if async
            }

      } catch (err) {
            console.error(`Error loading ${sectionId}:`, err);
      }
      hideLoader(sectionId);
}

function logout(){
      logoutCard();
      // cancel
      document.querySelector('#cancelLogout').addEventListener('click', (e) => {
            document.querySelector('#logoutModal').remove();
      });

      // logout
      document.querySelector('#confirmLogout').addEventListener('click', async (e) => {
            loadingAnimationLogout('Processing...')
            try {
                  const response = await fetch('/logout', { method: 'POST' });
                  if (response.ok) {
                        hideLoaderLogout();
                        successToastRedirect('Log-out successfully!', '/login');
                  }
            } catch (err) {
                  hideLoaderLogout();
                  failedToast(`Logout failed: ${err}`);
            }
      });
}

/*---------------- EVENT LISTENERS ----------------*/
sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
            
            if(item.dataset.section === 'logout'){
                  logout();
            }
            else{
                  if (prev_item !== item.dataset.section) switchContent(item.dataset.section);
                  prev_item = item.dataset.section;
            }
      });
});


document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const logoText = document.getElementById('logoText');
      const hamburgerIcon = document.getElementById('hamburgerIcon');
      const textElements = sidebar.querySelectorAll('span');
      const notificationModal = document.getElementById('notification-modal');
      const adminMenu = document.getElementById('adminMenu');
      const closeSidebar = document.getElementById('closeSidebar');
      const clickedNotification = e.target.closest('#notification');
      const clickedAdmin = e.target.closest('#adminButton');
      const isInsideNotification = notificationModal.contains(e.target);
      const isInsideAdmin = adminMenu.contains(e.target);
      
      // open notif & close admin
      if (clickedNotification) {
            adminMenu.classList.add('hidden');
            notificationModal.classList.toggle('hidden');
            return; 
      }
      
      // open admin & close notif
      if (clickedAdmin) {
            notificationModal.classList.add('hidden');
            adminMenu.classList.toggle('hidden');
            return;
      }

      // --- Handle outside click ---
      if (!isInsideNotification && !isInsideAdmin) {
            adminMenu.classList.add('hidden');
            notificationModal.classList.add('hidden');
      }
      
      // toggle sidebar
      if (e.target.closest('#toggleSidebar')){
            logoText.classList.toggle('max-w-[180px]');
            logoText.classList.toggle('opacity-100');
            sidebar.classList.toggle('w-[280px]');

            textElements.forEach(span => {
                  span.classList.toggle('max-w-[200px]');
                  span.classList.toggle('opacity-100');
            });
            
            hamburgerIcon.classList.toggle('hidden');
            closeSidebar.classList.toggle('hidden');
      };

      // toggle darkmode
      if (e.target.closest('#darkModeToggle')){
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            document.querySelector('#darkIcon').classList.toggle('hidden'); 
            document.querySelector('#lightIcon').classList.toggle('hidden');
            lucide.createIcons();
      }

      if (e.target.closest('#profile-shortcut')) switchContent('admin-profile');
      if (e.target.closest('#housekeeping-notif')) (switchContent('housekeeping'), document.querySelector('#notification-modal').classList.add('hidden'), document.querySelector('#notificationsModal').remove());
      if (e.target.closest('#bookings-notif')) (switchContent('all-reservations'), document.querySelector('#notification-modal').classList.add('hidden'), document.querySelector('#notificationsModal').remove());
      if (e.target.closest('#redirect-promo')) (switchContent('revenue-management'), document.querySelector('#notification-modal').classList.add('hidden'), document.querySelector('#notificationsModal').remove());
      if (e.target.closest('#logoutButton')) logout();
});

/*---------------- INITIAL LOAD ----------------*/
window.addEventListener('DOMContentLoaded', async() => {
      showLoader('home-dashboard');
      await notifications();
      switchContent('home-dashboard'); // Show default section
      
      // remember darkmode on load with its icon
      localStorage.getItem('theme') === 'dark' ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
      localStorage.getItem('theme') === 'dark' ? document.querySelector('#lightIcon').classList.toggle('hidden') : document.querySelector('#darkIcon').classList.toggle('hidden');
      hideLoader();
});

function logoutCard(){
      const modal = `
            <div id="logoutModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-80 text-center">
                  <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Confirm Logout</h2>
                  <p class="text-gray-600 mb-6 dark:text-gray-400">Are you sure you want to log out?</p>
                  <div class="flex justify-between">
                        <button id="cancelLogout" class="bg-gray-700 dark:bg-white/5 px-4 py-2 rounded hover:bg-gray-400 ">Cancel</button>
                        <button id="confirmLogout" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500">Logout</button>
                  </div>
                  </div>
            </div>
      `;

      document.getElementById('logoutPortal').innerHTML += modal;
}

