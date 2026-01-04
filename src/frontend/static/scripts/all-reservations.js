import { notifications} from "./home-dashboard.js";

const tbody = document.getElementById('tbody');
let savedAccomodations = [];
let category_data = 'all-data';
let roomCache = {};
let searchTimeout;

// ---------------- RENDER HELPERS ------------------
function successMessageCard4(message, redirect = null) {
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

function failedMessageCard4(message){
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

function createTable(id, guest_name, date_book, checkin, checkout, stay_count, accomodations, booking_type, status, payment_status){
      
      const row = `
            <tr class="text-[16px] hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up bg-gray-50 dark:bg-gray-900" id="${id}" data-set="${accomodations}" data-type="${booking_type}">
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
                        <div class="block w-[180px] mx-auto overflow-x-auto whitespace-nowrap truncate">
                              <span class="font-medium">${guest_name}</span>
                        </div>
                  </td>

                  <!-- BOOKING DATE -->
                  <td class="px-3 py-4 text-center">
                        <div class="block w-[150px] mx-auto overflow-x-auto whitespace-nowrap thin-scroll">
                              <span class="text-gray-700 dark:text-gray-100">${date_book}</span>
                        </div>
                  </td>

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
                        <div class="block w-[280px] truncate">
                              <span>${accomodations.split(',').map(accs => accs.trim()).join(', ')}</span>
                        </div>
                  </td>
                  
                  <td class="px-3 py-4">
                        <div class="w-[90px] truncate text-center mx-auto">
                              <span>${booking_type === 'Check-in' ? 'Room Stay' : booking_type}</span>
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
                        <div class="w-[200px] mx-auto">
                              <span class=" px-3 py-1 text-xs rounded-full dark:text-white">
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
      const form = `
            <div id="booking-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-3xl relative px-6 py-4 fade-in-up text-sm">
                        <!-- Close Button -->
                        <span id="close-add-booking" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-gray-400 text-2xl cursor-pointer">&times;</span>
                        <!-- Header -->
                        <div class="text-center mb-4">
                              <h2 class="text-lg font-bold text-gray-700 dark:text-white">Add Booking</h2>
                              <p class="text-gray-500 dark:text-gray-400">Fill out guest details and select accommodations below.</p>
                        </div>

                        <form id="addBookingForm" class="flex flex-col gap-4">
                        <!-- Booking Info -->
                              <section>
                                    <h3 class="text-gray-700 dark:text-gray-300 font-semibold mb-2 flex items-center gap-2"><i data-lucide="clipboard-list" class="lucide w-4 h-4"></i> Booking Info</h3>
                                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                          <select id="booking_status" name="booking_status" class="border border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                                <option class="text-black" value="" disabled selected hidden>Select Booking Status</option>
                                                <option class=" text-black" value="Checked-in">Checked-in</option>
                                                <option class=" text-black" value="Reserved">Reservation</option>
                                          </select>
                                          <select id="booking_type" name="booking_type" class="border border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                                <option class="text-black" value="" disabled selected hidden>Select Booking Type</option>
                                                <option class=" text-black" value="Check-in">Room Stay (Overnight)</option>
                                                <option class=" text-black" value="Day Guest">Day Guest (No Room Stay)</option>
                                          </select>
                                          <select id="payment" name="payment" class="border border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                                <option class=" text-black" value="" disabled selected hidden>Select Payment Type</option>
                                                <option class=" text-black" value="Direct Payment">Direct Payment</option>
                                                <option class=" text-black" value="ZUZU (Online Payment)">ZUZU (Online Payment)</option>
                                                <option class=" text-black" value="Pending">Pending</option>
                                          </select>
                                    </div>
                              </section>

                              <!-- Schedule Info -->
                              <section>
                                    <h3 class="text-gray-700 dark:text-gray-300 font-semibold mb-2 flex items-center gap-2"><i data-lucide="calendar" class="lucide w-4 h-4"></i> Schedule</h3>
                                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                          <div>
                                                <label class="book_date_label text-gray-600 dark:text-gray-200 text-xs mb-1 block">Date Book</label>
                                                <input type="date" name="book_date" class="w-full border date-icon border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                          </div>
                                          <div>
                                                <label class="text-gray-600 dark:text-gray-200 text-xs mb-1 block">Check-In Date</label>
                                                <input type="date" name="checkin" class="w-full border date-icon border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                          </div>
                                          <div>
                                                <label class="checkout_label text-gray-600 dark:text-gray-200 text-xs mb-1 block">Check-Out Date</label>
                                                <input type="date" name="checkout" class="w-full border date-icon border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                          </div>
                                          <div>
                                                <label  class="date_paid_label text-gray-600 dark:text-gray-200 text-xs mb-1 block">Date Paid</label>
                                                <input type="date" name="date_paid_add" class="w-full border date-icon border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                          </div>
                                    </div>
                              </section>
                              
                              <!-- Personal Info -->
                              <section>
                                    <h3 class="text-gray-700 dark:text-gray-300 font-semibold mb-2 flex items-center gap-2"><i data-lucide="user" class="lucide w-4 h-4"></i> Guest Info</h3>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <input type="text" name="name" placeholder="Guest Name" class="border border-gray-300 dark:text-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                          <input type="number" name="total_guest" placeholder="Total Guests" min="1" class="border dark:text-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2 rounded-md transition-all" required>
                                    </div>
                              </section>
                              
                              <!-- Accommodations -->
                              <section>
                                    <h3 class="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-center flex justify-center items-center gap-2"><i data-lucide="home" class="lucide w-4 h-4"></i> Select Accommodations</h3>
                                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                          <div class="btn-acc flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Premium Villa">
                                                <i data-lucide="bed" class="lucide w-5 h-5"></i>
                                                <label>Premium Villa (<span id="count-p"></span>)</label> 
                                          </div>
                                    
                                          <div class="btn-acc flex flex-col items-center justify-center bg-green-600 hover:bg-green-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Standard Villa">
                                                <i data-lucide="bed" class="lucide w-5 h-5"></i>
                                                <label>Standard Villa (<span id="count-s"></span>)</label> 
                                          </div>

                                          <div class="btn-acc flex flex-col items-center justify-center bg-teal-600 hover:bg-teal-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Garden View">
                                                <i data-lucide="bed" class="lucide w-5 h-5"></i>
                                                <label>Garden View (<span id="count-g"></span>)</label> 
                                          </div>
                                    
                                          <div class="btn-acc flex flex-col items-center justify-center bg-pink-600 hover:bg-pink-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Barkada Room">
                                                <i data-lucide="bed" class="lucide w-5 h-5"></i>
                                                <label>Barkada Room (<span id="count-bd"></span>)</label> 
                                          </div>

                                          <div class="btn-acc flex flex-col items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Cabana Cottage">
                                                <i data-lucide="umbrella" class="lucide w-5 h-5"></i>
                                                <label>Cabana Cottage (<span id="count-c"></span>)</label> 
                                          </div>

                                          <div class="btn-acc flex flex-col items-center justify-center bg-red-600 hover:bg-red-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Small Cottage">
                                                <i data-lucide="umbrella" class="lucide w-5 h-5"></i>
                                                <label>Small Cottage (<span id="count-sm"></span>)</label> 
                                          </div>

                                          <div class="btn-acc flex flex-col items-center justify-center bg-yellow-600 hover:bg-yellow-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Big Cottage">
                                                <i data-lucide="umbrella" class="lucide w-5 h-5"></i>
                                                <label>Big Cottage (<span id="count-b"></span>)</label> 
                                          </div>

                                          <div class="btn-acc flex flex-col items-center justify-center bg-gray-600 hover:bg-gray-500 text-white py-1 rounded-lg cursor-pointer transition-all" data-section="Hall">
                                                <i data-lucide="users" class="lucide w-5 h-5"></i>
                                                <label>All Hall (<span id="count-h"></span>)</label> 
                                          </div>
                                    </div>

                                    <div class="mt-3 text-sm">
                                          <label class="text-gray-600 dark:text-gray-100 block mb-1 font-medium">Selected Accommodations:</label>
                                          <div id="selected-accomodations" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 border border-gray-300 rounded-md p-2 bg-gray-50 dark:bg-gray-800 h-15 overflow-y-auto"></div>
                                          <input type="hidden" name="accomodations_selected">
                                    </div>
                              </section>

                              <!-- Submit Button -->
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-all mt-2 flex justify-center items-center gap-2"><i data-lucide="check-circle" class="lucide w-4 h-4"></i> Submit</button>
                        </form>
                  </div>

                  <div class="accomodation-avl-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-50 hidden">
                        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[90%] max-w-md p-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fade-in-up">
                              <span id="close-accomodation-avl" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-gray-400 text-2xl cursor-pointer">&times;</span>
                              <h2 id="accomodation_label" class="text-xl font-semibold text-gray-800 dark:text-gray-100 text-center mt-2">Premium Villa Rooms</h2>
                              <div id="avl-accomodations" class="mt-5 max-h-[240px] overflow-y-auto thin-scroll space-y-2 p-1 flex flex-col"></div>
                              <!-- Bottom Buttons -->
                              <div class="mt-6 flex gap-3">
                                    <button id="select-all-areas" class="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-3 rounded-lg font-medium flex-1 transition">Select All</button>
                                    <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition" id="select-accomodation-avl">Saved</button>
                              </div>
                        </div>
                  </div>

            </div>
      `;

      document.getElementById('reservationPortal').innerHTML += form; 
      lucide.createIcons();
}

function renderEditReservedModal(id, check_in, check_out, booking_type){
      const modal = `
            <div class="fixed top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm z-50" id="update-reservation-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-[500px] px-6 py-4 fade-in-up">
                        <span class="font-semibold text-[25px] flex justify-end cursor-pointer text-gray-900 dark:text-gray-200" id="close-reservation-overlay">&times;</span>
                        <h2 class="text-gray-500 dark:text-gray-100 text-center font-bold text-[20px]">Update Booking Schedule</h2>
                        <form id="update-reserved-form">
                              <div class="flex flex-col gap-6 mt-2">
                                    <input type="hidden" name="id" value="${id}">
                                    <div class="flex flex-col gap1 text-gray-600 dark:text-gray-200">
                                          Edit Check-In:
                                          <input type="date" name="edit_checkin" class="border border-gray-300 text-gray-600 dark:text-gray-100 p-4 rounded-sm date-icon" value="${check_in}">
                                    </div>
                                    <div class="flex flex-col gap1  text-gray-600 dark:text-gray-200">
                                          Edit Check-out:
                                          <input type="date" name="edit_checkout" class="border border-gray-300  text-gray-600 dark:text-gray-100 p-4 rounded-sm date-icon" value="${check_out}">
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
                                          <label class="text-sm text-gray-600 dark:text-gray-200">Select Payment Type:</label>
                                          <select id="mark-payment" class="border border-gray-300 p-4 rounded-sm text-gray-800 dark:text-white" required>
                                                <option class="text-gray-900" value="" hidden>Select Here</option>
                                                <option class="text-gray-900" value="Direct Payment">Direct Payment</option>
                                                <option class="text-gray-900" value="ZUZU (Online Payment)">ZUZU (Online Payment)</option>
                                          </select> 
                                    </div>
                                    <div class="flex flex-col gap1 text-gray-600 dark:text-gray-200">
                                          Date paid:
                                          <input type="date" name="date_paid" class="border border-gray-300 text-gray-600 dark:text-gray-100 p-4 rounded-sm date-icon">
                                    </div>
                                    <button type="submit" class="bg-primary-blue hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-sm text-white py-2 px-[50px] text-center">Done</button>      
                              </div>
                        </form>
                  </div>
            </div>
      `;
      
      document.getElementById('reservationPortal').innerHTML += modal; 
}

function showAccomodationAvlForm(e) {
      const card = e.target.closest(".btn-acc");
      if (!card) return;    // Click was outside cards

      const section = card.dataset.section;
      document.getElementById('accomodation_label').textContent = `${section} Available's`;
      document.querySelector(".accomodation-avl-overlay").classList.remove("hidden");
      
      generateAvlAccomodation(section);
}

function saveAccomodationRoom(){
      const checked = document.querySelectorAll('input[type="checkbox"]:checked');

      if (checked.length > 0){
            checked.forEach(cb => {
                  if (!savedAccomodations.includes(cb.value) && cb.value !== 'on'){
                        console.log(cb.value);
                        savedAccomodations.push(cb.value);
                        const tag = `<label class="h-10 bg-green-500 hover:bg-green-600 px-2 py-1 rounded-lg inline-flex justify-between items-center gap-2 text-white text-sm font-medium shadow-sm transition" id="${cb.value.split(' ').join('-')}"> ${cb.value} <span class="remove-btn text-lg font-bold cursor-pointer"  data-acc="${cb.value}">&times;</span></label>`;
                        document.querySelector("#selected-accomodations").innerHTML += tag;
                  }
            });
      }
      
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
      document.getElementById('daySelect3').value = new Date().getDate();
      recentBookings(); 
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
            const status = tr.querySelectorAll('td')[6].textContent.trim();
            const payment = tr.querySelectorAll('td')[7].textContent.trim();
            const booking_type = tr.getAttribute('data-type');
            
            // --- Apply your conditions
            allBtns.forEach(btn => {
                  const date = tr.querySelectorAll('td')[3].textContent.split('-');
                  const year = document.getElementById('yearSelect').value;
                  const reservationDate = new Date(`${date[0]}${year}`);
                  const checkoutDate = new Date(`${date[1]}${year}`);
                  const todayDate = new Date();
                  console.log(booking_type);
                  // Paid
                  if (payment !== 'Pending') {
                        if (booking_type === 'Day Guest'){
                              if (status === 'Checked-in' ) {
                                    if (checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }

                                    if (checkoutDate > todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                                    
                              }else if (status === 'Reserved'){
                                    if (reservationDate <= todayDate && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-paid') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                                    else if (reservationDate > todayDate && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'mark-checkin') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                              }
                              
                        }else if (booking_type === 'Check-in'){
                              // enable change date, checkin,  & cancel reservation btns
                              if (status === 'Reserved'){
                                    if (reservationDate > todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-paid') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }

                                    if (reservationDate <= todayDate && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-paid') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                              }

                              if (status === 'Checked-in'){
                                    if (checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'cancel-bookings') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }else if (checkoutDate > todayDate && btn.getAttribute('id') !== 'mark-checkin' &&  btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-paid' && btn.getAttribute('id') !== 'cancel-bookings') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                              }
                        }
                  } else { // Not Paid
                        if (booking_type === 'Day Guest'){
                              if (status === 'Checked-in' && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings' && btn.getAttribute('id') !== 'update-reservation-date') {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                              }else if (status === 'Reserved' ){
                                    console.log('here2');
                                    if (reservationDate <= todayDate&& btn.getAttribute('id') !== 'mark-checkout') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                                    else if (reservationDate > todayDate&& btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-checkin') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                              }
                        }else if (booking_type === 'Check-in'){
                              // enable change date, checkin,  & cancel reservation btns
                              if (status === 'Reserved'){
                                    if (reservationDate > todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-checkout') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                                    else if (reservationDate <= todayDate && btn.getAttribute('id') !== 'mark-checkout') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
                              }

                              if (status === 'Checked-in'){
                                    if (checkoutDate <= todayDate && btn.getAttribute('id') !== 'mark-checkin' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }else if (checkoutDate > todayDate && btn.getAttribute('id') !== 'mark-checkin' &&  btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'cancel-bookings') {
                                          btn.style.opacity = '1';
                                          btn.style.pointerEvents = 'auto';
                                    }
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
            badge.textContent = `${value}`;
            badge.classList.remove("hidden");
      } else {
            badge.textContent = "";
            badge.classList.add("hidden");
      }
}

function selectAllRooms(){
      const checkboxes = document.querySelectorAll(`#avl-accomodations input[name="avl"]`);
      checkboxes.forEach(cb => cb.checked = true);
}

function showAccomodationBasedOnBookingType(e){
      const selectedBookingType = e.target.value;

      if (selectedBookingType === 'Day Guest') {
            const allowedAreas = ['Cabana Cottage', 'Hall', 'Big Cottage', 'Small Cottage'];

            document.querySelectorAll('.btn-acc').forEach(btn => {
                  const area = btn.getAttribute('data-section');

                  if (allowedAreas.includes(area.trim())) {
                        btn.disabled = false; 
                        btn.classList.remove('opacity-20', 'cursor-not-allowed', 'pointer-events-none'); // optional style
                  } else {
                        btn.disabled = true;
                        btn.classList.add('opacity-20', 'cursor-not-allowed', 'pointer-events-none'); // optional style
                  }
            });
      }else {
            document.querySelectorAll('.btn-acc').forEach(btn => {
                  btn.disabled = false;
                  btn.classList.remove('opacity-20', 'cursor-not-allowed', 'pointer-events-none');
            });
      }      
}

function showPaymentDate(e){
      const selectedPaymentType = e.target.value;

      const dateInput = document.querySelector('input[name="date_paid_add"]'); // select the input
      const dateLabel = document.querySelector('.date_paid_label');

      if (selectedPaymentType === 'Pending') {
            dateInput.disabled = true; // disables the input
            dateInput.classList.add('opacity-20', 'cursor-not-allowed'); // optional styling
            dateLabel.classList.remove('text-gray-600', 'dark:text-gray-200');
            dateLabel.classList.add('text-gray-200', 'dark:text-gray-600');
      } else {
            dateInput.disabled = false; // enables the input
            dateInput.classList.remove('opacity-20', 'cursor-not-allowed');
            dateLabel.classList.remove('text-gray-200', 'dark:text-gray-600');
            dateLabel.classList.add('text-gray-600', 'dark:text-gray-200');
      }
}

function showBookingDate(e){
      const selectedBookingType = e.target.value;

      const dateInput = document.querySelector('input[name="book_date"]'); // select the input
      const dateLabel = document.querySelector('.book_date_label');

      if (selectedBookingType !== 'Reserved') {
            dateInput.disabled = true; // disables the input
            dateInput.classList.add('opacity-20', 'cursor-not-allowed'); // optional styling
            dateLabel.classList.remove('text-gray-600', 'dark:text-gray-200');
            dateLabel.classList.add('text-gray-200', 'dark:text-gray-600');
      } else {
            dateInput.disabled = false; // enables the input
            dateInput.classList.remove('opacity-20', 'cursor-not-allowed');
            dateLabel.classList.remove('text-gray-200', 'dark:text-gray-600');
            dateLabel.classList.add('text-gray-600', 'dark:text-gray-200');
      }
}

function debouncedSearch(e) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => searchGuest(e), 300);
}

function loadingAnimation0(){
      const load = `
            <div id="loading" class="absolute top-65 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-auto text-white space-y-2 z-50 ">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black">Fetching data...</p>
            </div>
      `;      

      document.getElementById('loadingTablePortal').innerHTML += load;
}

function loadingAnimationUpcoming(){
      const load = `
            <div id="loading" class="absolute top-0 left-0 flex flex-col items-center justify-center h-[40vh] inset-0 bg-black/5 text-white space-y-2 backdrop-blur-[2px] z-10">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black dark:text-white">Fetching data...</p>
            </div>
      `;      

      document.getElementById('upcoming-loading-data2').innerHTML += load ;
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
            loadingAnimation0(); // adds #loading inside #loadingPortal
      }else{
            loadingAnimationAdd(message)
      }
}

function hideLoader() {
      const loader = document.querySelector('#loading');
      if (loader) loader.remove();
}

function clearCache(cache) {
      for (const key in cache) {
            delete cache[key];
      }
}

async function viewUpcomingModal(title, type){
      const modal = `
      <div id="view-upcoming-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <!-- Modal Container -->
            <div class="relative w-full max-w-5xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 animate-fade-in h-[60vh]">
                  <!-- Close Button -->
                  <span id="close-view-upcoming-modal" class="cursor-pointer absolute top-1 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white text-xl font-semibold transition">&times;</span>
            
                  <!-- Header -->
                  <div class="flex justify-between items-center mb-4 mt-3">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">${title}</h3>

                        <select id="upcoming-day" data-section=${type}  class="px-3 py-2 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-red-500 outline-none transition">
                              <option value="today">Today</option>
                              <option value="tomorrow">Tomorrow</option>
                        </select>
                  </div>
            
                  <!-- Table Wrapper -->
                  <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <!-- Scroll Area -->
                        <div class="h-[40vh] overflow-y-auto">
                              <table class="w-full text-sm text-left text-gray-800 dark:text-gray-100">
                                    <thead class="sticky top-0 z-50 bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-600 dark:text-gray-300">
                                          <tr>
                                                <th class="px-4 py-3 text-center">Guest Name</th>
                                                <th class="px-4 py-3 text-center">Booking Type</th>
                                                <th class="px-4 py-3 text-center">Check-In</th>
                                                <th class="px-4 py-3 text-center">Check-Out</th>
                                                <th class="px-4 py-3 text-center">Total Guests</th>
                                          </tr>
                                    </thead>
                                    <tbody id="upcoming-table2" class="divide-y divide-gray-200 dark:divide-gray-700">
                                          <div id="upcoming-loading-data2" class="relative">
                                    </tbody>
                              </table>
                        </div>
                  </div>
            </div>
      </div>
      `;
      
      document.getElementById('reservationPortal').innerHTML += modal;
      upcomingData(type, 'today');
}

function toggleFilter(toggleId, selectId) {
      const toggle = document.getElementById(toggleId);
      const select = document.getElementById(selectId);
  
      // Toggle its own select
      select.disabled = !toggle.checked;
      select.classList.toggle('opacity-40', !toggle.checked);
  
  
      if (toggleId === 'dayToggle') {
          if (!toggle.checked) {
              // DAY OFF → month-only
              fetchByFilterStatus('month-only');
          } else {
              // DAY ON → full filter
              fetchByFilterStatus('all-enabled');
          }
      }
}

function fetchByFilterStatus(status) {
      if (category_data) {
            bookingsCategories(status);
      } else {
          // normal recent bookings
            recentBookings(status);
      }
      
      getTotalsCountData(status);
}

function getFilterStatus() {
      const dayChecked = document.getElementById('dayToggle')?.checked;

      if (!dayChecked) return 'month-only';
      return 'all-enabled';
}

function recheckDateFilter(){
      document.getElementById('dayToggle').checked = true;
      document.getElementById('dayToggle').disabled = false;
      
      const daySelect = document.getElementById('daySelect3');

      // Toggle its own select
      daySelect.disabled = false;
      daySelect.classList.remove('opacity-40');
}

function parseOrReturn(value) {
      // Check if value is already a Date object
      if (value instanceof Date && !isNaN(value)) {
          return value; // already a Date
      }
  
      // Check if value is a string and can be parsed as a date
      if (typeof value === "string") {
            const parsed = new Date(value);
            if (!isNaN(parsed)) {
                  
                  const date = new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                  return date; // parsed successfully
            }
      }

      // Otherwise, return as-is
      return value;
}

// --------------- POST DATA Fetching -------------- //
async function addBooking(e){
      e.preventDefault();      
      const form = new FormData(e.target);
      showLoader('data', 'Adding guest...');
      
      try{
            const response = await fetch('/add-booking', {
                  method: 'POST', 
                  headers: {'Content-Type': 'application/json'}, 
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();

            if (result.success){
                  e.target.reset();
                  hideLoader();
                  await notifications();
                  successMessageCard4(result.message);
                  document.querySelector('#booking-overlay').remove();
                  recentBookings();
                  summaryCardsDatas();
                  upcomingCount();
                  savedAccomodations.length =  0; // empty the array
            }else{
                  hideLoader();
                  failedMessageCard4(result.message);
                  recentBookings();
            }
            
            getTotalsCountData('all-enabled');
      }catch(err){
            console.log(err);
      }
      
}

async function markAsCheckout(){
      const id = retrieveCheckboxId().id;
      const accommodations = retrieveCheckboxId().accomodations;
      
      showLoader('data', 'Checking-Out guest...');
      const response = await fetch(`/mark-checkout?id=${id}&accomodation=${accommodations}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            await notifications();
            upcomingCount();
            hideLoader();
            successMessageCard4(result.message);
            recentBookings();
            summaryCardsDatas();
            resetButtonAndCheckBox();
      }else{
            hideLoader();
            failedMessageCard4(result.message);
      }
      getTotalsCountData(getFilterStatus());
}

async function markAsCheckin(){
      const id = retrieveCheckboxId().id;
      const accommodations = retrieveCheckboxId().accomodations;
      
      showLoader('data', 'Checking-In guest...');
      const response = await fetch(`/mark-checkin?id=${id}&accomodation=${accommodations}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            await notifications();
            hideLoader();
            successMessageCard4(result.message);
            upcomingCount();
            summaryCardsDatas();
            recentBookings();
            resetButtonAndCheckBox();
      }else{
            hideLoader();
            failedMessageCard4(result.message);
      }
      getTotalsCountData(getFilterStatus());
}

async function cancelBooking(){
      const id = retrieveCheckboxId().id;
      const accommodations = retrieveCheckboxId().accomodations;
      
      showLoader('data', 'Cancelling booking...');
      const response = await fetch(`/cancel-booking?id=${id}&accomodation=${accommodations}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'} 
      });
      const result = await response.json();

      if (result.success){
            await notifications();
            hideLoader();
            successMessageCard4(result.message);
            upcomingCount();
            recentBookings();
            summaryCardsDatas();
            resetButtonAndCheckBox();
      }else{
            hideLoader();
            failedMessageCard4(result.message);
      }
      getTotalsCountData(getFilterStatus());
}

async function submitPayment(e){
      e.preventDefault();
      showLoader('data', 'Adding Payment...');
      const select = document.getElementById('mark-payment').value;
      const id = retrieveCheckboxId().id;

      const response = await fetch(`/mark-paid?id=${id}&payment=${select}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            hideLoader();
            successMessageCard4(result.message);
            document.querySelector('#mark-paid-overlay').remove();
            recentBookings();
            resetButtonAndCheckBox();
      }else{
            hideLoader();
            failedMessageCard4(result.message);
      }
      getTotalsCountData(getFilterStatus());
}

async function updateReservationDate(e){
      e.preventDefault();
      const form = new FormData(e.target);
      
      showLoader('data', 'Updating booking schedule...');
      const response = await fetch(`/update-reservation-date`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const result = await response.json();

      if (result.success){
            await notifications();
            hideLoader();
            successMessageCard4(result.message);
            upcomingCount();
            document.querySelector('#update-reservation-overlay').remove();
            recentBookings();
            resetButtonAndCheckBox();
      }else {
            hideLoader();
            failedMessageCard4(result.message);
            document.querySelector('#update-reservation-overlay').remove();
      }
      getTotalsCountData(getFilterStatus());
}

// --------------- GET DATA Fetching -------------- //
async function renderViewReservationDetails(id){
      showLoader('data', 'Retrieving booking details...');
      console.log(id);
      const response = await fetch(`/view-details/${id}`);
      const result = await response.json();

      if (result.success){
            const check_in = new Date(result.data.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
            const check_out = new Date(result.data.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
            const date_book = new Date(result.data.date_book).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
            const paid_date = result.data.paid_date ? new Date(result.data.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}) : '--';
            
            const modal = `
                  <div id="details-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div class="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden ">

                              <!-- Header -->
                              <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Guest Details</h2>
                                    <span id="close-details" class="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 text-2xl font-bold transition cursor-pointer">&times;</span>
                              </div>

                              <!-- Body -->
                              <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <!-- Guest Info -->
                                    <div class="space-y-2 md:col-span-1">
                                          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Personal Info</h3>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal text-sm">Name</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.name}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Total Guests</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.total_guest}</div>
                                          </div>
                                    </div>

                                    <!-- Booking Info -->
                                    <div class="space-y-2 md:col-span-1">
                                          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Booking Info</h3>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Booking Type</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.booking_type === 'Check-in' ? 'Room Stay' : result.data.booking_type}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Status</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.status}</div>
                                          </div>
                                    </div>

                                    <!-- Schedule Info -->
                                    <div class="space-y-2 md:col-span-1">
                                          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Schedule</h3>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Date Book</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${date_book}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Check-in</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${check_in}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Check-out</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${check_out}</div>
                                          </div>
                                    </div>

                                    <!-- Payment Info -->
                                    <div class="space-y-2 md:col-span-1">
                                          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Payment</h3>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Date Paid</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${paid_date}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Payment ${result.data.payment === 'None' | result.data.payment === "Refunded" ? 'Status' : 'Method'}</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.payment}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">${result.data.status !== "Cancelled" && result.data.payment !== "Pending" ? 'Total Amount Paid' : 'Total Amount to Pay'} (₱)</p>
                                                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.total_amount}</div>
                                          </div>
                                    </div>

                                    <!-- Promo Info -->
                                    <div class="md:col-span-2 space-y-2">
                                          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Promo & Areas Affected</h3>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Promo Name</p>
                                                <div class="max-h-20 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.promo}</div>
                                          </div>
                                          <div>
                                                <p class="text-gray-600 dark:text-gray-400 font-normal">Area Affected</p>
                                                <div class="max-h-20 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.promo_area.split(',').map(acc => acc.trim()).join(', ')}</div>
                                          </div>
                                    </div>

                                    <!-- Accommodations -->
                                    <div class="md:col-span-2 space-y-2">
                                          <h3 class="text-sm font-normal text-gray-700 dark:text-gray-300">Accommodations</h3>
                                          <div class="max-h-28 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 text-black dark:text-white">${result.data.accomodations.split(',').map(acc => acc.trim()).join(', ')}</div>
                                    </div>
                              </div>
                        </div>
                  </div>
            `;

            document.getElementById('reservationPortal').innerHTML += modal; 
      }else{
            alert(result.message);
      }
      hideLoader();
}

async function getReservationDate(){
      const id = retrieveCheckboxId().id;
      showLoader('data', 'Retrieving booking schedule...');
      const response = await fetch(`/get-reservation-date?id=${id}`);
      const result = await response.json();
      
      const formatCheckin = new Date(result.check_in).toISOString().split('T')[0];
      const formatCheckout = new Date(result.check_out).toISOString().split('T')[0];

      renderEditReservedModal(id, formatCheckin, formatCheckout, result.booking_type); 
      hideLoader();
}

async function generateAvlAccomodation(accomodation){
      document.querySelectorAll('#avl-accomodations label').forEach(label => label.remove());
      let room_name = accomodation.split(' ');
      let rooms = [];

      if (accomodation === 'Hall'){
            const halls = ['Pavillion', 'Mariposa', 'Minicon'];
            let p = '';

            halls.forEach(name => {
                  if (roomCache[name]) {
                        p +=  `
                              <label  class="acc-card flex gap-2 justify-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-800 dark:text-gray-100 text-center border border-gray-300 dark:border-gray-700 cursor-pointer transition select-none hover:bg-gray-100 dark:hover:bg-gray-700"">
                                    <input type="checkbox" class="text-gray-100 dark:text-gray-800 w-3" name="avl" value="${name} ${101}" required>${name} ${101}
                              </label>
                        `;
                  }
            });

            document.querySelector('#avl-accomodations').innerHTML += p;
      }else{
            rooms = roomCache[room_name[0]];
            for (let i = 0; i < rooms.length; i++){
                  const p = `
                        <label  class="acc-card flex gap-2 justify-center bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-800 dark:text-gray-100 text-center border border-gray-300 dark:border-gray-700 cursor-pointer transition select-none hover:bg-gray-100 dark:hover:bg-gray-700"">
                              <input type="checkbox" class="text-gray-100 dark:text-gray-800 w-3" name="avl" value="${accomodation} ${rooms[i]}" required>${accomodation} ${rooms[i]}
                        </label>
                  `;
                  document.querySelector('#avl-accomodations').innerHTML += p;
            }
      }

      savedAccomodations.forEach(value => {
            const checkbox = document.querySelector(`input[name="avl"][value="${value}"]`);
            if (checkbox) checkbox.checked = true;
      });
}

async function avl_spaces() {
      clearCache(roomCache);
      const response1 = await fetch(`/avl-rooms`);
      const result1 = await response1.json();
      const rooms = result1.rooms;

      rooms.forEach(([room, name]) => {
            if (!roomCache[name]) {
                  roomCache[name] = [];
            }
            roomCache[name].push(room);
      });
      
      const response = await fetch('/avl-spaces');
      const result = await response.json();

      document.getElementById('count-p').textContent = result.premium;
      document.getElementById('count-s').textContent = result.standard;
      document.getElementById('count-g').textContent = result.garden;
      document.getElementById('count-bd').textContent = result.barkada;
      document.getElementById('count-c').textContent = result.cabana;
      document.getElementById('count-sm').textContent = result.small;
      document.getElementById('count-b').textContent = result.big;
      document.getElementById('count-h').textContent = result.hall;
}

async function recentBookings(status ='all-enabled') {
      document.querySelectorAll('tbody tr').forEach(row => row.remove());
      resetToDefaultTabItem();
      showLoader('table');

      getTotalsCountData(getFilterStatus());

      let url;
      const year = document.getElementById('yearSelect').value || new Date().getFullYear();
      const month = document.getElementById('monthSelect').value;
      const day = document.getElementById('daySelect3').value;
      
      if (status === 'all-enabled') {
          url = `/recent-bookings?year=${year}&month=${month}&day=${day}`;
      } 
      else{
          url = `/recent-bookings-month?year=${year}&month=${month}`;
      } 
  
      const response = await fetch(url);
      const result = await response.json();
  
      hideLoader();
  
      if (result.success && result.data.length) {
            result.data.forEach(row => {
                  const check_out = parseOrReturn(row.check_out);
                  const check_in = parseOrReturn(row.check_in);
                  const date_book = parseOrReturn(row.date_book);
            
                  createTable(row.booking_id, row.name, date_book, check_in, check_out, row.stay, row.accomodations, row.booking_type, row.status, row.payment);
            });
      } else {
            tbody.innerHTML = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="9" class="text-center py-6">No data.</td>
                  </tr>
            `;
      }
}

async function getYears(){
      document.querySelectorAll('#yearSelect option').forEach(opt => opt.remove());
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

function getDays2() {
      document.querySelectorAll('#daySelect3 option').forEach(opt => opt.remove());

      const daySelect = document.getElementById("daySelect3");
      const year = Number(document.getElementById('yearSelect').value);
      const month = Number(document.getElementById('monthSelect').value);

      const now = new Date();
      const isCurrentMonth =
            year === now.getFullYear() &&
            month === now.getMonth() + 1;

      const selectedDay = isCurrentMonth ? now.getDate() : 1;

      // Number of days in selected month
      const monthDays = new Date(year, month, 0).getDate();

      for (let day = 1; day <= monthDays; day++) {
            const option = document.createElement("option");
            option.value = day;
            option.textContent = day;

            if (day === selectedDay) option.selected = true;

            daySelect.appendChild(option);
      }
}

async function summaryCardsDatas(){
      const response = await fetch('/summary-cards-data');
      const result = await response.json();
      
      if (result.success){
            const data = result.data;
            document.getElementById('total_guest_checkin_today').textContent = Number(data.guests_checkin) !== 0 ? `${data.guests_checkin}` : `0`;
            document.getElementById('checkin_count_today').textContent = data.bookings_checkin;

            document.getElementById('guest-checkin').textContent = Number(data.guests_overnight) !== 0 ? `(${data.guests_overnight} guests)` : `(No guests)`;
            document.getElementById('total_checkin').textContent = data.bookings_overnight;

            document.getElementById('guest-day-guest').textContent = Number(data.guests_day) !== 0 ? `(${data.guests_day} guests)` : `(No guests)`;
            document.getElementById('day_guests_today').textContent = data.bookings_day; 

            document.getElementById('guest-upcoming').textContent = Number(data.guests_upcoming) !== 0 ? `(${data.guests_upcoming} guests)` : `(No guests)`;
            document.getElementById('upcoming_arrivals').textContent = data.bookings_upcoming; 

            document.getElementById('guest-cancel').textContent = Number(data.guests_cancelled) !== 0 ? `(${data.guests_cancelled} guests)` : `(No guests)`;
            document.getElementById('cancelled').textContent = data.bookings_cancelled;
            
            document.getElementById('checkout-day-guest2').textContent = data.day_guest;
            document.getElementById('checkout-overnight2').textContent = data.overnight;
            document.getElementById('total-checkout-guests2').textContent = data.today_checkout_guests;
      }
}

async function getTotalsCountData(status) {
      let url;
      const year = document.getElementById('yearSelect').value || new Date().getFullYear();
      const month = document.getElementById('monthSelect').value;
      const day = document.getElementById('daySelect3').value;

      if (status === 'all-enabled') {
          url = `/totals?year=${year}&month=${month}&day=${day}`;
      } 
      else{
          url = `/totals-month?year=${year}&month=${month}`;
      } 
  
      const response = await fetch(url);
      const result = await response.json();

      if (result.success){
            updateBadge('all-data', result.all);
            updateBadge('reserved-data', result.reserved);
            updateBadge('day-guest', result.day_guest);
            updateBadge('overnight-data', result.overnight);
            updateBadge('check_in-data', result.checkin);
      }else{
            ('Failed');
      }
}

async function bookingsCategories(status='all-enabled'){ 
      document.querySelectorAll('tbody tr').forEach(row => row.remove());      
      // disable btns when navigating 
      const allBtns = document.querySelectorAll('.btn');
      allBtns.forEach(btn => {
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
      });

      const year = document.getElementById('yearSelect').value;
      const month = document.getElementById('monthSelect').value;
      const day = document.getElementById('daySelect3').value;

      showLoader('table');
      
      let url = null;
      if (status === 'all-enabled') {
            url = `/category-bookings?category=${category_data}&year=${year}&month=${month}&day=${day}`;
      } 
      else{
            url = `/category-bookings-month?category=${category_data}&year=${year}&month=${month}`;
      } 

      const response = await fetch(url);
      const result = await response.json();

      if (result.success){
            hideLoader();
            result.data.forEach(row => {
                  const check_out = parseOrReturn(row.check_out);
                  const check_in = parseOrReturn(row.check_in);
                  const date_book = parseOrReturn(row.date_book);

                  createTable(row.booking_id, row['name'], date_book, check_in, check_out, row['stay'], row['accomodations'], row['booking_type'], row['status'], row['payment']);
            });
      }else {
            document.querySelectorAll('tbody tr').forEach(row => row.remove());
            hideLoader();
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="9" class="text-center text-gray-800 py-6 dark:text-white">No data.</td>
                  </tr>
            `;
            
            tbody.innerHTML += empty_row;
      }
}

async function searchGuest(e){ 
      document.querySelectorAll('tbody tr').forEach(row => row.remove());      
      const name = e.target.value;
      let status = getFilterStatus();
      showLoader('table');
      
      let url;
      const year = document.getElementById('yearSelect').value || new Date().getFullYear();
      const month = document.getElementById('monthSelect').value;
      const day = document.getElementById('daySelect3').value;
      console.log(status);
      if (status === 'all-enabled') {
            url = `/search-guest?name=${name}&category=${category_data}&year=${year}&month=${month}&day=${day}`;
      } 
      else {
            url = `/search-guest-month?name=${name}&category=${category_data}&year=${year}&month=${month}`;
      } 
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success){
            hideLoader();
            result.data.forEach(row => {
                  createTable(row['id'], row['name'], row['date_book'], row['checkin'], row['checkout'], row['stay'], row['accomodations'], row['booking_type'], row['status'], row['payment']);
            });
      }else {
            hideLoader();
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="9" class="text-center text-gray-800 py-6 dark:text-white">No data.</td>
                  </tr>
            `;
            
            tbody.innerHTML += empty_row;
      }
}

async function upcomingData(type, day_type) {
      document.querySelector('#upcoming-table2').querySelectorAll('tbody tr').forEach(row => row.remove());
      loadingAnimationUpcoming();
      let url = null;
      if (type === 'checkout'){
            url = `/upcoming-checkout?day=${day_type}`;
      }else{
            url = `/upcoming-arrival?day=${day_type}`;
      }
      const response = await fetch(url);
      const res = await response.json();

      if (res.success){
            hideLoader();
            res.data.forEach(guest => {
                  const check_out = new Date(guest.check_out).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  const check_in = new Date(guest.check_in).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  const date_book = new Date(guest.date_book).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                  const row = `
                        <tr class="text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 transition py-2">
                              <td class="px-3 py-2 text-center">
                                    <div class="overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${guest.name}
                                    </div>
                              </td> 
                              <td class="px-3 py-2 text-center">
                                    <div class="overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${guest.booking_type === 'Check-in' ? 'Room Stay' : guest.booking_type}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">
                                    <div class="overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${check_in}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center ">
                                    <div class="whitespace-nowrap">    
                                          ${check_out}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">${guest.total_guest}</td>
                        </tr>
                  `;
                  
                  document.querySelector('#upcoming-table2').innerHTML += row;
            });
      }else{
            hideLoader();
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up py-2">
                        <td colspan="6" class="text-center text-gray-800  dark:text-white py-2 ">No data.</td>
                  </tr>
            `;

            document.querySelector('#upcoming-table2').innerHTML += empty_row;
      }
}

async function upcomingCount() {
      const response = await fetch('/upcoming-count');
      const result = await response.json();

      if (result.success){
            if (Number(result.data.checkouts) != 0){
                  document.getElementById('upcoming-checkout-count').classList.add('min-w-[1.25rem]',  'h-5',  'px-1');
                  document.getElementById('upcoming-checkout-count').textContent = `${result.data.checkouts}` ;
            }else{
                  document.getElementById('upcoming-checkout-count').classList.remove('min-w-[1.25rem]',  'h-5',  'px-1');
                  document.getElementById('upcoming-checkout-count').textContent = '';
            }

            if (Number(result.data.arrivals) != 0){
                  document.getElementById('upcoming-arrival-count').classList.add('min-w-[1.25rem]',  'h-5',  'px-1');
                  document.getElementById('upcoming-arrival-count').textContent = `${result.data.arrivals}` ;
            }else{
                  document.getElementById('upcoming-arrival-count').classList.remove('min-w-[1.25rem]',  'h-5',  'px-1');
                  document.getElementById('upcoming-arrival-count').textContent = '';
            }
      }
}

// ---------- Event Listeners ----------------- //
document.addEventListener('click', (e) => {
      // btn click
      if (e.target.closest('#add-booking-btn')) (resetDropDown(), renderAddBookingModal());
      if (e.target.closest('#mark-paid')) renderMarkPaidModal();
      if (e.target.closest('#mark-checkin')) markAsCheckin();
      if (e.target.closest('#mark-checkout')) markAsCheckout();
      if (e.target.closest('#cancel-bookings')) cancelBooking();
      if (e.target.closest('#update-reservation-date')) getReservationDate();
      if (e.target.closest('.tab-item')) {
            const status = getFilterStatus();
            const category = e.target.closest('.tab-item').getAttribute('id'); // now this always works;
            category_data = category;

            fetchByFilterStatus(status);
      }
      
      // icon click 
      if (e.target.closest('#view-full-info')) renderViewReservationDetails(e.target.closest('tr').getAttribute('id'));           
      if (e.target.closest('#update-bookings')) getDataToUpdate(e);
      if (e.target.closest('#close-update-booking')) (savedAccomodations.length = 0, document.querySelector('#update-booking-overlay').remove());
      
      if (e.target.closest('.btn-acc')) showAccomodationAvlForm(e);
      if (e.target.matches('#select-accomodation-avl')) saveAccomodationRoom();

      // span click
      if (e.target.matches('span')){
            if (e.target.closest('#close-details')) document.querySelector('#details-overlay').remove();
            if (e.target.closest('#close-mark-paid')) document.querySelector('#mark-paid-overlay').remove();
            if (e.target.closest('#close-add-booking')) (savedAccomodations.length = 0, document.querySelector('#booking-overlay').remove());
            if (e.target.closest('#close-accomodation-avl')) closeAccomodationRoom();
            if (e.target.closest('#close-reservation-overlay')) document.querySelector('#update-reservation-overlay').remove();
            if (e.target.closest('.remove-btn')) removeAccomodation(e);
            if (e.target.closest('#close-view-upcoming-modal')) document.querySelector('#view-upcoming-modal').remove();
      }

      if (e.target.closest('#select-all-areas')) selectAllRooms();
      if (e.target.closest('#view-upcoming-checkout')) viewUpcomingModal('Upcoming Checkouts', 'checkout');
      if (e.target.closest('#view-upcoming-arrival')) viewUpcomingModal('Upcoming Arrivals', 'arrival');
});

// submit
document.addEventListener('submit', async(e) => {
      if (e.target.matches('#markpaid-form')) submitPayment(e);
      if (e.target.matches('#addBookingForm')) addBooking(e);
      if (e.target.matches('#update-reserved-form')) updateReservationDate(e);
});

// select tags  
document.addEventListener('change', (e) => {
      //if (e.target.closest('#yearSelect')) ( getDays2(), recentBookings(), resetButtonAndCheckBox());
      if (e.target.closest('#yearSelect')) ( getDays2(), recentBookings(getFilterStatus()), resetButtonAndCheckBox());
      if (e.target.closest('#monthSelect')) ( getDays2(), recentBookings(getFilterStatus()), resetButtonAndCheckBox());
      if (e.target.closest('#daySelect3')) (recentBookings(getFilterStatus()), resetButtonAndCheckBox());
      if (e.target.closest('input[name="select"]')) enableActionBtns(e);
      if (e.target.closest('input[name="select"]')) {
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

      if (e.target.closest('#booking_type'))  showAccomodationBasedOnBookingType(e);
      if (e.target.closest('#payment'))  showPaymentDate(e);
      if (e.target.closest('#booking_status'))  showBookingDate(e);
      if (e.target.closest('#upcoming-day'))  upcomingData(e.target.getAttribute('data-section'), e.target.value);

      if (e.target.closest('#dayToggle')) toggleFilter(e.target.getAttribute('id'), 'daySelect3');
});

document.addEventListener('input', (e) => {
      if (e.target.matches('input[name="guest-name"]')) debouncedSearch(e);
      if (e.target.matches('input[name="name"]')){
            e.target.value = e.target.value.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
      }
});

// -------------- Initialiaze when loaded -----------
switchTabs();

export function initPageReservation(){
      recheckDateFilter();
      getYears();
      getMonths();
      getDays2();
      resetDropDown();
      resetButtonAndCheckBox();
      summaryCardsDatas();
      upcomingCount();
}
