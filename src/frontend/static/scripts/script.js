// Import page initialization functions
import { initPageDashboard } from "./controller/home-dashboard.js";
import { initPageAnalytics } from "./controller/analytics.js";
import { initPageReservation } from "./controller/all-reservations.js";
import { initPageHousekeeping } from "./controller/housekeeping.js";
import { initPageRatesAndAvailability } from "./controller/rates_availability.js";
import { initPageAccounting } from "./controller/accounting.js";
import { initPageAdmin } from "./controller/admin.js";
import { initPageRevenueMgmt } from "./controller/revenue_mgmt.js";

lucide.createIcons()

// DOM Elements
const sidebarItems = document.querySelectorAll('.sidebar-item');
const contentSections = document.querySelectorAll('.content-section');
const sidebar = document.getElementById('sidebar');

// Map section IDs to their respective initialization functions
const sectionInitMap = {
    'home-dashboard': initPageDashboard,
    'analytics': initPageAnalytics,
    'all-reservations': initPageReservation,
    'housekeeping': initPageHousekeeping,
    'rates-availability': initPageRatesAndAvailability,
    'accounting': initPageAccounting,
    'revenue-management':  initPageRevenueMgmt,
    'admin-profile': initPageAdmin
};

/*---------------- SIDEBAR TOGGLE ----------------*/
function toggleSidebar() {
    const isHidden = sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full', !isHidden);
    sidebar.classList.toggle('translate-x-0', isHidden);
    sidebarOverlay.classList.toggle('opacity-0', isHidden);
    sidebarOverlay.classList.toggle('pointer-events-none', isHidden);
    sidebarOverlay.classList.toggle('opacity-50', !isHidden);
}

function logoutCard(){
    const modal = `
        <div id="logoutModal" class="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                <h2 class="text-lg font-bold mb-4">Confirm Logout</h2>
                <p class="text-gray-600 mb-6">Are you sure you want to log out?</p>
                <div class="flex justify-between">
                <button id="cancelLogout" class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                <button id="confirmLogout" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500">Logout</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('logoutPortal').innerHTML += modal;
}


function successMessageCard(message, redirect=null){
    const msg = `
        <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="success-message">
                <div class="bg-white w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                    <i class="ti ti-circle-check text-6xl font-light text-green-500"></i>
                    <h2 class="text-lg text-gray-600" id="message">${message}</h2>
                    <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-message">Okay</button>
                </div>
        </div>
    `;
    document.getElementById('messagePortal').innerHTML += msg;

    document.querySelector('#close-message').addEventListener('click', (e) => {
        if (redirect) window.location.href = redirect;
        document.querySelector('#logoutModal').remove();
    });
}

function failedMessageCard(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="failed-message">
                  <div class="bg-white w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                        <i class="ti ti-circle-x text-6xl font-light text-red-500"></i>
                        <h2 class="text-lg text-gray-600" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-failed-message">Okay</button>
                  </div>
            </div>
      `;

      document.getElementById('messagePortal').innerHTML += msg;
}


/*---------------- SWITCH CONTENT ----------------*/
function switchContent(sectionId) {
    if (!sectionId) return;
    
    // Hide all sections
    contentSections.forEach(section => section.style.display = 'none');

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';

        // Initialize section if a function exists
        if (sectionInitMap[sectionId]) sectionInitMap[sectionId]();
    }

    // Update sidebar active state
    sidebarItems.forEach(item => {
        const isActive = item.dataset.section === sectionId;
        item.classList.toggle('active', isActive);
        item.classList.toggle('text-white', isActive);
        item.classList.toggle('text-gray-700', !isActive);
    });

    // Hide sidebar on mobile after selection
    if (window.innerWidth < 1024) toggleSidebar();
}

/*---------------- EVENT LISTENERS ----------------*/
sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        
        if(item.dataset.section === 'logout'){
            logoutCard();
            
            // cancel
            document.querySelector('#cancelLogout').addEventListener('click', (e) => {
                document.querySelector('#logoutModal').remove();
            });

            // logout
            document.querySelector('#confirmLogout').addEventListener('click', async (e) => {
                try {
                    const response = await fetch('/logout', { method: 'POST' });
                    if (response.ok) {
                        successMessageCard('You have been logged out.', '/login');
                    }
                } catch (err) {
                    failedMessageCard(`Logout failed: ${err}`);
                }
            });
        }
        else{
            switchContent(item.dataset.section)
        }
    
    });
});

document.addEventListener('click', (e) => {
    if (e.target.matches('#admin-profile-shortcut')){
        switchContent('admin-profile')
    }
}); 

/*---------------- INITIAL LOAD ----------------*/
window.addEventListener('DOMContentLoaded', () => {
    switchContent('home-dashboard'); // Show default section
});
