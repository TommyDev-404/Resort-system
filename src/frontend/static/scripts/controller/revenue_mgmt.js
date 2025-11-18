import { notifications } from "./home-dashboard.js";

// ---------------------- HELPERS ---------------------
function successMessageCard(message, redirect=null){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="success-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                        <i class="ti ti-circle-check text-6xl font-light text-green-500"></i>
                        <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-message">Okay</button>
                  </div>
            </div>
      `;
      document.getElementById('messagePortal').innerHTML += msg;
}

function failedMessageCard(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="failed-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                        <i class="ti ti-circle-x text-6xl font-light text-red-500"></i>
                        <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-failed-message">Okay</button>
                  </div>
            </div>
      `;

      document.getElementById('messagePortal').innerHTML += msg;
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
      const formatted_area_name = area.split(',').map(a => all_area[a]);

      const row = `
            <tr class="hover:bg-black/3 text-gray-700 dark:text-gray-100 dark:hover:bg-white/3 border-b border-gray-300 dark:border-gray-700 transition fade-in-up text-[17px]" data-id=${id}>
                  <td class="py-3 px-1 ">${date}</td>
                  <td class="py-3 px-1  ">${end}</td>
                  <td class="py-3 px-1 font-medium  w-[250px]">
                        <div class="w-full overflow-x-auto scroll-hide whitespace-nowrap">
                              ${promo_name}
                        </div>
                  </td>
                  <td class="py-3 px-1 ">${discount}</td>
                  <td class="py-3 px-1">
                        <div class="w-full overflow-x-auto scroll-hide whitespace-nowrap">
                              ${formatted_area_name.join(', ')}
                        </div>
                  </td>
                  <td class="text-white rounded-lg text-sm font-bold py-3 px-1  w-[100px]"><span class="${status === 'Active' ? 'bg-green-500' : 'bg-orange-500 '} py-2 px-4 rounded-lg">${status}</span></td>
                  <td class="flex gap-2 items-center justify-center py-3 px-1 ">
                        <button id="update-promo" class="bg-teal-500 hover:bg-teal-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 cursor-pointer"><i class="ti ti-edit text-white text-lg"></i></button>
                        <button id="remove-promo" class="bg-red-500 hover:bg-red-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 cursor-pointer"><i class="ti ti-trash text-white text-lg"></i></button>
                  </td>
            </tr>
      `;

      document.getElementById('promo-tbody').innerHTML += row;
}

