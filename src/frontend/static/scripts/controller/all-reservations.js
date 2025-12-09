import { notifications} from "./home-dashboard.js";

const tbody = document.getElementById('tbody');
let savedAccomodations = [];
let category_data = 'all-data';

// ---------------- RENDER HELPERS ------------------
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
            const box = document.getElementById("success-message");
            box.remove();

            if (redirect)  window.location.href = redirect;
      });
}

function failedMessageCard(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-50" id="failed-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4 fade-in-up">
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

function createTable(id, guest_name, checkin, checkout, stay_count, accomodations, booking_type, status, payment_status){
      const row = `
            <tr class="text-[16px] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up bg-gray-50 dark:bg-gray-900" id="${id}" data-set="${accomodations}">
                  <!-- SELECT -->
                  <td class="px-3 py-4 w-[70px] text-center">
                        <label class="flex items-center justify-center gap-2 cursor-pointer select-none">
                              <input type="checkbox" name="select" class="timeout-checkbox hidden peer">
                              <span class="w-6 h-6 flex items-center justify-center rounded-md border border-gray-400 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition">
                              <i data-lucide="check" class="check-icon w-4 h-4 text-transparent"></i>
                              </span>
                        </label>
                  </td>

                  <!-- TRAVELER -->
                  <td class="px-3 py-4 text-center">
                        <div class="block w-[200px] mx-auto overflow-x-auto whitespace-nowrap truncate">
                              <span class="font-medium">${guest_name}</span>
                        </div>
                  </td>

                  <!-- BOOKING DATE -->
                  <td class="px-3 py-4 text-center">
                        <div class="block w-[220px] mx-auto overflow-x-auto whitespace-nowrap thin-scroll">
                              <span class="text-gray-700 dark:text-gray-100">
                              ${checkin} - ${checkout}
                              <label class="text-gray-500 dark:text-gray-200 text-xs">
                                    ${stay_count > 0 ? `(${stay_count} Nights)` : ''}
                              </label>
                              </span>
                        </div>
                  </td>

                  <!-- ACCOMMODATIONS -->
                  <td class="px-3 py-4 text-center">
                        <div class="block w-[390px] truncate">
                              <span>${accomodations.split(',').map(accs => accs.trim()).join(', ')}</span>
                        </div>
                  </td>

                  <!-- BOOKING TYPE -->
                  <td class="px-3 py-4 text-center">
                        <div class="block w-[130px]">
                              <span class="px-3 py-1 text-xs rounded-full
                              ${booking_type === 'Day Guest' ? 'text-yellow-700 bg-yellow-100 dark:text-white dark:bg-yellow-500'
                              : booking_type === 'Reservation' ? 'text-green-700 bg-green-100 dark:text-white dark:bg-green-500'
                              : 'text-purple-700 bg-purple-100 dark:text-white dark:bg-purple-500'}">
                              ${booking_type}
                              </span>
                        </div>
                  </td>

                  <!-- STATUS -->
                  <td class="px-3 py-4 text-center">
                        <div class="block w-[140px]">
                              <span class="px-3 py-1 text-xs rounded-full
                              ${status === 'Reserved' ? 'text-green-700 bg-green-100 dark:text-white dark:bg-green-500'
                              : status === 'Cancelled' ? 'text-red-700 bg-red-100 dark:text-white dark:bg-red-500'
                              : status === 'Checked-out' ? 'text-rose-600 bg-rose-100 dark:text-white dark:bg-rose-500'
                              : 'text-blue-700 bg-blue-100 dark:text-white dark:bg-blue-500'}">
                              ${status}
                              </span>
                        </div>
                  </td>

                  <!-- PAYMENT -->
                  <td class="px-3 py-4 text-center">
                        <div class="w-[220px] mx-auto">
                              <span class=" px-3 py-1 text-xs rounded-full
                              ${payment_status === 'ZUZU (Online Payment)' ? 'text-green-700 bg-green-100 dark:text-white dark:bg-green-500'
                              : payment_status === 'Refunded' ? 'text-red-700 bg-red-100 dark:text-white dark:bg-red-500'
                              : payment_status === 'Direct Payment' ? 'text-green-700 bg-green-100 dark:text-white dark:bg-green-500'
                              : 'text-orange-700 bg-orange-100 dark:text-white dark:bg-orange-500'}">
                              ${payment_status}
                              </span>
                        </div>
                  </td>

                  <!-- ACTION -->
                  <td class="px-3 py-4 w-full flex items-center justify-center">
                        <button id="view-full-info" 
                              class="text-[14px] bg-purple-700 dark:bg-purple-500 hover:bg-purple-600 p-2 rounded-lg text-white flex items-center justify-center gap-1 cursor-pointer">
                              <i data-lucide="eye" class="w-5 h-5"></i>
                        </button>
                  </td>
            </tr>
      `;

      tbody.innerHTML += row;
      lucide.createIcons();
}

function renderAddBookingModal(){
      avl_spaces();
      const form  = `
            <div id="booking-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-3xl relative px-8 py-4 fade-in-up">
                        <span id="close-add-booking" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 dark:hover:text-gray-400 hover:text-gray-700 text-3xl font-light cursor-pointer">&times;</span>
                        <div class="text-center mb-6">
                              <h2 class="text-xl font-bold text-gray-700 dark:text-white">Add Booking</h2>
                              <p class="text-gray-500 dark:text-gray-400 text-sm">Fill out guest details and choose accommodations below.</p>
                        </div>
                        <form id="addBookingForm" class="flex flex-col gap-6">
                              <section>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <input type="text" name="name" placeholder="Guest Name" class="border border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                          <input type="number" name="total_guest" placeholder="Total Guests" min="1" class="border dark:text-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                    </div>
                              </section>
            
                              <section>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <select id="booking_type" name="booking_type" class="border border-gray-300 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                                <option class="text-black "  value="" disabled selected hidden>Select Booking Type</option>
                                                <option class="text-black " value="Reservation">Reservation (Advance Booking)</option>
                                                <option class="text-black" value="Check-in">Check-In (Room Stay)</option>
                                                <option class="text-black" value="Day Guest">Day Guest (No Room Stay)</option>
                                          </select>
                                    
                                          <select id="payment" name="payment" class="border border-gray-300 focus:border-blue-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all"required>
                                                <option class="text-black "  value="" disabled selected hidden>Select Payment Type</option>
                                                <option class="text-black "  value="Direct Payment">Direct Payment</option>
                                                <option class="text-black "  value="ZUZU (Online Payment)">ZUZU (Online Payment)</option>
                                                <option class="text-black "  value="Pending">Pending</option>
                                          </select>
                                    </div>
                              </section>
            
                              <section>
                                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 border-b border-gray-200 text-center">Select Accommodations</h3>
                                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Premium Villa">Premium Villa (<span id="count-p"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Standard Villa">Standard Villa (<span id="count-s"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Garden View">Garden View (<span id="count-g"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Family Room">Family Room (<span id="count-f"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Barkada Room">Barkada Room (<span id="count-bd"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Cabana Cottage">Cabana Cottage (<span id="count-c"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Small Cottage">Small Cottage (<span id="count-sm"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Big Cottage">Big Cottage (<span id="count-b"></span>)</label>
                                          <label class="btn-acc bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-center cursor-pointer transition-all" data-section="Hall">Halls (<span id="count-h"></span>)</label>
                                    </div>
                        
                                    <div class="mt-4 text-sm">
                                          <label class="text-gray-600 dark:text-gray-100 block mb-1 font-medium">Selected Accommodations:</label>
                                          <div id="selected-accomodations" class="grid grid-cols-4 gap-2 border border-gray-200 rounded-md p-3 bg-gray-50 dark:bg-gray-800 h-17 overflow-y-auto"></div>
                                          <input type="hidden" name="accomodations_selected">
                                    </div>
                              </section>
            
                              <section>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <div>
                                                <label class="text-gray-600 dark:text-gray-100 text-sm mb-1 block">Check-In Date</label>
                                                <input type="date" name="checkin" class="w-full border border-gray-300 text-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                          </div>
                                          <div>
                                                <label class="text-gray-600 dark:text-gray-100 text-sm mb-1 block">Check-Out Date</label>
                                                <input type="date" name="checkout" class="w-full border border-gray-300 text-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                          </div>
                                    </div>
                              </section>
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md py-3 rounded-md transition-all mt-2">Submit</button>
                        </form>
                  </div>

                  <div class="accomodation-avl-overlay absolute w-full h-full inset-0 bg-black/40  top z-50 hidden">
                        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-[500px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fade-in-up">
                              <span class="absolute right-3 top-1 text-[25px] text-gray-900 dark:text-gray-100 hover:text-gray-800 dark:hover:text-gray-400 cursor-pointer" id="close-accomodation-avl">&times;</span>
                              <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-100 text-center" id="accomodation_label">Premium Villa Rooms</h2>
                              <div class="flex flex-col gap-2 mt-4 h-[200px] overflow-y-auto thin-scroll" id="avl-accomodations"></div>
                              <div class="flex gap-6 justify-between mt-6">
                                    <label class="bg-primary-blue dark:bg-blue-600 dark:hover:bg-blue-500 hover:bg-blue-500 rounded-sm text-white py-2 px-[50px] w-full text-center" id="select-accomodation-avl">Select</label>
                              </div>
                        </div>
                  </div>
            </div>
      `;

      document.getElementById('reservationPortal').innerHTML += form; 
}

function renderEditReservedModal(id, check_in, check_out, booking_type){
      const modal = `
            <div class="fixed top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm z-50" id="update-reservation-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-[500px] px-6 py-4 fade-in-up">
                        <span class="font-semibold text-[25px] flex justify-end cursor-pointer text-gray-900 dark:text-gray-200" id="close-reservation-overlay">&times;</span>
                        <h2 class="text-gray-500 dark:text-gray-100 text-center font-bold text-[20px]">Update Reservation Date</h2>
                        <form id="update-reserved-form">
                              <div class="flex flex-col gap-6 mt-2">
                                    <input type="hidden" name="id" value="${id}">
                                    <input type="hidden" name="booking_type" value="${booking_type}">
                                    <div class="flex flex-col gap1 text-gray-600 dark:text-gray-200">
                                          Edit Check-In:
                                          <input type="date" name="edit_checkin" class="border border-gray-300 text-gray-600 dark:text-gray-100 p-4 rounded-sm" value="${check_in}">
                                    </div>
                                    <div class="flex flex-col gap1  text-gray-600 dark:text-gray-200">
                                          Edit Check-out:
                                          <input type="date" name="edit_checkout" class="border border-gray-300  text-gray-600 dark:text-gray-100 p-4 rounded-sm" value="${check_out}">
                                    </div>
                                    <button type="submit" class="bg-primary-blue hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-sm text-white py-2 px-[50px] text-center">Update</button>      
                              </div>
                        </form>
                  </div>
            </div>
      `;
      
      document.getElementById('reservationPortal').innerHTML += modal; 
}

function renderMarkPaidModal(){
      const modal = `
            <div class="fixed top-0 left-0 w-full h-full  bg-black/40 backdrop-blur-sm z-50" id="mark-paid-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-[500px] px-6 py-4 fade-in-up">
                        <span class="font-semibold text-[25px] flex justify-end cursor-pointer text-gray-900 dark:text-gray-200" id="close-mark-paid">&times;</span>
                        <h2 class="text-gray-500 dark:text-gray-100 text-center font-bold text-[20px]">Payment</h2>
                        <form id="markpaid-form">
                              <div class="flex flex-col gap-6 mt-2">
                                    <div class="flex flex-col gap-0.5">
                                          <label class="text-sm text-gray-600 dark:text-gray-200">Select Payment Type</label>
                                          <select id="mark-payment" class="border border-gray-300 p-4 rounded-sm text-gray-800 dark:text-white" required>
                                                <option class="text-gray-900" value="Direct Payment">Direct Payment</option>
                                                <option class="text-gray-900" value="ZUZU (Online Payment)">ZUZU (Online Payment)</option>
                                                <option class="text-gray-900" value="Pending">Pending</option>
                                          </select> 
                                    </div>
                                    <button type="submit" class="bg-primary-blue hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-sm text-white py-2 px-[50px] text-center">Done</button>      
                              </div>
                        </form>
                  </div>
            </div>
      `;
      
      document.getElementById('reservationPortal').innerHTML += modal; 
}

function showAccomodationAvlForm(e){
      const accOverlay = document.querySelector('.accomodation-avl-overlay');
      accOverlay.classList.remove('hidden');

      document.getElementById('accomodation_label').textContent = `${e.target.textContent} Available's`;
      generateAvlAccomodation(e.target.getAttribute('data-section'));
}

function saveAccomodationRoom(){
      const checked = document.querySelectorAll('input[type="checkbox"]:checked');

      if (checked.length > 0){
            checked.forEach(cb => {
                  if (!savedAccomodations.includes(cb.value)){
                        savedAccomodations.push(cb.value);
                        console.log(cb.value);
                        const tag = `<label class="h-10 bg-green-500 hover:bg-green-600 px-2 py-1 rounded-lg inline-flex justify-between items-center gap-2 text-white text-sm font-medium shadow-sm transition" id="${cb.value.split(' ').join('-')}"> ${cb.value} <span class="remove-btn text-lg font-bold cursor-pointer"  data-acc="${cb.value}">&times;</span></label>`;
                        document.querySelector("#selected-accomodations").innerHTML += tag;
                  }
            });
      }
      console.log(savedAccomodations);
      document.querySelector('input[name="accomodations_selected"]').value = savedAccomodations;
      closeAccomodationRoom();
}

function closeAccomodationRoom(){
      document.querySelectorAll('#card').forEach(card => card.remove());
      document.querySelector('.accomodation-avl-overlay').classList.add('hidden');
}

function resetDropDown(){
      document.getElementById('yearSelect').value = new Date().getFullYear();
      document.getElementById('monthSelect').value = new Date().getMonth() + 1;
}

function switchTabs(){
      const tabs = document.querySelectorAll(".tab-item");
      const content = document.getElementById("tab-content");

      tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                  // Reset all tabs to gray
                  tabs.forEach(t => {
                        t.classList.remove("text-blue-500", "border-blue-500", "bg-black/10", "dark:bg-white/10", "rounded-t-sm");
                        t.classList.add("text-gray-600", "border-gray-300");
                  });

                  // Activate the clicked tab
                  tab.classList.add("text-blue-500", "border-blue-500", "bg-black/10", "dark:bg-white/10", "rounded-t-sm");
                  tab.classList.remove("text-gray-600", "border-gray-300");
            });
      });
}

