import { notifications } from "./home-dashboard.js";

// ---------------------- HELPERS ---------------------
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
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600 px-6 py-2" id="close-failed-message">Okay</button>
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

function createRow(id, date, promo_name, discount, area, end, status){
      const all_area = {
            'Premium': 'Premium Villa Room',
            'Standard': 'Standard Villa Room',
            'Family': 'Family Room',
            'Barkada': 'Barkada Room',
            'Garden': 'Garden View Room',
            'Cabana': 'Cabana Cottage',
            'Small': 'Small Cottage',
            'Big': 'Big Cottage',
            'Hall': 'Hall'
      }

      const areas_under_promo = area.split(',').map(a => a.trim()); // promo areas as array
      const all_area_keys = Object.keys(all_area); // ['Premium', 'Standard', ...]

      // Check if all areas are under promo
      let formatted_area_name;
      if (all_area_keys.every(key => areas_under_promo.includes(key))) {
          formatted_area_name = ['All Areas']; // just display "All Areas"
      } else {
            formatted_area_name = areas_under_promo.map(a => all_area[a] || a);
      }

      const row = `
            <tr class="text-center bg-gray-50 dark:bg-white/2 hover:bg-black/5 text-gray-700 dark:text-gray-100 dark:hover:bg-white/5 border-b border-gray-300 dark:border-gray-700 transition fade-in-up text-sm" data-id=${id}>
                  <td class="py-3 px-2">${date}</td>
                  <td class="py-3 px-2">${end}</td>
                  <td class="py-3 px-2 font-medium ">${promo_name}</td>
                  <td class="py-3 px-2 text-center">${discount}</td>
                  <td class="py-3 px-2">${formatted_area_name.join(', ')}</td>
                  <td class="py-3 px-2 text-center"><span class="inline-block text-white font-semibold text-sm px-3 py-1 rounded-full ${status === 'Active' ? 'bg-green-500' : status == 'Upcoming' ? 'bg-blue-500' : 'bg-orange-500'} shadow-md">${status}</span></td>
                  <td class="flex gap-2 items-center justify-center py-3 px-2">
                        <button id="update-promo" class="bg-teal-500 hover:bg-teal-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 items-center justify-center cursor-pointer">
                              <i data-lucide="eye" class="text-white text-lg"></i>
                        </button>
                        <button id="remove-promo" class="bg-red-500 hover:bg-red-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 items-center justify-center cursor-pointer">
                              <i data-lucide="trash" class="text-white text-lg"></i>
                        </button>
                  </td>
            </tr>
      `;

      document.getElementById('promo-tbody').innerHTML += row;
      lucide.createIcons();
}

