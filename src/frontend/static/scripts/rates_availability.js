
// ----------------- HELPERS ----------------- //
function successMessageCard(message, redirect = null) {
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-50" id="success-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4 fade-in-up">
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
            const box = document.querySelector("#success-message");
            box.remove();

            if (redirect)  window.location.href = redirect;
      });
}

function failedMessageCard(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-50" id="failed-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4 fade-in-up ">
                        <i data-lucide="circle-x" class="w-15 h-15 text-center font-bold text-red-500"></i>
                        <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600 w-70" id="close-failed-message">Okay</button>
                  </div>
            </div>
      `;

      document.getElementById('messagePortal').innerHTML += msg;
      lucide.createIcons();
      document.getElementById("close-failed-message").addEventListener("click", () =>  {
            const box = document.querySelector("#failed-message");
            box.remove();
      });
}

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
                                    <input type="number" name="update-price" placeholder="Price (₱)" required class="w-full p-2 border rounded text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800" value="${parseInt(cells[3].textContent.split('.')[0].replace(/[^0-9]/g, ""))}">
                                    <button type="submit" class="px-5 py-2 mt-8 bg-primary-blue dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"><i class="fas fa-paper-plane mr-1"></i> Update</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('ratesAvailabilityPortal').innerHTML += cells[0].textContent.split('-').length > 1 ? modal2 : modal;
      lucide.createIcons();
}

async function renderTable() {
      // Fetch data from backend
      let rows = [];
      try {
            const response = await fetch('/availables');
            const res = await response.json();
            
            res.data.forEach(data => {
                  rows.push(data);
            });
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
                        <td class="px-6 py-4 text-center min-w-[80px] whitespace-nowrap">${row.total_rooms}</td>
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
                        <td class="px-6 py-4 text-center min-w-[80px] whitespace-nowrap"><span class="font-bold text-lg text-red-500">${row.today_avail}</span></td>
                        <td class="px-6 py-4 text-center min-w-[80px] whitespace-nowrap"><span class="font-bold text-lg text-green-500">${row.tomorrow_avail}</span></td>
                        <td class="px-6 py-4 min-w-[100px] whitespace-nowrap">
                              <button class="update-btn text-sm text-white bg-teal-500 py-2 px-4 rounded-sm flex gap-2 items-center justify-center hover:bg-teal-600 transition-colors" id="${row.room_type}"><i data-lucide="edit" class="text-lg"></i>Update</button>
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
            'family': 'Family Room',
            'garden': 'Garden View Room',
            'cabana': 'Cabana Cottage',
            'small': 'Small Cottage',
            'big': 'Big Cottage',
            'hall' : "Hall"
      };

      const capacity = {
            'premium': '12',
            'standard': '10',
            'barkada': '8',
            'family': '10',
            'garden': '4',
            'cabana': '30',
            'small': '20',
            'big': '50',
            'hall' : "100"
      };

      return {'name': room_name[area], 'capacity': capacity[area]}
}

async function updatePrice(e){
      e.preventDefault();
      const form = new FormData(e.target);
      const price = form.get('update-price');
      const name = form.get('area-name-update').split(' ')[0];

      const response = await fetch(`/update-price?price=${price}&name=${name}`, { method: 'POST', headers: {'Content-Type': 'application/json'}});
      const result = await response.json();

      if (result.success){
            successMessageCard(result.message);
            e.target.reset();
            document.getElementById('update-area-modal').remove();
            renderTable();
      }else {
            failedMessageCard(result.message);
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

renderTable();

// Load default category
export function initPageRatesAndAvailability(){
      renderTable();
}
