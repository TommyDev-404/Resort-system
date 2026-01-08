import { successToast, failedToast } from "./helper.js";


// ----------------- HELPERS ----------------- //
function openUpdateAreaModal(e) {
      const row = e.target.closest('li.room-card'); // find the clicked li
      const area_name = row.dataset.area;       // get the data-area-name value
      const rate = row.dataset.rate;               // get the data-rate value
      const isDiscounted = row.dataset.discount === 'null' ? false : true;               // get the data-rate value
      
      const modal2 = `
            <div id="update-area-modal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                  <div class="bg-card-bg dark:bg-gray-900 w-full max-w-[500px] rounded-lg shadow-2xl px-6 py-6 relative fade-in-up">
                        <span id="close-area-update-modal" class="absolute top-3 right-4 text-gray-500 dark:text-gray-200 text-[25px] cursor-pointer">&times;</span>
                        <div class="flex flex-col gap-1 items-center justify-center relative mt-2">
                              <i data-lucide="circle-x" class="w-15 h-15 text-red-500"></i>
                              <p class="text-md font-md text-gray-900 dark:text-gray-100 mb-5 text-center flex items-center justify-center gap-2 mt-4">Cannot update. This area is currently under a promotion.</p>
                        </div>
                  </div>
            </div>
      `;

      const modal = `
            <div id="update-area-modal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                  <div class="bg-card-bg dark:bg-gray-900 w-full max-w-[500px] rounded-lg shadow-2xl px-6 py-2 relative fade-in-up">
                        <span id="close-area-update-modal" class="absolute top-3 right-4 text-gray-500 dark:text-gray-200 text-[25px] cursor-pointer">&times;</span>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 text-center flex items-center justify-center gap-2 mt-4">Update Price</h3>
                        <form id="updateAreaForm">
                              <div class="w-full mb-6 flex flex-col gap-2">
                                    <input type="hidden" name="area-name-update" value="${area_name.trim()}">
                                    <input type="number" name="update-price" placeholder="Price (₱)" required class="w-full p-2 border rounded text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800" value="${parseInt(rate.split('.')[0].replace(/[^0-9]/g, ""))}">
                                    <button type="submit" class="px-5 py-2 mt-8 bg-primary-blue dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"><i class="fas fa-paper-plane mr-1"></i> Update</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;
      
      document.getElementById('ratesAvailabilityPortal').innerHTML += isDiscounted ? modal2 : modal;
      lucide.createIcons();
}

function loadingAnimation0(){
      const load = `
            <div id="loading" class="fixed top-[70%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-50 ">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black dark:text-white">Fetching data...</p>
            </div>
      `;      

      document.getElementById('loadingRatesPortal').innerHTML += load;
}

function loadingAnimationAdd(message){
      const load = `
            <div id="loading" class="absolute w-full top-0 left-0 flex flex-col items-center  bg-black/50 justify-center h-screen space-y-2 z-50 ">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-gray-200">${message}...</p>
            </div>
      `;      

      document.getElementById('loadingDataPortal').innerHTML += load;
}

function showLoader(type, message=null) {
      if (type === 'table'){
            loadingAnimation0(); // adds #loading inside loadingPortal
      }else{
            loadingAnimationAdd(message)
      }
}

function hideLoader() {
      const loader = document.querySelector('#loading');
      if (loader) loader.remove();
}

async function renderTable() {
      document.querySelectorAll('#table2-body tr').forEach(row => row.remove());
      showLoader('table');
      // Fetch data from backend
      let rows = [];
      try {
            const response = await fetch('/availables');
            const res = await response.json();
            
            hideLoader();
            res.data.forEach(data => {
                  rows.push(data);
            });
            
            document.getElementById('occupied').textContent = res.data[0].total_occupied;
            document.getElementById('all-areas').textContent = 45;
            document.getElementById('reserved').textContent = res.data[0].total_reserved;
            document.getElementById('today-avl').textContent = res.data[0].total_today_avail;
      
      } catch (err) {
            console.error("Failed to fetch data:", err);
      }
      
      // Render body
      const bodyHtml = rows.map(row => {
            const { name, capacity } = areaTypeInfo(row.room_type);
            return `
                  <li data-area="${name}" data-rate="${row.area_condition ? row.rate : row.orig_rate}" data-discount="${row.area_condition}"  class="room-card bg-gray-50 dark:bg-white/5 shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-transform duration-200 list-none">
                  <!-- Header: Room Name + Promo -->
                  <div class="flex justify-between items-start mb-3">
                  <div class="flex flex-col gap-1">
                        ${row.area_condition ? `<span class="text-[12px] font-medium text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-800 px-2 py-0.5 rounded-full">${row.promo_name}</span>` : ''}
                        <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-100" >${name}</h4>
                  </div>
                  <span class="text-sm font-medium text-primary-blue dark:text-blue-400">Capacity: ${capacity}</span>
                  </div>
            
                  <!-- Rate Info -->
                  <div  class="mb-3">
                  ${row.area_condition 
                        ? `<div class="flex flex-col items-start gap-1">
                              <span class="line-through text-red-500 font-light text-sm">₱${row.orig_rate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span class="text-green-600 dark:text-green-500 font-semibold text-lg">₱${row.rate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span class="text-xs text-gray-500 dark:text-gray-400">Promo Applied</span>
                        </div>` 
                        : `<span class="text-gray-800 dark:text-gray-200 font-semibold text-lg">₱${row.rate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`
                  }
                  </div>
            
                  <!-- Room Stats -->
                  <div class="grid grid-cols-4 gap-3 mb-3 text-center">
                  <div>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">Total Rooms</span>
                        <span class="block font-bold text-lg text-gray-800 dark:text-gray-200">${row.total_rooms}</span>
                  </div>
                  <div>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">Available Today</span>
                        <span class="block font-bold text-lg text-red-500">${row.today_avail}</span>
                  </div>
                  <div>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">Occupied</span>
                        <span class="block font-bold text-lg text-red-500">${row.occupied}</span>
                  </div>
                  <div>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">Reserved</span>
                        <span class="block font-bold text-lg text-green-500">${row.reserve}</span>
                  </div>
                  </div>
            
                  <!-- Action Button -->
                  <button class="update-btn mt-2 w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors">
                  <i data-lucide="edit" class="text-lg"></i>
                  Update Price
                  </button>
            </li>
            `;
      }).join('');

      document.getElementById('table2-body').innerHTML = bodyHtml;
      lucide.createIcons();
}

function areaTypeInfo(area){
      const room_name = {
            'premium': 'Premium Villa Room',
            'standard': 'Standard Villa Room',
            'barkada': 'Barkada Room',
            'garden': 'Garden View Room',
            'cabana': 'Cabana Cottage',
            'small': 'Small Cottage',
            'big': 'Big Cottage',
            'pavillion': 'Pavillion Hall',
            'mariposa': 'Mariposa Hall',
            'minicon': 'Minicon Hall'
      };

      const capacity = {
            'premium': '12',
            'standard': '10',
            'barkada': '8',
            'garden': '4',
            'cabana': '30',
            'small': '20',
            'big': '50',
            'pavillion' : "150-200",
            'mariposa' : "120",
            'minicon' : "70",
      };

      return {'name': room_name[area], 'capacity': capacity[area]}
}

async function updatePrice(e){
      e.preventDefault();
      const form = new FormData(e.target);
      const price = form.get('update-price');
      const name = form.get('area-name-update').split(' ')[0];
      showLoader('data', 'Updating price...');
      const response = await fetch(`/update-price?price=${price}&name=${name}`, { method: 'POST', headers: {'Content-Type': 'application/json'}});
      const result = await response.json();

      if (result.success){
            hideLoader();
            successToast(result.message);
            e.target.reset();
            document.getElementById('update-area-modal').remove();
            renderTable();
      }else {
            hideLoader();
            failedToast('Failed! Something went wrong.');
      }
}

// --------------  EVENT LISTENERS --------------- //
document.addEventListener('click', (e) => {
      const btn = e.target.closest('.update-btn'); // ensures we get the button even if child is clicked
      
      if (btn) openUpdateAreaModal(e); // pass the ID to the modal

      // Close modal
      if (e.target.matches('#close-area-update-modal')) {
            document.getElementById('update-area-modal').remove();
      }
      
});

document.addEventListener('submit', (e) =>{
      if (e.target.matches('#updateAreaForm')) updatePrice(e);
});      

// Load default category
export async function initPageRatesAndAvailability(){
      renderTable();
}
