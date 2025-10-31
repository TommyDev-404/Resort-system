
const bookingOverlay = document.getElementById('booking-overlay');
const paid_modal = document.getElementById('mark-paid-overlay');
const tbody = document.getElementById('tbody');
const selectedContainer = document.querySelector("#selected-accomodations");
const hiddenInput = document.querySelector("input[name='accomodations_selected']");

let savedAccomodations = [];
let ids = null;
let type = 'add';


// ---------------- HELPERS ------------------
function showAccomodationAvlForm(e){
      const accOverlay = document.querySelector('.accomodation-avl-overlay');
      accOverlay.classList.remove('hidden');

      document.getElementById('accomodation_label').textContent = `${e.target.textContent} Available's`;
      generateAvlAccomodation(e.target.getAttribute('data-section'));
}

function saveAccomodationRoom(){
      const checked = document.querySelectorAll('input[type="checkbox"]:checked');

      checked.forEach(cb => {
            if (!savedAccomodations.includes(cb.value)) savedAccomodations.push(cb.value);

            const tag = `<label class="h-10 bg-green-500 hover:bg-green-600 px-2 py-1 rounded-lg inline-flex justify-between items-center gap-2 text-white text-sm font-medium shadow-sm transition" id="${cb.value.split(' ')[0]}"> ${cb.value} <span class="remove-btn text-lg font-bold cursor-pointer" data-acc="${cb.value}">&times;</span></label>`;
            document.querySelector("#selected-accomodations").innerHTML += tag;
      });

      document.querySelector('input[name="accomodations_selected"]').value = savedAccomodations;
      closeAccomodationRoom();
}

function resetCheckedAccomodation(){
      const checked = document.querySelectorAll('input[name="avl"]:checked');
      checked.forEach(cb => {
            cb.checked = false;
            savedAccomodations = savedAccomodations.filter(item => item !== cb.value);
      });
      
      document.querySelector('input[name="accomodations_selected"]').value = savedAccomodations;
}

function closeAccomodationRoom(){
      document.querySelectorAll('#card').forEach(card => card.remove());
      document.querySelector('.accomodation-avl-overlay').classList.add('hidden');
}

function createTable(id, guest_name, checkin, checkout, stay_count, accomodations, status, payment_status){
      const row = `
            <tr class="text-[16px] hover:bg-blue-50 transition text-gray-600" id="${id}" data-set="${accomodations}">
                  <td class="px-3 py-4"><input type="checkbox" name="select" class="w-6 h-5"></td>
                  <td class="px-4 py-4"><span class="font-medium">${guest_name}</span></td>
                  <td class="px-4 py-4"><span>${checkin} - ${checkout} <label class="text-gray-400 text-sm">(${stay_count} Nights)</label></span></td>
                  <td class="px-6 py-4"><span>${accomodations}</span></td>
                  <td class="px-5 py-4 text-blue-600 font-semibold text-[14px]"><span class="px-3 py-1 text-xs rounded-full ${status === 'Reserved' ? 'text-green-700 bg-green-100' : status === 'Cancelled' ? 'text-red-700 bg-red-100' : status === 'Checked-out' ? 'text-secondary-gold bg-yellow-100' : 'text-blue-700 bg-blue-100'}">${status}</span></td>
                  <td class="px-5 py-4 text-yellow-600 font-semibold text-[14px]"><span class="px-3 py-1 text-xs rounded-full ${payment_status === 'ZUZU (Online Payment)' ? 'text-green-700 bg-green-100' : payment_status === 'Refunded' ? 'text-red-700 bg-red-100' : payment_status === 'Direct Payment' ? 'text-blue-700 bg-blue-100' : 'text-yellow-700 bg-yellow-100'}">${payment_status}</span></td>
                  <td class="px-4 py-4 flex justify-center gap-2">
                        <button  id="view-full-info"><i class="ti ti-eye text-lg text-white bg-purple-700 px-2 py-1.5 rounded-lg"></i></button>
                  </td>
            </tr>
      `;

      tbody.innerHTML += row;
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
                        t.classList.remove("text-blue-500", "border-blue-500");
                        t.classList.add("text-gray-600", "border-gray-300");
                        
                        const badge = t.querySelector("span");
                        if (badge) {
                        badge.classList.remove("text-blue-600", "bg-blue-50");
                        badge.classList.add("text-gray-500", "bg-gray-100");
                        }
                  });

                  // Activate the clicked tab
                  tab.classList.add("text-blue-500", "border-blue-500");
                  tab.classList.remove("text-gray-600", "border-gray-300");
            });
      });
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
            const status = tr.querySelectorAll('td')[4].textContent.trim();
            const payment = tr.querySelectorAll('td')[5].textContent.trim();

            // --- Apply your conditions
            allBtns.forEach(btn => {
                  if (payment !== 'Pending') {
                        if (status === 'Checked-in' && btn.getAttribute('id') === 'mark-checkout') {
                              btn.style.opacity = '1';
                              btn.style.pointerEvents = 'auto';
                        }
                        if (status === 'Reserved' && btn.getAttribute('id') !== 'mark-checkout' && btn.getAttribute('id') !== 'mark-paid') {
                              btn.style.opacity = '1';
                              btn.style.pointerEvents = 'auto';
                        }
                  } else {
                        if (status === 'Checked-in' && (btn.getAttribute('id') === 'mark-checkout' || btn.getAttribute('id') === 'mark-paid')) {
                              btn.style.opacity = '1';
                              btn.style.pointerEvents = 'auto';
                        }
                        if (status === 'Reserved' && btn.getAttribute('id') !== 'mark-checkout') {
                              btn.style.opacity = '1';
                              btn.style.pointerEvents = 'auto';
                        }
                  }
            });
      }
}

