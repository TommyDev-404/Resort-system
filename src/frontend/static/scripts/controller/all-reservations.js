
const bookingOverlay = document.getElementById('booking-overlay');
const paid_modal = document.getElementById('mark-paid-overlay');
const tbody = document.getElementById('tbody');

let savedAccomodations = [];
let areaSelected = null;

// ---------------- HELPERS ------------------
function showAccomodationAvlForm(e){
      document.querySelectorAll(`#${e.target.getAttribute('id')}`).forEach(modal => {
            const accOverlay = document.querySelector('#accomodation-avl-overlay');
            accOverlay.classList.remove('hidden');
            document.getElementById('accomodation_label').textContent = `${e.target.textContent} Available's`;
      });
      generateAvlAccomodation(e.target.getAttribute('data-section'));
}

function saveAccomodationRoom(){
      const checked = document.querySelectorAll('input[type="checkbox"]:checked');

      checked.forEach(cb => {
            if (!savedAccomodations.includes(cb.value)) savedAccomodations.push(cb.value);
      });

      document.getElementById('accomodations_data').value = savedAccomodations;
      closeAccomodationRoom();
      accOverlay.classList.add('hidden');
}

function resetCheckedAccomodation(){
      const checked = document.querySelectorAll('input[name="avl"]:checked');
      checked.forEach(cb => {
            cb.checked = false;
            savedAccomodations = savedAccomodations.filter(item => item !== cb.value);
      });
}

function closeAccomodationRoom(){
      document.querySelectorAll('#card').forEach(card => card.remove());

      const accOverlay = document.querySelector('#accomodation-avl-overlay');
      accOverlay.classList.add('hidden');
}

function createTable(id, guest_name, checkin, checkout, stay_count, accomodations, status, payment_status){
      const btn2 = `<button class="bg-red-500 rounded-2xl py-2 px-3 text-white text-[13px]" id="cancel-bookings">✖</button>`;
      const btn3 = `<button class="bg-yellow-400 rounded-2xl py-2 px-3 text-white text-[13px]" id="mark-checkout">➡️</button>`;

      const table_row = `
            <tr class="hover:bg-blue-50 transition-all" id="${id}" data-set="${accomodations}">
                  <td class="px-6 py-4">
                        <div class="font-medium">${guest_name}</div>
                  </td>
                  <td class="px-6 py-4">${checkin} - ${checkout} <span class="text-gray-400 textcursor.execute(''' DELETE FROM accomodation_data WHERE booking_id = %s ''', (id,))
                  -xs">(${stay_count} Nights)</span></td>
                  <td class="px-6 py-4">${accomodations}</td>
                  <td class="px-6 py-4">
                        <span class="px-3 py-1 text-xs rounded-full ${status === 'Reserved' ? 'text-green-700 bg-green-100' : status === 'Cancelled' ? 'text-red-700 bg-red-100' : status === 'Checked-out' ? 'text-secondary-gold bg-yellow-100' : 'text-blue-700 bg-blue-100'}">${status}</span>
                  </td>
                  <td class="px-6 py-4">
                        <span class="px-3 py-1 text-xs rounded-full ${payment_status === 'ZUZU (Online Payment)' ? 'text-green-700 bg-green-100' : payment_status === 'Refunded' ? 'text-red-700 bg-red-100' : payment_status === 'Direct Payment' ? 'text-blue-700 bg-blue-100' : 'text-yellow-700 bg-yellow-100'}">${payment_status}</span>
                  </td>
                  <td class="px-6 py-4">
                        <button class="${status === 'Reserved' ? 'bg-green-500' : payment_status === "Pending" ? 'bg-teal-500' : 'bg-blue-400'} rounded-2xl py-2 px-3 text-white text-[13px]" id="${status  === 'Reserved' ? 'mark-checkin' : payment_status === 'Pending' ? 'mark-paid' : 'view-details'}">${status  === 'Reserved' ? "✔" : payment_status === 'Pending' ? "₱" : "🔍"}</button>
                        ${status === 'Reserved' ? btn2 : status === 'Checked-in' ? btn3 : ''}
                  </td>
            </tr>
      `;

      tbody.innerHTML += table_row;
}


function resetDropDown(){
      document.getElementById('yearSelect').value = new Date().getFullYear();
      document.getElementById('monthSelect').value = new Date().getMonth() + 1;
}