function renderUpdatePromo(id, promo_name, discount, start_date, end_date, area_affected){
      const isChecked = (value) => {
            return area_affected.split(',').map(area => area.trim().split(' ')[0]).includes(value) ? 'checked' : '';
      };

      const all_area = {
            'Premium': 'Premium Villa Room',
            'Standard': 'Standard Villa Room',
            'Family': 'Family Room',
            'Barkada': 'Barkada Room',
            'Garden': 'Garden View Room',
            'Cabana': 'Cabana Cottage',
            'Small': 'Small Cottage',
            'Big': 'Big Cottage',
            'Hall': 'Hall'
      }

      const areas_under_promo = area_affected.split(',').map(a => a.trim()); // promo areas as array
      const all_area_keys = Object.keys(all_area); // ['Premium', 'Standard', ...]

      // Check if all areas are under promo
      let isSelectedAll = false;
      if (all_area_keys.every(key => areas_under_promo.includes(key))) {
            isSelectedAll = true; // just display "All Areas"
      } else {
            isSelectedAll = false;
      }

      const modal = `
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="update-promo-overlay">
                  <div class="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl p-6 animate-fade-in-up relative border border-white/20">
                  
                        <!-- Close Button -->
                        <span id="close-update-promo-modal" class="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition text-2xl cursor-pointer">&times;</span>
                  
                        <!-- Header -->
                        <div class="flex items-center justify-center gap-2 mb-6">
                              <i data-lucide="percent" class="w-6 h-6 text-primary-blue"></i>
                              <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">Update Promotion</h3>
                        </div>
                  
                        <form id="updatePromosForm" class="space-y-6">
                              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <input type="hidden" name="id" value="${id}">
                                    <input type="hidden" name="prev_area" value="${area_affected}">
                                    
                                    <!-- Promotion Name -->
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Promotion Name</label>
                                          <input type="text" id="promo_name" name="promo_name" value="${promo_name}" required  class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                  
                                    <!-- Discount Rate -->
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Rate (%)</label>
                                          <input type="number" id="promo_rate" name="promo_rate" value="${Number(discount)}" required  class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                  
                                    <!-- Start Date -->
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                          <input type="date" name="date" required  value="${start_date}"   class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                  
                                    <!-- End Date -->
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                          <input type="date" name="end_date" required value="${end_date}"   class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                              </div>

                              <div class="bg-gray-100 dark:bg-gray-800 p-5 rounded-xl border border-gray-300 dark:border-gray-700">
                                    <!-- Select All Row -->
                                    <div class="flex justify-between items-center mb-4">
                                          <h2 class="font-semibold text-lg text-gray-900 dark:text-white">Areas to Apply Promotion</h2>
                                          <label class="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" id="selectAllCheckbox" ${isSelectedAll ? 'checked' : ''} class="w-4 h-4">Select All</label>
                                    </div>

                                    <!-- Checkbox Grid -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          <!-- Each checkbox item -->
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Premium" ${isChecked('Premium')} class="area-checkbox w-4 h-4">Premium Villa Room</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Standard" ${isChecked('Standard')} class="area-checkbox w-4 h-4">Standard Villa Room</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Garden" ${isChecked('Garden')} class="area-checkbox w-4 h-4">Garden View Room</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Barkada" ${isChecked('Barkada')} class="area-checkbox w-4 h-4">Barkada Room</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Family" ${isChecked('Family')}  class="area-checkbox w-4 h-4">Family Room</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Cabana" ${isChecked('Cabana')}  class="area-checkbox w-4 h-4">Cabana Cottage</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Small" ${isChecked('Small')} class="area-checkbox w-4 h-4">Small Cottage</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Big" ${isChecked('Big')} class="area-checkbox w-4 h-4">Big Cottage</label>
                                          <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"><input type="checkbox" name="areas_promo" value="Hall"${isChecked('Hall')}  class="area-checkbox w-4 h-4">Hall</label>
                                    </div>
                              </div>

                              <!-- Submit Button -->
                              <button type="submit" class="w-full bg-primary-blue hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition text-lg">Update Promotion</button>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('promoModalPortal').innerHTML += modal;
}

function renderAddPromoModal(){
      const modal = `
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="promo-overlay">
                  <div class="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl p-6 animate-fade-in-up relative border border-white/20">
                  
                        <!-- Close Button -->
                        <span id="close-promo-modal" class="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition text-2xl cursor-pointer">&times;</span>
                  
                        <!-- Header -->
                        <div class="flex items-center justify-center gap-2 mb-6">
                              <i data-lucide="percent" class="w-6 h-6 text-primary-blue"></i>
                              <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">Add Promotion</h3>
                        </div>
                  
                        <form id="promosForm" class="space-y-6">
                  
                              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                                    <!-- Promotion Name -->
                                    <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Promotion Name</label>
                                    <input type="text" id="promo_name" name="promo_name" required
                                          class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                  
                                    <!-- Discount Rate -->
                                    <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount Rate (%)</label>
                                    <input type="number" id="promo_rate" name="promo_rate" required
                                          class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                  
                                    <!-- Start Date -->
                                    <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                    <input type="date" name="date" required
                                          class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                  
                                    <!-- End Date -->
                                    <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                    <input type="date" name="end_date" required
                                          class="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 focus:ring-primary-blue focus:border-primary-blue transition">
                                    </div>
                              </div>

                              <div class="bg-gray-100 dark:bg-gray-800 p-5 rounded-xl border border-gray-300 dark:border-gray-700">
                                    <!-- Select All Row -->
                                    <div class="flex justify-between items-center mb-4">
                                    <h2 class="font-semibold text-lg text-gray-900 dark:text-white">Areas to Apply Promotion</h2>
                  
                                    <!-- Select All Checkbox -->
                                    <label class="flex items-center gap-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300"><input type="checkbox" id="selectAllCheckbox" class="w-4 h-4">Select All</label>
                              </div>
                  
                                    <!-- Checkbox Grid -->
                              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <!-- Each checkbox item -->
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Premium" class="area-checkbox w-4 h-4">
                                          Premium Villa Room
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Standard" class="area-checkbox w-4 h-4">
                                          Standard Villa Room
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Garden" class="area-checkbox w-4 h-4">
                                          Garden View Room
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Barkada" class="area-checkbox w-4 h-4">
                                          Barkada Room
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Family" class="area-checkbox w-4 h-4">
                                          Family Room
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Cabana" class="area-checkbox w-4 h-4">
                                          Cabana Cottage
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Small" class="area-checkbox w-4 h-4">
                                          Small Cottage
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Big" class="area-checkbox w-4 h-4">
                                          Big Cottage
                                    </label>
                  
                                    <label class="flex items-center gap-2 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-green-200 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white">
                                          <input type="checkbox" name="areas_promo" value="Hall" class="area-checkbox w-4 h-4">
                                          Hall
                                    </label>
                                    </div>
                              </div>
                  
                              <!-- Submit Button -->
                              <button type="submit" class="w-full bg-primary-blue hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow-md transition text-lg">Save Promotion</button>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('promoModalPortal').innerHTML += modal;
}

