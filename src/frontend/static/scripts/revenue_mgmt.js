import { notifications } from "./home-dashboard.js";

// ---------------------- HELPERS ---------------------
function successMessageCard5(message, redirect = null) {
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

function failedMessageCard5(message){
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

function createpromoListRow(id, promo_name, promo_start, promo_end, area){
      const row = `
            <li data-id="${id}" data-area="${area}"  class="p-4 rounded-xl bg-gray-50 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 shadow-md flex justify-between items-center fade-in-up transition-all duration-200 ease-in-out hover:scale-101">
                  <div>
                        <div class="flex items-center gap-2">
                              <span class="font-semibold text-lg text-gray-900 dark:text-gray-100">${promo_name}</span>
                        </div>
                  
                        <div class="text-sm text-gray-500 dark:text-gray-400">${promo_start} - ${promo_end}</div>
                  </div>
                  
                  <div class="flex gap-2">
                        <button id="viewPromoInfo" class="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg">
                              <i data-lucide="eye"></i>
                        </button>
                  
                        <button id="updatePromoInfo" class="p-2 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-gray-700 rounded-lg">
                              <i data-lucide="edit">edit</i>
                        </button>
                  
                        <button id="removePromoInfo" class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 rounded-lg">
                              <i data-lucide="trash-2"></i>
                        </button>
                  </div>
            </li>
      `;

      document.getElementById('promoList').innerHTML += row; 
      lucide.createIcons();
}

function selectAllAreas(e){
      const checkboxes = document.querySelectorAll(".area-checkbox");
      checkboxes.forEach(cb => cb.checked = e.target.checked);
}

function resetToAddPromoForm() {
      const promoModal = document.querySelector('.promoModal');
      const formTitle = promoModal.querySelector('h3');
      formTitle.textContent = 'Add New Promotion';
      
      const promoForm = promoModal.querySelector('form');
      promoForm.id = 'promosForm';
      promoForm.querySelector('input[name="id"]')?.remove();
      promoForm.querySelector('input[name="prev_area"]')?.remove();
      promoForm.reset();      
}

function loadingAnimationAdd(message){
      const load = `
            <div id="loading" class="absolute  w-full top-0 left-0 flex flex-col items-center  bg-black/50 justify-center h-screen space-y-2 z-50 ">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-gray-200">${message}...</p>
            </div>
      `;      

      document.getElementById('loadingDataPortal').innerHTML += load;
}

function showLoader(message=null) {
      loadingAnimationAdd(message);
}

function hideLoader() {
      const loader = document.querySelector('#loading');
      if (loader) loader.remove();
}

async function applyPromo(e) {
      e.preventDefault();
      const form = new FormData(e.target);

      let area_list = [];
      document.querySelectorAll('input[name="areas_promo"]:checked').forEach(check => { area_list.push(check.value) });
      form.append('area_list', area_list);
      showLoader('Applying promo...');
      const response = await fetch('/promo', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const res = await response.json();

      if (res.success){
            successMessageCard5(res.message);
            e.target.reset();
            getAllPromo();
            notifications();
      }else{
            failedMessageCard5(res.message);
      }
      hideLoader();
}

async function updatePromo(e) {
      e.preventDefault();
      const form = new FormData(e.target);

      let area_list = [];
      document.querySelectorAll('input[name="areas_promo"]:checked').forEach(check => { area_list.push(check.value)});
      form.append('area_list', area_list);
      
      showLoader('Updating promo...');
      const response = await fetch('/update-promo', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const res = await response.json();

      if (res.success){
            successMessageCard5(res.message);
            e.target.reset();
            resetToAddPromoForm();
            getAllPromo();
            notifications();
      }else{
            failedMessageCard5(res.message);
      }
      hideLoader();
}

async function getAllPromo() {
      const response = await fetch('/get-all-promo');
      const res = await response.json();
      
      document.querySelectorAll('ul li').forEach(row => row.remove());      
      if (res.success){
            res.data.forEach(row => {
                  const start = new Date(row.date).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"});
                  const end = new Date(row.end_date).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"});
                  let discount = row.name.split('-');

                  createpromoListRow(row.id, discount[0], start, end, row.area);
            });
      }else{
            const empty_row = `
                  <li class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-lg flex justify-between items-center fade-in-up transition-all duration-200 ease-in-out hover:scale-101">
                        <div>
                              <div id="name" class="font-medium text-gray-900 dark:text-gray-100">No promotions.</div>
                        </div>
                  </li>
            `;
            
            document.getElementById('promoList').innerHTML += empty_row;
      }
}

async function renderViewPromoDetails(id){
      const response = await fetch(`/get-promo?id=${id}`);
      const result = await response.json();
      
      showLoader('Retrieving promo details...');
      if (result.success){
            const data = result.data;
            const start = new Date(data.date).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"});
            const end = new Date(data.end_date).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"});
            const areaNames = {
                  "Barkada": "Barkada Room",
                  "Family": "Family Room",
                  "Garden": "Garden View Room",
                  "Premium": "Premium Villa Room",
                  "Standard": "Standard Villa Room",
                  "Cabana": "Cabana Cottage",
                  "Small": "Small Cottage",
                  "Big": "Big Cottage",
                  "Pavillion": "Pavillion Hall",
                  "Mariposa": "Mariposa Hall",
                  "Minicon": "Minicon Hall"
            };

            const modal = `
                  <div id="promo-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div class="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden ">

                              <!-- Header -->
                              <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">${data.name.split('-')[0].trim()} Details</h2>
                                    <span id="close-promo" class="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 text-2xl font-bold transition cursor-pointer">&times;</span>
                              </div>

                              <!-- Body -->
                              <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div class="space-y-2 md:col-span-1">
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal text-sm">Promo Name</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${data.name.split('-')[0].trim()}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Discount (%)</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${data.discount}</div>
                                          </div>
                                    </div>

                                    <!-- Schedule Info -->
                                    <div class="space-y-2 md:col-span-1">
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Started</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${start}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">End</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${end}</div>
                                          </div>
                                    </div>
                                    
                                    <div class="md:col-span-2 space-y-2">
                                          <h3 class="text-sm font-normal text-gray-700 dark:text-gray-300">Status</h3>
                                          <div class="max-h-28 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${data.status}</div>
                                    </div>

                                    <!-- Accommodations -->
                                    <div class="md:col-span-2 space-y-2">
                                          <h3 class="text-sm font-normal text-gray-700 dark:text-gray-300">Area Applied</h3>
                                          <div class="max-h-28 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${data.area.split(',').map(acc => areaNames[acc.trim()]).join(', ')}</div>
                                    </div>
                              </div>
                        </div>
                  </div>
            `;

            document.getElementById('promoModalPortal').innerHTML += modal; 
      }else{
            alert(result.message);
      }
      hideLoader();
}

async function renderDataToUpdatePromo(e){
      const ul = e.target.closest('li');
      const id = ul.getAttribute('data-id');
      
      const response = await fetch(`/get-promo?id=${id}`);
      const res = await response.json();

      const data = res.data;
       // Extract values from td cells
      const promo_name = data.name.split('-')[0].trim();
      const discount = data.discount;
      const start = formatDate(new Date(data.date));
      const end = formatDate(new Date(data.end_date));
      const area_affected = data.area;

      const isChecked = (value) => {
            const areas = area_affected
                  .split(',')
                  .map(a => a.trim().split(' ')[0]);
            
                  if (value === 'Hall') {
                  return ['Pavillion', 'Mariposa', 'Minicon']
                        .every(a => areas.includes(a));
                  }
            
                  return areas.includes(value);
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
            "Pavillion": "Pavillion Hall",
            "Mariposa": "Mariposa Hall",
            "Minicon": "Minicon Hall"
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

      const promoModal = document.querySelector('.promoModal');
      const formTitle = promoModal.querySelector('h3');
      formTitle.textContent = 'Update Promotion';

      const promoForm = promoModal.querySelector('form');
      promoForm.id = 'updatePromosForm';

      const hiddenInputs = `
            <input type="hidden" name="id" value="${id}">
            <input type="hidden" name="prev_area" value="${area_affected}">
      `;

      promoForm.innerHTML += hiddenInputs;

      const promoName = document.querySelector('input[name="promo_name"]');
      const promoDiscount = document.querySelector('input[name="promo_rate"]');
      const promoStart = document.querySelector('input[name="date"]');
      const promoEnd = document.querySelector('input[name="end_date"]');
      const selectAllAreaCheckbox = document.querySelector('#selectAllCheckbox');
      const areas = document.querySelectorAll('input[name="areas_promo"]');
      
      promoName.value = promo_name;
      promoDiscount.value = discount;
      promoStart.value = start;
      promoEnd.value = end;
      selectAllAreaCheckbox.checked = isSelectedAll ? true : false;
      areas.forEach(area => {
            area.checked = isChecked(area.value);
      });
}

// Format back to YYYY-MM-DD
function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
}

async function removePromo(e){
      const tr = e.target.closest('li');
      const id = tr.getAttribute('data-id');
      const area = tr.getAttribute('data-area');

      let area_affected = null;
      if (area === 'All Areas'){
            area_affected = 'Premium Villa Room, Standard Villa Room, Family Room, Barkada Room, Garden View Room, Cabana Cottage, Small Cottage, Big Cottage, Hall';
      }else{
            area_affected = area;
      }
      
      showLoader('Removing promo');
      const response = await fetch(`/remove-promo?id=${id}&area_promos=${area_affected}`, {
            method: 'DELETE'
      });
      const result = await response.json();

      if (result.success){
            successMessageCard5(result.message);
            getAllPromo();
            notifications();
      }else{
            failedMessageCard5(result.message);
      }      
      hideLoader();
}

// submit
document.addEventListener('submit', (e) => {
      if(e.target.matches('#promosForm')) applyPromo(e);
      if(e.target.matches('#updatePromosForm')) updatePromo(e);
});

// click
document.addEventListener('click', (e) => {     
      if(e.target.closest('#viewPromoInfo')) renderViewPromoDetails(e.target.closest('li').getAttribute('data-id'));
      if(e.target.closest('#removePromoInfo')) removePromo(e);
      if(e.target.closest('#updatePromoInfo')) renderDataToUpdatePromo(e);
      if(e.target.closest('#close-promo')) document.querySelector('#promo-overlay').remove();
});

document.addEventListener("change", (e) => {
      if (e.target.closest('#selectAllCheckbox')) selectAllAreas(e);
});

document.addEventListener('input', (e) => {
      if (e.target.matches('input[name="promo_name"]')){
            e.target.value = e.target.value.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
      }
});

export async function initPageRevenueMgmt(){
      resetToAddPromoForm();
      getAllPromo();
      notifications();
}