function renderAddBookingModal(){
      avl_spaces();
      const form  = `
            <div class="absolute top-0 left-0 w-full h-full bg-black/30 z-[50]" id="booking-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl max-w-3xl px-6 py-2">
                        <span class="font-semibold text-[25px] flex justify-end cursor-pointer" id="close-add-booking">&times;</span>
                        <form id="addBookingForm" class="flex flex-col gap-2 px-10">
                              <h2 class="font-bold text-2xl text-center">Add Booking</h2>
                              <input type="text" name="name" placeholder="Guest Name" class="border border-gray-300 p-4 rounded-sm mt-[28px]" required>
                              <input type="number" name="total_guest" placeholder="Total  Guest" class="border border-gray-300 p-4 rounded-sm" required>
                              <select id="booking_type" name="inquiry_type" class="border border-gray-300 p-4 rounded-sm" required>
                                    <option value="" selected disabled>Select Inquiry Type</option>
                                    <option value="Reservation">Reservation (Booked in advance)</option>
                                    <option value="Walk-in">Walk-in (No prior booking)</option>
                                    <option value="Day Guest">Day Guest (Swim or Tour only)</option>
                              </select>
                              <select id="payment" name="payment" class="border border-gray-300 p-4 rounded-sm" required>
                                    <option value=""  selected disabled>Select Payment</option>
                                    <option value="Direct Payment">Direct Payment</option>
                                    <option value="ZUZU (Online Payment)">ZUZU (Online Payment)</option>
                                    <option value="Pending">Pending</option>
                              </select> 
                              <input type="hidden" name="accomodations" id="accomodations_data">
                              <div class="bg-gray-50  px-4 py-2 border border-gray-200 rounded-sm h-[270px]">
                                    <label class="font-semibold text-[22px] text-gray-700 text-center">Accomodations: </label>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center hover:bg-blue-500" id="btn" data-section="Premium Villa">Premium Villa (<span id="count-p"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center hover:bg-blue-500" id="btn" data-section="Standard Villa">Standard Villa (<span id="count-s"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center hover:bg-blue-500" id="btn" data-section="Garden View">Garden View (<span id="count-g"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center hover:bg-blue-500" id="btn" data-section="Family Room">Family Room (<span id="count-f"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center hover:bg-blue-500" id="btn" data-section="Barkada Room">Barkada Room (<span id="count-bd"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center hover:bg-blue-500" id="btn" data-section="Cabana Cottage">Cabana Cottage (<span id="count-c"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center  hover:bg-blue-500" id="btn" data-section="Small Cottage">Small Cottage (<span id="count-sm"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center  hover:bg-blue-500" id="btn" data-section="Big Cottage">Big Cottage (<span id="count-b"></span>)</label>
                                          <label class="bg-blue-600 rounded-lg py-2 px-4 text-white text-center  hover:bg-blue-500" id="btn" data-section="Hall">Halls (<span id="count-h"></span>)</label>
                                    </div> 
                              </div> 
                              <label class="text-[15px] text-gray-500">Date (Check-In):</label>
                              <input type="date" name="checkin" placeholder="Check In Date" class="border border-gray-300 p-4 rounded-sm" required>
                              <label class="text-[15px] text-gray-500">Date (Check-Out):</label>
                              <input type="date" name="checkout" placeholder="Check Out Date" class="border border-gray-300 p-4 rounded-sm" required  >
                              <button type="submit" class="bg-primary-blue hover:bg-blue-500 cursor-pointer text-white font-semibold text-[17px] rounded-sm p-[12px] mt-6 mb-4">Submit</button>
                              
                              <div class="absolute top-0 left-0 w-full h-full bg-black/20 z-50 hidden" id="accomodation-avl-overlay">
                                    <div class="relative top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl max-w-[500px] px-6 py-4">
                                          <span class="font-semibold text-[25px] flex justify-end cursor-pointer" id="close-accomodation-avl">&times;</span>
                                          <h2 class="text-gray-500 text-center font-bold text-[20px]" id="accomodation_label">Premium Villa Available's</h2>
                                          <div class="flex flex-col gap-2 mt-4 h-[200px] overflow-y-auto" id="avl-accomodations"></div>
                                          <div class="flex gap-6 justify-between mt-6">
                                                <label class="bg-gray-200 border border-gray-300 hover:bg-gray-400 hover:text-white rounded-sm py-2 px-[40px]" id="reset-accomodation-avl">Reset</label>
                                                <label class="bg-primary-blue hover:bg-blue-500 rounded-sm text-white py-2 px-[50px]" id="select-accomodation-avl">Save Changes</label>
                                          </div>
                                    </div>
                              </div>
                        </form>
                  </div>
            </div>
            <div class="accomodationPortal"></div>
      `;

      document.getElementById('reservationPortal').innerHTML += form; 
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
            const p = `<label class="bg-gray-50 p-2 rounded-lg text-center border border-gray-200 hover:bg-green-200" id="card"><input type="checkbox" name="avl" value="${accomodation} ${rooms[i]}" required> ${accomodation} ${rooms[i]}</label>`
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

async function markAsCheckin(id){
      const response = await fetch(`/mark-checkin/${id}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            totalCheckin();
            recentBookings();
      }else{
            alert(result.message);
      }
}

async function markAsCheckout(id, accomodations){
      const response = await fetch(`/mark-checkout?id=${id}&accomodation=${accomodations}`,{
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            paid_modal.classList.add('hidden');
            recentBookings();
            todayCheckouts();
      }else{
            alert(result.message);
      }
}

async function cancelBooking(id, accomodations){
      const response = await fetch(`/cancel-booking?id=${id}&accomodation=${accomodations}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'} 
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            paid_modal.classList.add('hidden');
            recentBookings();
            totalCancelled();
            totalCheckin();
            upcomingArrivals();
      }else{
            alert(result.message);
      }
}

async function submitPayment(e){
      e.preventDefault();
      const select = document.getElementById('mark-payment').value;
      const id =  document.getElementById('mark-paid').closest('tr').getAttribute('id');

      const response = await fetch(`/mark-paid?id=${id}&payment=${select}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            document.querySelector('#mark-paid-overlay').remove();
            recentBookings();
      }else{
            alert(result.message);
      }
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
                  saveAccomodationRoom.length =  0; // empty the array
            }else{
                  alert(result.message);
                  recentBookings();
            }
      }catch(err){
            console.log(err);
      }
}


// ---------- Event Listeners ----------------- //
document.addEventListener('click', (e) => {
      // btn click
      if (e.target.matches('button')){
            if (e.target.closest('#add-booking-btn')) renderAddBookingModal();
            if (e.target.closest('#mark-paid')) renderMarkPaidModal();
            if (e.target.closest('#mark-checkin')) markAsCheckin(e.target.closest('tr').getAttribute('id'));
            if (e.target.closest('#mark-checkout')) markAsCheckout(e.target.closest('tr').getAttribute('id'), e.target.closest('tr').getAttribute('data-set'));
            if (e.target.closest('#cancel-bookings')) cancelBooking(e.target.closest('tr').getAttribute('id'), e.target.closest('tr').getAttribute('data-set'));
            if (e.target.closest('#view-details')) renderViewReservationDetails(e.target.closest('tr').getAttribute('id'));           
      }

      // label click
      if (e.target.matches('label')){
            if (e.target.closest('#btn')) showAccomodationAvlForm(e);
            if (e.target.closest('#select-accomodation-avl')) saveAccomodationRoom();
            if (e.target.closest('#reset-accomodation-avl')) resetCheckedAccomodation();
      }

      // span click
      if (e.target.matches('span')){
            if (e.target.closest('#close-details')) document.querySelector('#details-overlay').remove();
            if (e.target.closest('#close-mark-paid')) document.querySelector('#mark-paid-overlay').remove();
            if (e.target.closest('#close-add-booking')) document.querySelector('#booking-overlay').remove();
            if (e.target.closest('#close-accomodation-avl')) closeAccomodationRoom();
      }
});

// submit
document.addEventListener('submit', async(e) => {
      if (e.target.matches('#markpaid-form')) submitPayment(e);
      if (e.target.matches('#addBookingForm')) addBooking(e);
});

// select tags  
document.addEventListener('change', (e) => {
      if (e.target.matches('#yearSelect')) recentBookings();
      if (e.target.matches('#monthSelect')) recentBookings();
});

// -------------- Initialiaze when loaded -----------
getYears();

export function initPageReservation(){
      resetDropDown();
      todayCheckouts();
      totalCheckin();
      currentBookings();
      totalCancelled();
      upcomingArrivals();
}