function selectAllAreas(e){
      const checkboxes = document.querySelectorAll(".area-checkbox");
      checkboxes.forEach(cb => cb.checked = e.target.checked);
}

async function applyPromo(e) {
      e.preventDefault();
      const form = new FormData(e.target);

      let area_list = [];
      document.querySelectorAll('input[name="areas_promo"]:checked').forEach(check => { area_list.push(check.value) });
      form.append('area_list', area_list);
      
      const response = await fetch('/promo', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const res = await response.json();

      if (res.success){
            successMessageCard(res.message);
            e.target.reset();
            document.querySelector('#promo-overlay').remove();
            getAllPromo();
            notifications();
      }else{
            failedMessageCard(res.message);
      }
}

async function updatePromo(e) {
      e.preventDefault();
      const form = new FormData(e.target);

      let area_list = [];
      document.querySelectorAll('input[name="areas_promo"]:checked').forEach(check => { area_list.push(check.value)});
      form.append('area_list', area_list);

      const response = await fetch('/update-promo', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const res = await response.json();

      if (res.success){
            successMessageCard(res.message);
            e.target.reset();
            document.querySelector('#update-promo-overlay').remove();
            getAllPromo();
            notifications();
      }else{
            failedMessageCard(res.message);
      }
}

async function getAllPromo() {
      const response = await fetch('/get-all-promo');
      const res = await response.json();
      
      document.querySelectorAll('#promo-tbody tr').forEach(row => row.remove());
      if (res.success){
            res.data.forEach(row => {
                  const start = new Date(row.date).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"});
                  const end = new Date(row.end_date).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"});
                  let discount = row.name.split('-');

                  createRow(row.id, start, discount[0], discount[1], row.area, end, row.status)
            });
      }else{
            const empty_row = `
                  <tr id="no-promo-row" class="dark:hover:bg-white/3 dark:bg-white/5 bg-gray-50 hover:bg-black/6 text-sm">
                        <td colspan="7" class="text-center text-gray-800 dark:text-white py-4">No promotions yet.</td>
                  </tr>
            `;
            
            document.getElementById('promo-tbody').innerHTML += empty_row;
      }
}

async function renderDataToUpdatePromo(e){
      const tr = e.target.closest('tr');
      const id = tr.getAttribute('data-id');
      const td = tr.querySelectorAll('td');
      
      const response = await fetch(`/get-promo-area-data?id=${id}`);
      const res = await response.json();

       // Extract values from td cells
      const promo_name = td[2].textContent.trim();
      const discount = td[3].textContent.trim().replace('%', '');
      const startDate = new Date(td[0].textContent.trim());
      const endDate = new Date(td[1].textContent.trim());
      const area_affected = res.data;
      
      const new_start = formatDate(startDate);
      const new_end = formatDate(endDate);
      
      renderUpdatePromo(id, promo_name, discount, new_start, new_end, area_affected);
}

// Format back to YYYY-MM-DD
function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
}

async function removePromo(e){
      const tr = e.target.closest('tr');
      const id = tr.getAttribute('data-id');
      const td = tr.querySelectorAll('td');
      
      const area_affected = td[4].textContent.trim();
      
      const response = await fetch(`/remove-promo?id=${id}&area_promos=${area_affected}`, {
            method: 'DELETE'
      });
      const result = await response.json();

      if (result.success){
            successMessageCard(result.message);
            getAllPromo();
            notifications();
      }else{
            failedMessageCard(result.message);
      }      
}

getAllPromo();

// submit
document.addEventListener('submit', (e) => {
      if(e.target.matches('#promosForm')) applyPromo(e);
      if(e.target.matches('#updatePromosForm')) updatePromo(e);
});

// click
document.addEventListener('click', (e) => {     
      if(e.target.closest('#update-promo')) renderDataToUpdatePromo(e);
      if(e.target.closest('#remove-promo')) removePromo(e);
      if(e.target.matches('#add-promo')) renderAddPromoModal();
      if(e.target.matches('#close-promo-modal')) document.querySelector('#promo-overlay').remove();
      if(e.target.matches('#close-update-promo-modal')) document.querySelector('#update-promo-overlay').remove();
});

document.addEventListener("change", (e) => {
      if (e.target.closest('#selectAllCheckbox')) selectAllAreas(e);
});

export function initPageRevenueMgmt(){
      getAllPromo();
}