function resetToDefaultTabItem(){
      const tabs = document.querySelectorAll(".tab-item");
      const tab_all_data = document.getElementById("all-data");

      tabs.forEach(t => {
            t.classList.remove("text-blue-500", "border-blue-500", "bg-black/10", "dark:bg-white/10", "rounded-t-sm");
            t.classList.add("text-gray-600", "border-gray-300");
      });
      // Activate the clicked tab
      tab_all_data.classList.add("text-blue-500", "border-blue-500", "bg-black/10", "dark:bg-white/10", "rounded-t-sm");
      tab_all_data.classList.remove("text-gray-600", "border-gray-300");
}

function resetButtonAndCheckBox(){
      const checkboxes = document.querySelectorAll('input[name="select"]');
      const allBtns = document.querySelectorAll('.btn');

      allBtns.forEach(btn => {
            btn.style.opacity = '0.3';
            btn.style.pointerEvents = 'none';
      });
      
      checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                  if (cb.checked) {
                        checkboxes.forEach(other => {
                              if (other !== cb) other.checked = false;
                        });
                  }
            });
      });
}

function enableActionBtns(e){
      const checkboxes = document.querySelectorAll('input[name="select"]');
      const allBtns = document.querySelectorAll('.btn');
      const anyChecked = document.querySelectorAll('input[name="select"]:checked');
      resetButtonAndCheckBox();

      if (anyChecked.length > 0) {
            const tr = e.target.closest('tr');
            const id = tr.getAttribute('id');
            const status = tr.querySelectorAll('td')[5].textContent.trim();
            const payment = tr.querySelectorAll('td')[6].textContent.trim();
            const booking_type = tr.querySelectorAll('td')[4].textContent.trim();

            // --- Apply your conditions
            allBtns.forEach(btn => {
                  const date = tr.querySelectorAll('td')[2].textContent.split('-');
                  const year = document.getElementById('yearSelect').value;
                  const reservationDate = new Date(`${date[0]}${year}`);
                  const checkoutDate = new Date(`${date[1]}${year}`);
                  const todayDate = new Date();

                  // Paid
                  if (payment !== 'Pending') {
                        if (booking_type === 'Day Guest'){
                              if (status === 'Checked-in' && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                        }else if (booking_type === 'Reservation'){
                              // enable change date, checkin,  & cancel reservation btns
                              if (status === 'Reserved' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-paid') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }

                              if (status === 'Checked-in' && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'cancel-bookings') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                        }else{
                              // enable check-out btn only
                              if (status === 'Checked-in' && checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'cancel-bookings') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                              
                              if (status === 'Checked-in' && checkoutDate > todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                        }
                        
                  } else { // Not Paid
                        if (booking_type === 'Day Guest'){
                              if (status === 'Checked-in' && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                              
                              if (status === 'Checked-out' && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                        }else if (booking_type === 'Reservation'){
                              // enable change date, checkin,  & cancel reservation btns
                              if (status === 'Reserved' && reservationDate > todayDate && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-checkin') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }

                              if (status === 'Reserved' && reservationDate <= todayDate && btn.getAttribute('id') !== 'mark-checkout') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }

                              if (status === 'Checked-in' && checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }

                              if (status === 'Checked-in' && checkoutDate > todayDate &&  btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                              
                              if (status === 'Checked-out' && checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                        }else{
                              // past checkout
                              if (status === 'Checked-in' && checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                              // past checkout and not paid
                              if (status === 'Checked-out' && checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                              // future checkout
                              if (status === 'Checked-in' && checkoutDate > todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }
                        }
                  }
            });
      }else{
            allBtns.forEach(btn => {
                  btn.style.opacity = '0.4';
                  btn.style.pointerEvents = 'none';
            });
      }
}

function removeAccomodation(e){
      const acc = e.target.dataset.acc;
      const index = savedAccomodations.indexOf(acc);
      console.log(acc, index);
      if (index > -1) savedAccomodations.splice(index, 1);

      document.querySelector(`#${acc.split(' ').join('-')}`).remove();
      document.querySelector('input[name="accomodations_selected"]').value = savedAccomodations;
      console.log(savedAccomodations);
}

function retrieveCheckboxId(){
      const checkedBoxes = document.querySelectorAll('input[name="select"]:checked');
      let id = null;
      let accommodations = null;

      checkedBoxes.forEach(box => {
            const tr = box.closest('tr'); // get the parent row
            if(tr.getAttribute('id') !== null && tr.getAttribute('data-set') !== null){
                  id = tr.getAttribute('id');
                  accommodations = tr.getAttribute('data-set');
            }
      });

      return {'id': id, 'accomodations': accommodations};
}

function updateBadge(id, value) {
      const badge = document.getElementById(id).querySelector("span");

      if (value > 0) {
            badge.textContent = `+${value}`;
            badge.classList.remove("hidden");
      } else {
            badge.textContent = "";
            badge.classList.add("hidden");
      }
}

// --------------- POST DATA Fetching -------------- //
async function addBooking(e){
      e.preventDefault();      
      const form = new FormData(e.target);

      try{
            const response = await fetch('/add-booking', {
                  method: 'POST', 
                  headers: {'Content-Type': 'application/json'}, 
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();

            if (result.success){
                  e.target.reset();
                  successMessageCard(result.message);
                  notifications();
                  document.querySelector('#booking-overlay').remove();
                  recentBookings();
                  summaryCards();
                  savedAccomodations.length =  0; // empty the array
            }else{
                  successMessageCard(result.message);
                  recentBookings();
            }
            
            getTotalsCountData();
      }catch(err){
            console.log(err);
      }
}

async function markAsCheckout(){
      const id = retrieveCheckboxId().id;
      const accommodations = retrieveCheckboxId().accomodations;
      
      const response = await fetch(`/mark-checkout?id=${id}&accomodation=${accommodations}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            notifications();
            successMessageCard(result.message);
            recentBookings();
            summaryCards();
            resetButtonAndCheckBox();
      }else{
            failedMessageCard(result.message);
      }
      
      getTotalsCountData();
}

async function markAsCheckin(){
      const id = retrieveCheckboxId().id;
      const accommodations = retrieveCheckboxId().accomodations;

      const response = await fetch(`/mark-checkin?id=${id}&accomodation=${accommodations}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            successMessageCard(result.message);
            notifications();
            summaryCards();
            recentBookings();
            resetButtonAndCheckBox();
      }else{
            failedMessageCard(result.message);
      }
      
      getTotalsCountData();
}

async function cancelBooking(){
      const id = retrieveCheckboxId().id;
      const accommodations = retrieveCheckboxId().accomodations;
      
      const response = await fetch(`/cancel-booking?id=${id}&accomodation=${accommodations}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'} 
      });
      const result = await response.json();

      if (result.success){
            successMessageCard(result.message);
            notifications();
            recentBookings();
            summaryCards
            resetButtonAndCheckBox();
      }else{
            failedMessageCard(result.message);
      }
      
      getTotalsCountData();
}

async function submitPayment(e){
      e.preventDefault();
      const select = document.getElementById('mark-payment').value;
      const id = retrieveCheckboxId().id;

      const response = await fetch(`/mark-paid?id=${id}&payment=${select}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            successMessageCard(result.message);
            document.querySelector('#mark-paid-overlay').remove();
            recentBookings();
            resetButtonAndCheckBox();
      }else{
            failedMessageCard(result.message);
      }
      
      getTotalsCountData();
}

async function updateReservationDate(e){
      e.preventDefault();
      const form = new FormData(e.target);

      const response = await fetch(`/update-reservation-date`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const result = await response.json();

      if (result.success){
            successMessageCard(result.message);
            notifications();
            document.querySelector('#update-reservation-overlay').remove();
            recentBookings();
            resetButtonAndCheckBox();
      }else {
            failedMessageCard(result.message);
            document.querySelector('#update-reservation-overlay').remove();
      }
      
      getTotalsCountData();
}

// --------------- GET DATA Fetching -------------- //
async function renderViewReservationDetails(id){
      const response = await fetch(`/view-details/${id}`);
      const result = await response.json();

      if (result.success){
            const check_in = new Date(result.data.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
            const check_out = new Date(result.data.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});

            const modal = `
                  <div id="details-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div class="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 overflow-hidden">
                        <!-- Close button -->
                        <span id="close-details" class="absolute top-4 right-4 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 text-2xl font-bold transition cursor-pointer">&times;</span>
                  
                        <!-- Header -->
                        <h2 class="text-center text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Guest Details</h2>
                  
                        <!-- Details grid -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900 dark:text-gray-200">
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Name</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${result.data.name}</div>
                              </div>
                  
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Check-in</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${check_in}</div>
                              </div>
                  
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Check-out</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${check_out}</div>
                              </div>
                  
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Total Guest</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${result.data.total_guest}</div>
                              </div>
                  
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Booking Type</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${result.data.booking_type}</div>
                              </div>
                  
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Status</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${result.data.status}</div>
                              </div>
                  
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Payment</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${result.data.payment}</div>
                              </div>
                  
                              <div>
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Total Paid (₱)</p>
                                    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2">${result.data.total_amount}</div>
                              </div>
                  
                              <!-- Promo / Discount (only show if available) -->
                              <div class="md:col-span-2">
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Promo Name</p>
                                    <div class="max-h-25 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-200">
                                          ${result.data.promo}
                                    </div>
                              </div>

                              <div class="md:col-span-2">
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Area Affected</p>
                                    <div class="max-h-25 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-200">
                                          ${result.data.promo_area}
                                    </div>
                              </div>
                  
                              <!-- Accommodations with scrollable content -->
                              <div class="md:col-span-2">
                                    <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">Accommodations</p>
                                    <div class="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-200">
                                    ${result.data.accomodations.split(',').map(accs => accs.trim()).join(', ')}
                                    </div>
                              </div>
                        </div>
                        </div>
                  </div>
            `;
            
            document.getElementById('reservationPortal').innerHTML += modal; 
      }else{
            alert(result.message);
      }
}

async function getReservationDate(){
      const id = retrieveCheckboxId().id;

      const response = await fetch(`/get-reservation-date?id=${id}`);
      const result = await response.json();
      console.log(result);
      const formatCheckin = new Date(result.check_in).toISOString().split('T')[0];
      const formatCheckout = new Date(result.check_out).toISOString().split('T')[0];

      renderEditReservedModal(id, formatCheckin, formatCheckout, result.booking_type); 
}

async function generateAvlAccomodation(accomodation){
      let room_name = accomodation.split(' ');

      const response = await fetch(`/avl-rooms?room_name=${room_name[0]}`);
      const result = await response.json();
      const rooms = result.rooms;
      console.log(accomodation);
      for (let i = 0; i < rooms.length; i++){
            const p = `<label class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-800 dark:text-gray-100 text-center border border-gray-200 dark:hover:bg-white/10 hover:bg-green-200" id="card"><input type="checkbox" class="text-gray-100 dark:text-gray-800" name="avl" value="${accomodation} ${rooms[i]}" required> ${accomodation} ${rooms[i]}</label>`;
            document.querySelector('#avl-accomodations').innerHTML += p;
      }

      savedAccomodations.forEach(value => {
            const checkbox = document.querySelector(`input[name="avl"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
      });
}

async function avl_spaces() {
      const response = await fetch('/avl-spaces');
      const result = await response.json();
      console.log(result);

      document.getElementById('count-p').textContent = result.premium;
      document.getElementById('count-s').textContent = result.standard;
      document.getElementById('count-g').textContent = result.garden;
      document.getElementById('count-f').textContent = result.family;
      document.getElementById('count-bd').textContent = result.barkada;
      document.getElementById('count-c').textContent = result.cabana;
      document.getElementById('count-sm').textContent = result.small;
      document.getElementById('count-b').textContent = result.big;
      document.getElementById('count-h').textContent = result.hall;
}

async function recentBookings(){
      const year = document.getElementById('yearSelect').value;
      const month = document.getElementById('monthSelect').value;
      getTotalsCountData();

      const response = await fetch(`/recent-bookings?year=${year ? year : new Date().getFullYear()}&month=${month}`);
      const result = await response.json();
      
      document.querySelectorAll('tbody tr').forEach(row => row.remove());      
      resetToDefaultTabItem();

      if (result.success){
            result.data.forEach(row => {
                  createTable(row['id'], row['name'], row['checkin'], row['checkout'], row['stay'], row['accomodations'], row['booking_type'], row['status'], row['payment']);
            });
      }else {
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="8" class="text-center text-gray-800 py-6 dark:text-white">No data.</td>
                  </tr>
            `;
            
            tbody.innerHTML += empty_row;
      }
}

async function getYears(){
      const response = await fetch('/get-years');
      const result = await response.json();

      result.years.forEach(year => {
            const option = document.createElement("option"); 
            option.value = year.year;
            option.textContent = year.year;
      
            if (year.year === new Date().getFullYear()) option.selected = true; 
      
            document.getElementById('yearSelect').appendChild(option);
      });
}

function getMonths(){
      document.querySelectorAll('#monthSelect option').forEach(opt => opt.remove());

      const monthSelect = document.getElementById("monthSelect");
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      for (let i = 0; i < 12; i++) {
            const date = new Date(currentYear, i, 1);
            const monthName = date.toLocaleString("default", { month: "long" });
            const option = document.createElement("option");
            option.value = i + 1;
            option.textContent = monthName;
            
            if (i === currentDate.getMonth()) option.selected = true;
            monthSelect.appendChild(option);
      }
}

async function summaryCards(){
      const response = await fetch('/summary-cards-data');
      const result = await response.json();
      
      if (result.success){
            const data = result.data;

            document.getElementById('total_guest_today').textContent = data.total_guests;

            document.getElementById('guest-checkin').textContent = Number(data.guests_checkin) !== 0 ? `(${data.guests_checkin} guests)` : `(No guests)`;
            document.getElementById('total_checkin').textContent = data.bookings_checkin;
            
            document.getElementById('guest-checkout').textContent = Number(data.guests_checkout) !== 0 ? `(${data.guests_checkout} guests)` : `(No guests)`;
            document.getElementById('total_checkout').textContent = data.bookings_checkout;

            document.getElementById('guest-day-guest').textContent = Number(data.guests_day) !== 0 ? `(${data.guests_day} guests)` : `(No guests)`;
            document.getElementById('day_guests_today').textContent = data.bookings_day; 

            document.getElementById('guest-upcoming').textContent = Number(data.guests_upcoming) !== 0 ? `(${data.guests_upcoming} guests)` : `(No guests)`;
            document.getElementById('upcoming_arrivals').textContent = data.bookings_upcoming; 

            document.getElementById('guest-cancel').textContent = Number(data.guests_cancelled) !== 0 ? `(${data.guests_cancelled} guests)` : `(No guests)`;
            document.getElementById('cancelled').textContent = data.bookings_cancelled;
      }
}

async function getTotalsCountData() {
      const year = document.getElementById('yearSelect').value;
      const month = document.getElementById('monthSelect').value;

      const response = await fetch(`/totals?month=${month}&year=${year ? year : new Date().getFullYear()}`);
      const result = await response.json();

      if (result.success){
            updateBadge('all-data', result.all);
            updateBadge('reserved-data', result.reserved);
            //updateBadge('day-guest', result.day_guest);
            updateBadge('check_out-data', result.checkout);
            updateBadge('check_in-data', result.checkin);
            //updateBadge('paid-data', result.paid);
            updateBadge('not_paid-data', result.not_paid);
            updateBadge('cancelled-reservation-data', result.cancelled);
      }else{
            ('Failed');
      }
}

async function bookingsCategories(e){ 
      // disable btns when navigating 
      const allBtns = document.querySelectorAll('.btn');
      allBtns.forEach(btn => {
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
      });

      const tabItem = e.target.closest('.tab-item'); // ensures we get the button
      if (!tabItem) return; // safety check

      const category = tabItem.getAttribute('id'); // now this always works
      const year = document.getElementById('yearSelect').value;
      const month = document.getElementById('monthSelect').value;
      category_data = category;

      const response = await fetch(`/category-bookings?year=${year}&month=${month}&category=${category}`);
      const result = await response.json();

      if (result.success){
            document.querySelectorAll('tbody tr').forEach(row => row.remove());      
            result.data.forEach(row => {
                  createTable(row['id'], row['name'], row['checkin'], row['checkout'], row['stay'], row['accomodations'], row['booking_type'], row['status'], row['payment']);
            });
      }else {
            document.querySelectorAll('tbody tr').forEach(row => row.remove());
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="8" class="text-center text-gray-800 py-6 dark:text-white">No data.</td>
                  </tr>
            `;
            
            tbody.innerHTML += empty_row;
      }
}

async function searchGuest(e){ 
      const name = e.target.value;
      const year = document.getElementById('yearSelect').value;
      const month = document.getElementById('monthSelect').value;

      const response = await fetch(`/search-guest?name=${name}&year=${year}&month=${month}&category=${category_data}`);
      const result = await response.json();

      document.querySelectorAll('tbody tr').forEach(row => row.remove());      
      if (result.success){
            result.data.forEach(row => {
                  createTable(row['id'], row['name'], row['checkin'], row['checkout'], row['stay'], row['accomodations'], row['booking_type'], row['status'], row['payment']);
            });
      }else {
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="8" class="text-center text-gray-800 py-6 dark:text-white">No data.</td>
                  </tr>
            `;
            
            tbody.innerHTML += empty_row;
      }
}


// ---------- Event Listeners ----------------- //
document.addEventListener('click', (e) => {
      // btn click
      if (e.target.closest('#add-booking-btn')) renderAddBookingModal();
      if (e.target.closest('#mark-paid')) renderMarkPaidModal();
      if (e.target.closest('#mark-checkin')) markAsCheckin();
      if (e.target.closest('#mark-checkout')) markAsCheckout();
      if (e.target.closest('#cancel-bookings')) cancelBooking();
      if (e.target.closest('#update-reservation-date')) getReservationDate();
      if (e.target.closest('.tab-item')) bookingsCategories(e);

      // icon click 
      if (e.target.closest('#view-full-info')) renderViewReservationDetails(e.target.closest('tr').getAttribute('id'));           
      if (e.target.closest('#update-bookings')) getDataToUpdate(e);
      if (e.target.closest('#close-update-booking')) (savedAccomodations.length = 0, document.querySelector('#update-booking-overlay').remove());

      // label click
      if (e.target.matches('label')){
            if (e.target.closest('.btn-acc')) showAccomodationAvlForm(e);
            if (e.target.closest('#select-accomodation-avl')) saveAccomodationRoom();
            //if (e.target.closest('#reset-accomodation-avl')) resetCheckedAccomodation();
      }

      // span click
      if (e.target.matches('span')){
            if (e.target.closest('#close-details')) document.querySelector('#details-overlay').remove();
            if (e.target.closest('#close-mark-paid')) document.querySelector('#mark-paid-overlay').remove();
            if (e.target.closest('#close-add-booking')) (savedAccomodations.length = 0, document.querySelector('#booking-overlay').remove());
            if (e.target.closest('#close-accomodation-avl')) closeAccomodationRoom();
            if (e.target.closest('#close-reservation-overlay')) document.querySelector('#update-reservation-overlay').remove();
            if (e.target.closest('.remove-btn')) removeAccomodation(e);
      }
});

// submit
document.addEventListener('submit', async(e) => {
      if (e.target.matches('#markpaid-form')) submitPayment(e);
      if (e.target.matches('#addBookingForm')) addBooking(e);
      if (e.target.matches('#update-reserved-form')) updateReservationDate(e);
});

// select tags  
document.addEventListener('change', (e) => {
      if (e.target.matches('#yearSelect')) recentBookings();
      if (e.target.matches('#monthSelect')) recentBookings();
      if (e.target.matches('input[name="select"]')) enableActionBtns(e);
      if (e.target.matches('input[name="select"]')) {
            const checkbox = e.target;
            document.querySelectorAll('input[name="select"]').forEach(cb => {
                  if (cb !== checkbox) {
                        cb.checked = false;
      
                        const otherSpan = cb.nextElementSibling;
                        const otherIcon = otherSpan.querySelector('svg, i');
                        otherIcon?.classList.add('text-transparent');
                        otherIcon?.classList.remove('text-white');
                  }
            });
      
            const span = checkbox.nextElementSibling;
            const icon = span.querySelector('svg, i');
      
            if (checkbox.checked) {
                  icon.classList.remove('text-transparent');
                  icon.classList.add('text-white');
            } else {
                  icon.classList.add('text-transparent');
                  icon.classList.remove('text-white');
            }
      }
});

document.addEventListener('input', (e) => {
      if (e.target.matches('input[name="guest-name"]')) searchGuest(e);
});

// -------------- Initialiaze when loaded -----------
switchTabs();
getYears();
getMonths();

export function initPageReservation(){
      getTotalsCountData();
      resetDropDown();
      recentBookings();
      summaryCards();
}

