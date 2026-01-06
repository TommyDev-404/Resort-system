import { successToast, failedToast } from "./helper.js";


// ----------------- HELPERS ----------------- //
function openUpdateAreaModal(e) {
      const row = e.target.closest('tr'); // get the row
      const cells = row.querySelectorAll('td'); // get all td in that row

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
                                    <input type="hidden" name="area-name-update" value="${cells[0].textContent.trim()}">
                                    <input type="number" name="update-price" placeholder="Price (₱)" required class="w-full p-2 border rounded text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800" value="${parseInt(cells[2].textContent.split('.')[0].replace(/[^0-9]/g, ""))}">
                                    <button type="submit" class="px-5 py-2 mt-8 bg-primary-blue dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"><i class="fas fa-paper-plane mr-1"></i> Update</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('ratesAvailabilityPortal').innerHTML += cells[0].textContent.split('-').length > 1 ? modal2 : modal;
      lucide.createIcons();
}

function loadingAnimation0(){
      const load = `
            <div id="loading" class="fixed top-[55%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-50 ">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black">Fetching data...</p>
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
                  <tr class="fade-in-up text-gray-900 bg-gray-50 dark:bg-white/3 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                        <td class="px-6 py-4 text-center font-semibold flex flex-col justify-center items-center gap-1 min-w-[450px] whitespace-nowrap">
                              ${row.area_condition ? `<span class="text-[12px] font-medium text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-800 px-2 py-0.5 rounded-full">${row.promo_name}</span>` : ''}
                              ${name}
                        </td>
                        <td class="px-6 py-4 text-center font-bold text-lg text-primary-blue min-w-[80px] whitespace-nowrap">${capacity}</td>
                        <td class="px-6 py-4 text-center flex flex-col items-center justify-center gap-1 min-w-[250px] whitespace-nowrap">
                              ${row.area_condition 
                                    ? `<div class="flex flex-col items-center gap-1">
                                          <span class="line-through text-red-500 font-light text-sm">₱${row.orig_rate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          <span class="text-green-600 dark:text-green-500 font-semibold text-lg">₱${row.rate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                          <span class="text-xs text-gray-500 dark:text-gray-400">Promo Applied</span>
                                    </div>` 
                                    : `<span class="text-gray-800 dark:text-gray-200">₱${row.rate.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`
                              }
                        </td>
                        <td class="px-6 py-4 text-center min-w-[80px] whitespace-nowrap">${row.total_rooms}</td>
                        <td class="px-6 py-4 text-center min-w-[80px] whitespace-nowrap"><span class="font-bold text-lg text-red-500">${row.today_avail}</span></td>
                        <td class="px-6 py-4 text-center min-w-[80px] whitespace-nowrap"><span class="font-bold text-lg text-red-500">${row.occupied}</span></td>
                        <td class="px-6 py-4 text-center min-w-[80px] whitespace-nowrap"><span class="font-bold text-lg text-green-500">${row.reserve}</span></td>
                        <td class="px-6 py-4 min-w-[100px] whitespace-nowrap">
                              <button class="update-btn text-sm text-white bg-blue-500 py-2 px-4 rounded-sm flex gap-2 items-center justify-center hover:bg-blue-600 transition-colors" id="${row.room_type}"><i data-lucide="edit" class="text-lg"></i>Update Price</button>
                        </td>
            </tr>
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