function renderUpdatePromo(id, promo_name, discount, start_date, end_date, area_affected){
      const isChecked = (value) => {
            return area_affected
            .split(',')
            .map(area => area.trim().split(' ')[0]) // get first word of each item
            .includes(value) ? 'checked' : '';
      };

      const modal = `
            <div class="absolute top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm z-50" id="updatepromo-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card-bg dark:bg-gray-900 py-2 pb-4 px-[20px] max-w-[800px] rounded-lg shadow-lg fade-in-up">
                        <span id="close-updatepromo-modal" class="text-[26px] flex justify-end text-gray-900 dark:text-gray-200 cursor-pointer">&times;</span>
                        <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 text-center">Update Promotions</h3>
                        <form id="updatePromosForm">
                              <div class="space-y-4">
                                    <input type="hidden" name="id" value="${id}">
                                    <input type="hidden" name="prev_area" value="${area_affected}">
                                    
                                    <div>
                                          <label for="promo_name" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Promotion Name</label>
                                          <input type="text" id="promo_name" name="promo_name" value="${promo_name}" class="mt-1 block w-full rounded-md border-gray-400 text-gray-900 dark:text-gray-100 shadow-sm p-2 border focus:border-primary-blue focus:ring-primary-blue">
                                    </div>
                                    <div>
                                          <label for="promo_rate" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Discount Rate (%)</label>
                                          <input type="number" id="promo_rate" name="promo_rate" value="${Number(discount)}" class="mt-1 block w-full rounded-md border-gray-400 shadow-sm text-gray-900 dark:text-gray-100 p-2 border focus:border-primary-blue focus:ring-primary-blue">
                                    </div>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-400 rounded-sm p-4">
                                          <h2 class="font-semibold text-[19px] text-gray-900 dark:text-gray-200 mb-4">Area's to apply promotion: </h2>
                                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Premium" ${isChecked('Premium')}>Premium Villa Room</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Standard" ${isChecked('Standard')}>Standard Villa Room</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Garden" ${isChecked('Garden')}>Garden View Room</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Barkada" ${isChecked('Barkada')}>Barkada Room</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Family" ${isChecked('Family')}>Family Room</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Cabana" ${isChecked('Cabana')}>Cabana Cottage</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Small" ${isChecked('Small')}>Small Cottage</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Big"  ${isChecked('Big')}>Big Cottage</label>
                                                <label class="border bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Hall"  ${isChecked('Hall')}>Hall</label>
                                          </div>
                                    </div>
                                    <div class="flex flex-col text-sm text-gray-800 dark:text-gray-400">
                                          Start Promotion Date:
                                          <input type="date" name="date" value="${start_date}" required class="border border-gray-400 text-gray-900 dark:text-gray-100 rounded-sm p-4 mb-4">
                                          End PromotionDate:
                                          <input type="date" name="end_date" value="${end_date}" required class="border border-gray-400 text-gray-900 dark:text-gray-100 rounded-sm p-4">
                                    </div>
                                    <button type="submit" class="w-full bg-primary-blue dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-2 px-4 mt-4 rounded-lg shadow-md hover:bg-blue-700 transition" id="save-promo">Update Promotion</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('promoModalPortal').innerHTML += modal;
}

function renderAddPromoModal(){
      const modal = `
            <div class="absolute top-0 left-0 w-full h-full bg-black/20 z-50" id="promo-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card-bg dark:bg-gray-900 py-2 pb-4 px-[20px] max-w-[800px] rounded-xl shadow-lg fade-in-up">
                        <span id="close-promo-modal" class="text-[26px] flex justify-end cursor-pointer dark:text-white text-gray-900">&times;</span>
                        <h3 class="text-xl font-semibold mb-4 text-center dark:text-white text-gray-900">Add Promotions</h3>
                        <form id="promosForm">
                              <div class="space-y-4">
                                    <div>
                                          <label for="promo_name" class="block text-sm font-medium dark:text-gray-400 text-gray-700">Promotion Name</label>
                                          <input type="text" id="promo_name" required name="promo_name" class="mt-1 block text-gray-900 dark:text-gray-100 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-blue focus:ring-primary-blue">
                                    </div>
                                    <div>
                                          <label for="promo_rate" class="block text-sm font-medium dark:text-gray-400 text-gray-700">Discount Rate (%)</label>
                                          <input type="number" required id="promo_rate" name="promo_rate" class="mt-1 block  text-gray-900 dark:text-gray-100 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-blue focus:ring-primary-blue">
                                    </div>
                                    <div class="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-400 rounded-sm p-4">
                                          <h2 class="font-semibold text-[19px] mb-4 dark:text-gray-200 text-gray-900">Area's to apply promotion: </h2>
                                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Premium">Premium Villa Room</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Standard">Standard Villa Room</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Garden">Garden View Room</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Barkada">Barkada Room</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Family">Family Room</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Cabana">Cabana Cottage</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Small">Small Cottage</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Big">Big Cottage</label>
                                                <label class="border bg-white dark:bg-gray-900 border-gray-400 p-2 rounded-lg flex gap-2 dark:hover:bg-white/3 hover:bg-green-200 dark:text-gray-400 text-gray-700"><input type="checkbox" name="areas_promo" value="Hall">Hall</label>
                                          </div>
                                    </div>
                                    <div class="flex flex-col text-sm dark:text-gray-400 text-gray-700">
                                          Start Promotion Date:
                                          <input type="date" name="date" required class="border border-gray-200  text-gray-900 dark:text-gray-100 rounded-sm p-4 mb-4">
                                          End PromotionDate:
                                          <input type="date" name="end_date" required class="border border-gray-200  text-gray-900 dark:text-gray-100 rounded-sm p-4">
                                    </div>
                                    <button type="submit" class="w-full bg-primary-blue text-white font-bold py-2 px-4 mt-4 rounded-lg shadow-md hover:bg-blue-700 transition" id="save-promo">Save Promotion</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('promoModalPortal').innerHTML += modal;
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
      document.querySelectorAll('input[name="areas_promo"]:checked').forEach(check => { area_list.push(check.value) });
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
            document.querySelector('#updatepromo-overlay').remove();
            getAllPromo();
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
                  const start = new Date(row.date).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
                  const end = new Date(row.end_date).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
                  let discount = row.name.split('-');

                  createRow(row.id, start, discount[0], discount[1], row.area, end, row.status)
            });
      }else{
            const empty_row = `
                  <tr id="no-promo-row" class="dark:hover:bg-white/3 dark:bg-white/5 bg-gray-50 hover:bg-black/6">
                        <td colspan="7" class="text-center text-gray-500 dark:text-white py-4">No promotions yet.</td>
                  </tr>
            `;
            
            document.getElementById('promo-tbody').innerHTML += empty_row;
      }
}

function renderDataToUpdatePromo(e){
      const tr = e.target.closest('tr');
      const id = tr.getAttribute('data-id');
      const td = tr.querySelectorAll('td');

       // Extract values from td cells
      const promo_name = td[2].textContent.trim();
      const discount = td[3].textContent.trim().replace('%', '');
      const startDate = new Date(td[0].textContent.trim());
      const endDate = new Date(td[1].textContent.trim());
      const area_affected = td[4].textContent.trim();
      
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
      console.log(area_affected);
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
      if(e.target.matches('#close-updatepromo-modal')) document.querySelector('#updatepromo-overlay').remove();
});

export function initPageRevenueMgmt(){
      getAllPromo();
}