function removeAccomodation(e){
      const acc = e.target.dataset.acc;
      const index = savedAccomodations.indexOf(acc);
      
      if (index > -1) {
            savedAccomodations.splice(index, 1);
      }
      
      document.querySelector(`#${acc.split(' ')[0]}`).remove();
      document.querySelector('input[name="accomodations_selected"]').value = savedAccomodations;
}

function renderAddBookingModal(){
      avl_spaces();
      type = 'add';
      const form  = `
            <div id="booking-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white rounded-2xl shadow-2xl w-[95%] max-w-3xl relative p-8">
                        <span id="close-add-booking" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light cursor-pointer">&times;</span>
                        <div class="text-center mb-6">
                              <h2 class="text-xl font-bold text-gray-700">Add Booking</h2>
                              <p class="text-gray-500 text-sm">Fill out guest details and choose accommodations below.</p>
                        </div>
                        <form id="addBookingForm" class="flex flex-col gap-6">
                              <section>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <input type="text" name="name" placeholder="Guest Name" class="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                          <input type="number" name="total_guest" placeholder="Total Guests" min="1" class="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                    </div>
                              </section>
            
                              <section>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <select id="booking_type" name="inquiry_type" class="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                                <option value="" selected disabled>Select Inquiry Type</option>
                                                <option value="Reservation">Reservation (Booked in advance)</option>
                                                <option value="Walk-in">Walk-in (No prior booking)</option>
                                                <option value="Day Guest">Day Guest (Swim or Tour only)</option>
                                          </select>
            
                                          <select id="payment" name="payment" class="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all"required>
                                                <option value="" selected disabled>Select Payment Method</option>
                                                <option value="Direct Payment">Direct Payment</option>
                                                <option value="ZUZU (Online Payment)">ZUZU (Online Payment)</option>
                                                <option value="Pending">Pending</option>
                                          </select>
                                    </div>
                              </section>
            
                              <section>
                                    <h3 class="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 text-center">Select Accommodations</h3>
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
                                          <label class="text-gray-600 block mb-1 font-medium">Selected Accommodations:</label>
                                          <div id="selected-accomodations" class="grid grid-cols-4 gap-2 border border-gray-200 rounded-md p-3 bg-gray-50 h-30 overflow-y-auto"></div>
                                          <input type="hidden" name="accomodations_selected">
                                    </div>
                              </section>
            
                              <section>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <div>
                                                <label class="text-gray-600 text-sm mb-1 block">Check-In Date</label>
                                                <input type="date" name="checkin" class="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                          </div>
                                          <div>
                                                <label class="text-gray-600 text-sm mb-1 block">Check-Out Date</label>
                                                <input type="date" name="checkout" class="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                                          </div>
                                    </div>
                              </section>
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md py-3 rounded-md transition-all mt-2">Submit</button>
                        </form>
                  </div>

                  <div class="accomodation-avl-overlay fixed inset-0 bg-black/40 flex items-center justify-center z-50 hidden">
                        <div class="bg-white rounded-xl shadow-xl p-6 w-[500px] relative">
                              <span class="absolute right-3 top-1 text-[25px] cursor-pointer" id="close-accomodation-avl">&times;</span>
                              <h2 class="text-lg font-semibold text-gray-700 text-center" id="accomodation_label">Premium Villa Rooms</h2>
                              <div class="flex flex-col gap-2 mt-4 h-[200px] overflow-y-auto" id="avl-accomodations"></div>
                              <div class="flex gap-6 justify-between mt-6">
                                    <label class="bg-primary-blue hover:bg-blue-500 rounded-sm text-white py-2 px-[50px] w-full text-center" id="select-accomodation-avl">Select</label>
                              </div>
                        </div>
                  </div>
            </div>
      `;

      document.getElementById('reservationPortal').innerHTML += form; 
}

