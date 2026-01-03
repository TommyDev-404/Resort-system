import { notifications } from './home-dashboard.js';

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

function loadingAnimationLogout(){
      const load = `
            <div id="loading" class="absolute top-0 left-0 flex flex-col items-center justify-center h-screen inset-0 bg-black/20 text-white space-y-2 backdrop-blur-[2px] z-50">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black dark:text-white">Logging out...</p>
            </div>
      `;      

      document.getElementById('loadingDataPortal').innerHTML += load;
}

function showLoader(sectionId) {
      // Hide all sections
      contentSections.forEach(section => section.classList.add('hidden'));

      loadingAnimation0(); // adds #loading inside #loadingPortal
}

function showLoaderLogout() {
      loadingAnimationLogout(); // adds #loading inside #loadingDataPortal
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
            showLoaderLogout();
            try {
                  const response = await fetch('/logout', { method: 'POST' });
                  if (response.ok) {
                        hideLoaderLogout();
                        successMessageCard6('Log out successfully', '/login');
                  }
            } catch (err) {
                  hideLoaderLogout();
                  failedMessageCard6(`Logout failed: ${err}`);
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

function successMessageCard6(message, redirect = null) {
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="success-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4">
                        <i data-lucide="circle-check" class="w-15 h-15 text-green-500"></i>
                        <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600 px-6 py-2" id="close-message">Okay</button>
                  </div>
            </div>
      `;

      // Append message popup
      document.getElementById('messagePortal').innerHTML += msg;
      lucide.createIcons();

      document.getElementById("close-message").addEventListener("click", () =>  {
            const box = document.getElementById("success-message");
            box.remove();

            if (redirect)  window.location.href = redirect;
      });
}

function failedMessageCard6(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="failed-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4">
                        <i data-lucide="circle-x" class="w-15 h-15 text-center font-bold text-red-500"></i>
                        <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600 w-70" id="close-failed-message">Okay</button>
                  </div>
            </div>
      `;

      document.getElementById('messagePortal').innerHTML += msg;
      lucide.createIcons();
      
      document.getElementById("close-failed-message").addEventListener("click", () =>  {
            const box = document.getElementById("failed-message");
            box.remove();
      });
}