function renderEditReservedModal(id, check_in, check_out){
      const modal = `
            <div class="fixed top-0 left-0 w-full h-full bg-black/20 z-50" id="update-reservation-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl max-w-[500px] px-6 py-4">
                        <span class="font-semibold text-[25px] flex justify-end cursor-pointer" id="close-reservation-overlay">&times;</span>
                        <h2 class="text-gray-500 text-center font-bold text-[20px]">Update Reservation Date</h2>
                        <form id="update-reserved-form">
                              <div class="flex flex-col gap-6 mt-2">
                                    <input type="hidden" name="id" value="${id}">
                                    <div class="flex flex-col gap1">
                                          Edit Check-In:
                                          <input type="date" name="edit_checkin" class="border border-gray-300 p-4 rounded-sm" value="${check_in}">
                                    </div>
                                    <div class="flex flex-col gap1">
                                          Edit Check-out:
                                          <input type="date" name="edit_checkout" class="border border-gray-300 p-4 rounded-sm" value="${check_out}">
                                    </div>
                                    <button type="submit" class="bg-primary-blue hover:bg-blue-500 rounded-sm text-white py-2 px-[50px] text-center">Update</button>      
                              </div>
                        </form>
                  </div>
            </div>
      `;
      
      document.getElementById('reservationPortal').innerHTML += modal; 
}

function renderMarkPaidModal(){
      const modal = `
            <div class="fixed top-0 left-0 w-full h-full bg-black/20 z-50" id="mark-paid-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl max-w-[500px] px-6 py-4">
                        <span class="font-semibold text-[25px] flex justify-end cursor-pointer" id="close-mark-paid">&times;</span>
                        <h2 class="text-gray-500 text-center font-bold text-[20px]">Payment</h2>
                        <form id="markpaid-form">
                              <div class="flex flex-col gap-6 mt-2">
                                    <select id="mark-payment" class="border border-gray-300 p-4 rounded-sm" required>
                                          <option value=""  selected disabled>Select Payment</option>
                                          <option value="Direct Payment">Direct Payment</option>
                                          <option value="ZUZU (Online Payment)">ZUZU (Online Payment)</option>
                                          <option value="Pending">Pending</option>
                                    </select> 
                                    <button type="submit" class="bg-primary-blue hover:bg-blue-500 rounded-sm text-white py-2 px-[50px] text-center">Done</button>      
                              </div>
                        </form>
                  </div>
            </div>
      `;
      
      document.getElementById('reservationPortal').innerHTML += modal; 
}


// --------------- Data Fetching --------------
async function renderViewReservationDetails(id){
      const response = await fetch(`/view-details/${id}`);
      const result = await response.json();
      console.log(result);
      if (result.success){
            const check_in = new Date(result.data.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
            const check_out = new Date(result.data.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});

            const modal = `
                  <div class="fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-sm z-50" id="details-overlay">
                        <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-lg shadow-2xl max-w-[680px] px-[50px] py-6">
                              <span id="close-details" class="font-semibold text-[25px] cursor-pointer fixed top-[1%] left-[94.5%] text-gray-400 hover:text-gray-600 transition">&times;</span>
                              <div class="max-h-auto">
                                    <h2 class="text-gray-700 text-center font-bold text-[20px] mb-4">Guest Details</h2>
                                    <div class="flex flex-col gap-1 mt-4">
                                          Name:
                                          <label id="name" class="font-semibold text-[17px] text-gray-800 bg-gray-50 border border-gray-200 rounded-sm p-2">${result.data.name}</label>
                                          Check-in:
                                          <label id="check-in" class="font-medium text-[17px] text-blue-700 bg-blue-50 border border-blue-100 rounded-sm p-2">${check_in}</label>
                                          Check-out:
                                          <label id="check-out" class="font-medium text-[17px] text-blue-700 bg-blue-50 border border-blue-100 rounded-sm p-2">${check_out}</label>
                                          Accomodations:
                                          <label id="accomodations" class="font-medium text-[17px] text-gray-800 bg-gray-50 border border-gray-200 rounded-sm p-2">${result.data.accomodations}</label>
                                          Total Guest:
                                          <label id="total" class="font-medium text-[17px] text-gray-800 bg-gray-50 border border-gray-200 rounded-sm p-2">${result.data.total_guest}</label>
                                          Booking Type:
                                          <label id="booking" class="font-medium text-[17px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-sm p-2">${result.data.booking_type}</label>
                                          Status:
                                          <label id="status" class="font-medium text-[17px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-sm p-2">${result.data.status}</label>
                                          Payment:
                                          <label id="payment_t" class="font-medium text-[17px] text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-sm p-2">${result.data.payment}</label>
                                          Total Paid:
                                          <label id="paid-amount" class="font-medium text-[17px] text-teal-700 bg-teal-50 border border-teal-100 rounded-sm p-2">${result.data.total_amount}</label>
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

async function generateAvlAccomodation(accomodation){
      let room_name = accomodation.split(' ');

      const response = await fetch(`/avl-rooms?room_name=${room_name[0]}`);
      const result = await response.json();
      const rooms = result.rooms;

      for (let i = 0; i < rooms.length; i++){
            const p = `<label class="bg-gray-50 p-2 rounded-lg text-center border border-gray-200 hover:bg-green-200" id="card"><input type="checkbox" name="avl" value="${accomodation} ${rooms[i]}" required> ${accomodation} ${rooms[i]}</label>`;
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

      const response = await fetch(`/recent-bookings?year=${year}&month=${month}`);
      const result = await response.json();

      if (result.success){
            document.querySelectorAll('tbody tr').forEach(row => row.remove());      
            result.data.forEach(row => {
                  createTable(row['id'], row['name'], row['checkin'], row['checkout'], row['stay'], row['accomodations'], row['status'], row['payment']);
            });
      }else {
            console.log('here');
            document.querySelectorAll('tbody tr').forEach(row => row.remove());
            const empty_row = `
                  <tr class="hover:bg-blue-50 transition-all">
                        <td colspan="6" class="text-center  text-gray-600 py-3 bg-gray-50">No bookings.</td>
                  </tr>
            `;
            
            tbody.innerHTML += empty_row;
      }
}

async function currentBookings(){
      const response = await fetch(`/current-bookings`);
      const result = await response.json();

      if (result.success){
            document.querySelectorAll('tbody tr').forEach(row => row.remove());      
            result.data.forEach(row => {
                  createTable(row['id'], row['name'], row['checkin'], row['checkout'], row['stay'], row['accomodations'], row['status'], row['payment']);
            });
      }else {
            console.log('here');
            document.querySelectorAll('tbody tr').forEach(row => row.remove());
            const empty_row = `
                  <tr class="hover:bg-blue-50 transition-all">
                        <td colspan="6" class="text-center  text-gray-600 py-3 bg-gray-50">No bookings.</td>
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

async function todayCheckouts(){
      const response = await fetch('/today-checkouts');
      const result = await response.json();
      document.getElementById('today_checkouts').textContent = result.today_checkouts;
}

async function totalCancelled(){
      const response = await fetch('/cancelled-bookings');
      const result = await response.json();
      document.getElementById('cancelled').textContent = result.cancelled;
}

async function totalCheckin(){
      const response = await fetch('/total-checkins');
      const result = await response.json();
      document.getElementById('total_checkin').textContent = result.total_checkins;
      document.getElementById('change_checkins').textContent = result.change >= 0 ? `+${result.change}` : `${result.change}`;
}

async function upcomingArrivals(){
      const response = await fetch('/upcoming-arrivals');
      const result = await response.json();
      document.getElementById('upcoming_arrivals').textContent = result.upcoming_checkin;
}

async function markAsCheckin(){
      const checkedBoxes = document.querySelectorAll('input[name="select"]:checked');
      let id = null;

      checkedBoxes.forEach(box => {
            const tr = box.closest('tr'); // get the parent row
            if(tr.getAttribute('id') !== null && tr.getAttribute('data-set') !== null){
                  id = tr.getAttribute('id');
            }
      });

      const response = await fetch(`/mark-checkin/${id}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            totalCheckin();
            recentBookings();
            resetButtonAndCheckBox();
      }else{
            alert(result.message);
      }
      
      getTotalsCountData();
}

async function markAsCheckout(){
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

      const response = await fetch(`/mark-checkout?id=${id}&accomodation=${accommodations}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            recentBookings();
            todayCheckouts();
            resetButtonAndCheckBox();
      }else{
            alert(result.message);
      }
      
      getTotalsCountData();
}

async function cancelBooking(){
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

      const response = await fetch(`/cancel-booking?id=${id}&accomodation=${accommodations}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'} 
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            recentBookings();
            totalCancelled();
            totalCheckin();
            upcomingArrivals();
            resetButtonAndCheckBox();
      }else{
            alert(result.message);
      }
      
      getTotalsCountData();
}

async function getDataToUpdate(e) {
      const id = e.target.closest('tr').getAttribute('id');
      
      const response = await fetch(`/get-data-to-update?id=${id}`);
      const result = await response.json();

      if (result.success){
            const check_in = new Date(result.checkin).toISOString().split('T')[0];
            const check_out = new Date(result.checkout).toISOString().split('T')[0];
            let accomodations = result.accomodations.split(',');
            accomodations.forEach(acc => savedAccomodations.push(acc));

            renderUpdateBookingModal(id, check_in, check_out, result.accomodations);
      }else{
            alert('Failed');
      }
}

async function submitPayment(e){
      e.preventDefault();
      const select = document.getElementById('mark-payment').value;
      const checkedBoxes = document.querySelectorAll('input[name="select"]:checked');
      let id = null;

      checkedBoxes.forEach(box => {
            const tr = box.closest('tr'); // get the parent row
            if(tr.getAttribute('id') !== null && tr.getAttribute('data-set') !== null){
                  id = tr.getAttribute('id');
            }
      });

      const response = await fetch(`/mark-paid?id=${id}&payment=${select}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            document.querySelector('#mark-paid-overlay').remove();
            recentBookings();
            resetButtonAndCheckBox();
      }else{
            alert(result.message);
      }
      
      getTotalsCountData();
}

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
                  alert(result.message);
                  document.querySelector('#booking-overlay').remove();
                  recentBookings();
                  totalCheckin();
                  upcomingArrivals();
                  savedAccomodations.length =  0; // empty the array
            }else{
                  alert(result.message);
                  recentBookings();
            }
            
            getTotalsCountData();
      }catch(err){
            console.log(err);
      }
}

async function getReservationDate(){
      const checkedBoxes = document.querySelectorAll('input[name="select"]:checked');
      let id = null;

      checkedBoxes.forEach(box => {
            const tr = box.closest('tr'); // get the parent row
            if(tr.getAttribute('id') !== null && tr.getAttribute('data-set') !== null){
                  id = tr.getAttribute('id');
            }
      });

      const response = await fetch(`/get-reservation-date?id=${id}`);
      const result = await response.json();
      
      const formatCheckin = new Date(result.check_in).toISOString().split('T')[0];
      const formatCheckout = new Date(result.check_out).toISOString().split('T')[0];

      renderEditReservedModal(id, formatCheckin, formatCheckout); 
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
            alert(result.message);
            document.querySelector('#update-reservation-overlay').remove();
            recentBookings();
            resetButtonAndCheckBox();
      }else {
            alert(result.message);
            document.querySelector('#update-reservation-overlay').remove();
      }
      
      getTotalsCountData();
}

async function getTotalsCountData() {
      const response = await fetch(`/totals`);
      const result = await response.json();
      console.log(result);
      if (result.success){
            document.getElementById('all').querySelector('span').textContent = `+${result.all}`;
            document.getElementById('reserved').querySelector('span').textContent = `+${result.reserved}`;
            document.getElementById('check_out').querySelector('span').textContent = `+${result.checkout}`;
            document.getElementById('check_in').querySelector('span').textContent = `+${result.checkin}`;
            document.getElementById('cancelled-reservation').querySelector('span').textContent = `+${result.cancelled}`;
            document.getElementById('paid').querySelector('span').textContent = `+${result.paid}`;
            document.getElementById('not_paid').querySelector('span').textContent = `+${result.not_paid}`;
      }else{
            alert('Failed');
      }
}

async function bookingsCategories(e){
      const category = e.target.getAttribute('id');
      const year = document.getElementById('yearSelect').value;
      const month = document.getElementById('monthSelect').value;
      
      const response = await fetch(`/category-bookings?year=${year}&month=${month}&category=${category}`);
      const result = await response.json();

      if (result.success){
            document.querySelectorAll('tbody tr').forEach(row => row.remove());      
            result.data.forEach(row => {
                  createTable(row['id'], row['name'], row['checkin'], row['checkout'], row['stay'], row['accomodations'], row['status'], row['payment']);
            });
      }else {
            console.log('here');
            document.querySelectorAll('tbody tr').forEach(row => row.remove());
            const empty_row = `
                  <tr class="hover:bg-blue-50 transition-all">
                        <td colspan="6" class="text-center  text-gray-600 py-3 bg-gray-50">No data.</td>
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
            if (e.target.closest('#reset-accomodation-avl')) resetCheckedAccomodation();
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
});


// -------------- Initialiaze when loaded -----------
getYears();
switchTabs();
getTotalsCountData();

export function initPageReservation(){
      getTotalsCountData();
      resetDropDown();
      todayCheckouts();
      totalCheckin();
      currentBookings();
      totalCancelled();
      upcomingArrivals();
}


let occupancyChart = null;
let heavyMonthChart = null;
let occupancyChartHistorical = null;

      // --------------------------- HELPER ------------------------
async function drawOccupancyForecastChart() {
      const response = await fetch('/occupancy-forecast', { method: "GET" });
      const result = await response.json();
      
      const ctx = document.getElementById('occupancyChartForecast').getContext('2d');

      // Convert dates to ISO internally
      const forecastedDatesISO = result.forecasted.date.map(d => new Date(d).toISOString().split('T')[0]);

      // Merge all dates and values
      const allDatesISO = forecastedDatesISO.slice(0, 30);
      const forecastValues = result.forecasted.value.slice(0, 30);

      // Format labels for display: "Oct 10"
      const displayLabels = allDatesISO.map(d => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
      });
      
      if (occupancyChart) occupancyChart.destroy();

      occupancyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels: displayLabels,
                  datasets: [
                  {
                        label: 'Forecasted Occupancy(%) ',
                        data: forecastValues,
                        borderColor: '#e2280fff',  // Green
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                  }
                  ]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                  y: {
                        min: 0,
                        max: 100,
                        title: { display: true, text: 'Occupancy %', color: '#555' },
                        grid: { color: '#eee' }
                  },
                  x: {
                        ticks: { maxTicksLimit: 15, autoSkip: true },
                        grid: { display: false }
                  }
                  },
                  plugins: {
                  legend: { display: true },
                  tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                              label: function (context) {
                              // Show ISO date in tooltip
                              const isoDate = allDatesISO[context.dataIndex];
                              return `${context.dataset.label}: ${context.parsed.y ?? '-'}%`;
                              }
                        }
                  }
                  },
            }
      });
}


async function drawOccupancyHistoricalChart() {
      const response = await fetch('/occupancy-forecast', { method: "GET" });
      const result = await response.json();
      
      const ctx = document.getElementById('occupancyChartHistorical').getContext('2d');

      // Convert dates to ISO internally
      const historicalDatesISO = result.historical.date.map(d => new Date(d).toISOString().split('T')[0]);

      // Merge all dates and values
      const allDatesISO = historicalDatesISO;
      const historicalValues = result.historical.value.concat(new Array(result.forecasted.value.length).fill(null));

      // Format labels for display: "Oct 10"
      const displayLabels = allDatesISO.map(d => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
      });
      
      if (occupancyChartHistorical) occupancyChartHistorical.destroy();

      occupancyChartHistorical = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels: displayLabels,
                  datasets: [
                  {
                        label: 'Historical Occupancy (%) ',
                        data: historicalValues,
                        borderColor: '#0aeb30ff',  // Blue
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                  }
            ]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                  y: {
                        min: 0,
                        max: 100,
                        title: { display: true, text: 'Occupancy %', color: '#555' },
                        grid: { color: '#eee' }
                  },
                  x: {
                        ticks: { maxTicksLimit: 15, autoSkip: true },
                        grid: { display: false }
                  }
                  },
                  plugins: {
                  legend: { display: true },
                  tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                              label: function (context) {
                              // Show ISO date in tooltip
                              const isoDate = allDatesISO[context.dataIndex];
                              return `${context.dataset.label}: ${context.parsed.y ?? '-'}%`;
                              }
                        }
                  }
                  },
            }
      });
}


function displayAlert(res, type){
      if (type === 'occupancy'){
            const alert_card = document.getElementById('alertToast');
            alert_card.classList.remove('hidden');
      
            document.getElementById('alertMessage').textContent = res.message;
            document.getElementById('data').textContent = `Average Occupancy Percentage: ${res.data}%`;      
      }else{
            const alert_card = document.getElementById('alertHousekeeping');
            alert_card.classList.remove('hidden');
      
            document.getElementById('alertMessage2').textContent = res.message;
      }
}

function loadingAnimation(){
      const load = `
            <div id="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center h-screen inset-0 bg-black/50 text-white space-y-2">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse">Loading, please wait...</p>
            </div>
      `;      

      document.getElementById('adminModalPortal').innerHTML += load;
}

async function drawHeavyMonthChart() {
      const response = await fetch('/heavy-guest-month', { method: "GET" });
      const result = await response.json();
      const ctx = document.getElementById('heavy-month-chart').getContext('2d');
  
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const values = result.value;
  
      // Modern muted colors for each month
      const colors = [
          '#4F46E5', '#3B82F6', '#0EA5E9', '#14B8A6', '#22C55E', 
          '#84CC16', '#FACC15', '#F97316', '#EF4444', '#E11D48', 
          '#8B5CF6', '#6366F1'
      ];
  
      // Highlight peak month slightly brighter
      const maxGuests = Math.max(...values);
      const backgroundColors = values.map((v, i) => v === maxGuests ? '#FBBF24' : colors[i]);
  
      if (heavyMonthChart) heavyMonthChart.destroy();
  
      heavyMonthChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: labels,
              datasets: [{
                  data: values,
                  backgroundColor: backgroundColors,
                  hoverOffset: 12,
                  borderWidth: 0, // remove borders for modern flat look
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '25%', // smaller center hole
              plugins: {
                  legend: {
                      position: 'bottom',
                      labels: {
                          color: '#374151', // gray-700
                          boxWidth: 14,
                          padding: 12,
                          font: { size: 12, weight: '500' },
                      }
                  },
                  tooltip: {
                      backgroundColor: '#111827',
                      titleColor: '#FBBF24',
                      bodyColor: '#F9FAFB',
                      borderColor: '#374151',
                      borderWidth: 1,
                      padding: 8,
                      callbacks: {
                          label: function(context) {
                              return `${context.label}: ${context.parsed.toLocaleString()} Guests`;
                          }
                      }
                  }
              }
          }
      });
  }
  

async function totalGuestInHouse() {
      // total guest in house
      const response = await fetch('/total-guest-in-house', {method: "GET"});
      const res = await response.json();

      document.getElementById('total-guest-in-house').textContent = res.today;
      document.getElementById('change-rate-guest').textContent = res.change > 0 ? `+${res.change}` : `${res.change}`;
}

async function todayGuest() {
      // total guest in house
      const response = await fetch('/today-guest', {method: "GET"});
      const res = await response.json();

      document.getElementById('today-guest').textContent = res.today_guest;
      document.getElementById('change-rate-today-guest').textContent = res.change > 0 ? `+${res.change}` : `${res.change}`;
}

async function todayCheckin() {
      // total check in
      const response = await fetch('/today-checkin', {method: "GET"});
      const res = await response.json();
      document.getElementById('check-ins-data').textContent = res.check_in;
      document.getElementById('change-rate-checkin').textContent = Number(res.change) < 0  || Number(res.change) == 0 ? `${res.change}` : `+${res.change}`;
}

async function todayOccupancy() {
      // Current occupancy
      const response = await fetch('/occupancy', {method: "GET"});
      const res = await response.json();

      document.getElementById('occupancy-rate').textContent = `${res.occupancy}%`;
      document.getElementById('total-room').textContent = res.total_room;
}

async function todayProjectedRevenue(){
      // revenue
      const response = await fetch('/revenue', {method: "GET"});
      const res = await response.json();
      
      document.getElementById('total-revenue').textContent = `₱${res.current_revenue}`;
      document.getElementById('target-revenue').textContent = Number(res.change) > 0 ? `+${res.change}%` : `${res.change}%`;
}

async function alertOccupancy() {
      const response = await fetch('/occupancy-alert', {method: "GET"});
      const res = await response.json();

      if (res.message != null){
            displayAlert(res, 'occupancy');
      }
}

async function alertHousekeeping() {
      const response = await fetch('/housekeeping-alert', {method: "GET"});
      const res = await response.json();
      
      if (res.message != null){
            displayAlert(res, 'housekeeping');
      }
}

document.addEventListener('click', (e) => {
      if (e.target.matches('#closeAlert')) document.getElementById('alertToast').classList.add('hidden');
      if (e.target.matches('#closeAlertHousekeeping')) document.getElementById('alertHousekeeping').classList.add('hidden');
});

loadingAnimation();
setTimeout(() => {
      alertOccupancy();
      alertHousekeeping();
      todayGuest();
      todayCheckin();
      totalGuestInHouse();
      todayOccupancy();
      todayProjectedRevenue();
      drawHeavyMonthChart();
      drawOccupancyForecastChart();
      drawOccupancyHistoricalChart();
      document.querySelector('#loading').remove();
}, 1000);

// Initial load: ensure the default content is shown and charts are drawn
export function initPageDashboard() {
      alertOccupancy();
      alertHousekeeping();
      todayGuest();
      todayCheckin();
      totalGuestInHouse();
      todayOccupancy();
      todayProjectedRevenue();
      drawHeavyMonthChart();
      drawOccupancyForecastChart();
      drawOccupancyHistoricalChart();
};
