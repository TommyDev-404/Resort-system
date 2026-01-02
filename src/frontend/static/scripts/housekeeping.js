import { notifications } from "./home-dashboard.js";

// -------------------- HELPERS ------------------------- //
function successMessageCard7(message, redirect = null) {
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-50" id="success-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4  fade-in-up">
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

function failedMessageCard7(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-50" id="failed-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4  fade-in-up">
                        <i data-lucide="circle-x" class="w-15 h-15 text-center font-bold text-red-500"></i>
                        <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600 px-6 py-2" id="close-failed-message">Okay</button>
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

function createRowData(acc_name, acc_count, need_clean, on_clean, ready, occupied, reserved){
      const row = `
            <tr data-room="${acc_name}" class="fade-in-up border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5">
                  <td class="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">${acc_name}</td>
                  <td class="px-6 py-4 text-gray-800 dark:text-gray-100">${acc_count}</td>
                  <td class="px-6 py-4 ${Number(need_clean) > 0 ? 'text-red-600' : 'text-blue-600'} dark:text-gray-blue-500 font-bold">${need_clean}</td>
                  <td class="px-6 py-4 text-yellow-600 dark:text-gray-yellow-500 font-bold">${on_clean}</td>
                  <td class="px-6 py-4 text-green-600  dark:text-green-500 font-bold">${ready}</td>
                  <td class="px-6 py-4 text-emerald-600  dark:text-emerald-500 font-bold">${reserved}</td>
                  <td class="px-6 py-4 text-rose-600 dark:text-rose-500 font-bold">${occupied}</td>
                  <td class="px-6 py-4 flex justify-center">
                        <button class="px-4 py-2 text-sm bg-primary-blue dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex gap-2 items-center" id="view-room-details"><i data-lucide="building" class="text-lg"></i>View Rooms</button>
                  </td>
            </tr>
      `;

      document.querySelector('#room-status-tbody').innerHTML += row;
      lucide.createIcons();
}

function createRowDataHistory(room, acc_name, date, status){
      let new_status = null;
      let bg_color = null;;
      
      if (status === 'avl') (new_status = 'Ready/Available', bg_color = 'bg-green-100 text-green-700 dark:text-white dark:bg-green-500');
      if (status === 'occupied') (new_status = 'Occupied', bg_color = 'bg-purple-100 text-purple-700 dark:text-white dark:bg-purple-500');
      if (status === 'need-clean') (new_status = 'Need Clean', bg_color = 'bg-blue-100 text-blue-700 dark:text-white dark:bg-blue-500');
      if (status === 'on-clean') (new_status = 'Cleaning', bg_color = 'bg-yellow-100 text-yellow-700 dark:text-white dark:bg-yellow-500');

      const formattedDate = new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const row = `
            <tr  class="fade-in-up border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 text-sm">
                  <td class="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">${room}</td>
                  <td class="px-6 py-4 text-gray-800 dark:text-gray-100">${acc_name}</td>
                  <td class="px-6 py-4 text-gray-800 dark:text-gray-100">${formattedDate}</td>
                  <td class="px-4 py-3"><span class="px-4 py-1.5 rounded-full ${bg_color} text-md font-semibold">${new_status}</td>
            </tr>
      `;

      document.querySelector('#clean-history-tbody').innerHTML += row;
}

function createRowForRoomDetails(room_name, room_no, status){
      let new_status = null;
      let bg_color = null;;
      let action_name = status === "need-clean" ? 'Assign' : status === "on-clean" ? 'Mark Ready' : 'View Info';
      let btn_color = status === "need-clean" ? 'bg-red-500 hover:bg-red-600' : status === "on-clean" ? 'bg-green-500 hover:bg-green-600 ' : 'bg-teal-500 hover:bg-teal-600';
      let icon = action_name === 'View Info' ? '<i data-lucide="eye" class="text-lg"></i>' : action_name === 'Mark Ready' ? '<i data-lucide="clipboard-check" class="text-lg"></i>' : '<i data-lucide="user-plus" class="text-lg"></i>' 
      
      if (status === 'avl') (new_status = 'Ready/Available', bg_color = 'bg-green-100 text-green-700 dark:text-white dark:bg-green-500');
      if (status === 'occupied') (new_status = 'Occupied', bg_color = 'bg-purple-100 text-purple-700 dark:text-white dark:bg-purple-500');
      if (status === 'need-clean') (new_status = 'Need Clean', bg_color = 'bg-blue-100 text-blue-700 dark:text-white dark:bg-blue-500');
      if (status === 'on-clean') (new_status = 'Cleaning', bg_color = 'bg-yellow-100 text-yellow-700 dark:text-white dark:bg-yellow-500');
      if (status === 'reserved') (new_status = 'Reserved', bg_color = 'bg-emerald-100 text-emerald-600 dark:text-white dark:bg-emerald-400');

      const row = `
            <tr data-room="${room_name}" class="bg-gray-50 dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 border-b border-gray-300 dark:border-gray-700">
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">${room_no}</td>
                  <td class="px-4 py-3"><span class="px-2 py-1 rounded-full ${bg_color} text-xs font-semibold">${new_status}</td>
                  <td class="px-4 py-3">
                        <button class="room-action-btn text-sm ${btn_color} text-white py-2 px-3 rounded-md cursor-pointer" id="${action_name === 'View Info' ? 'view-info' : action_name === 'Mark Ready' ? 'mark-ready' : 'assign-staff'}">${icon}</button>
                  </td>
            </tr>
      `;

      document.querySelector('#room-details').innerHTML += row;
      lucide.createIcons();
}

function renderViewDetailsModal(roomType){
      const modal = `
            <div id="roomDetailsModal" class="absolute w-full h-full inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50] ">
                  <div class="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-lg shadow-xl p-6 relative fade-in-up">
                        <span class="absolute top-2 right-4 text-gray-500 dark:text-gray-100 dark:hover:text-gray-200 hover:text-gray-700 text-[25px] cursor-pointer" id="closeRoomDetails">&times;</span>
                        <h3 id="modalRoomTitle" class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">${roomType} - Details</h3>

                        <div class="overflow-y-auto max-h-[50vh] thin-scroll">
                              <table class="min-w-full divide-y divide-gray-200 text-center">
                                    <thead class="dark:bg-gray-700 bg-gray-900 text-white sticky top-0">
                                          <tr>
                                          <th class="px-4 py-3 text-xs font-semibold uppercase">Room No.</th>
                                          <th class="px-4 py-3 text-xs font-semibold uppercase">Status</th>
                                          <th class="px-4 py-3 text-xs font-semibold uppercase">Action</th>
                                          </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200" id="room-details"></tbody>
                              </table>
                        </div>
                  </div>
                  
                  <div id="assignStaffPortal"></div>
                  <div id="viewRoomInfoPortal"></div>
            </div>
      `;

      document.getElementById('housekeepingPortal').innerHTML += modal;
}

async function render_openViewInfoRoomDetails(btn) {
      const row = btn.closest('tr'); 
      const cells = row.querySelectorAll('td');
      const room_name = document.getElementById('modalRoomTitle').textContent.split('-');
      const roomNo = cells[0].textContent.trim();

      const response = await fetch(`/room-cleaning-history?room_name=${room_name[0]}${roomNo}`);
      const result = await response.json();

      const rows = [];
      if (result.success){
            result.data.forEach(data => {
                  const date = new Date(data.date).toISOString().split('T')[0];
                  const formattedDate = new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                  });

                  const tr = `
                        <tr class="text-sm bg-gray-50 dark:bg-white/2 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                              <td class="px-6 py-4 font-normal text-gray-800 dark:text-gray-100">${data.name}</td>
                              <td class="px-6 py-4 text-gray-800 dark:text-gray-100">${formattedDate}</td>
                        </tr>
                  `;
                  rows.push(tr);
            });
      }else{
            const empty_row = `
                  <tr class="text-sm bg-gray-50 dark:bg-white/2 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="2" class="text-center dark:text-white text-gray-800 py-4">No data.</td>
                  </tr>
            `;

            rows.push(empty_row);
      }

      const modal = `
            <div id="view-info-modal" class="absolute w-full h-full inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                  <div class="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-lg shadow-xl p-6 relative fade-in-up">
                        <span class="absolute top-3 right-4 text-gray-500 dark:text-gray-200 text-[25px]  cursor-pointer transition" id="close-view-info-modal">&times;</span>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5 text-center flex items-center justify-center gap-2" id="view-info-title"><i class="fas fa-user-tag text-primary-blue"></i>${room_name[0]} ${roomNo} - Cleaning History</h3>

                        <div class="overflow-y-auto max-h-[40vh] thin-scroll">
                              <table class="min-w-full divide-y divide-gray-200 text-center">
                                    <thead class="dark:bg-gray-700 bg-gray-900 text-white sticky top-0 z-50">
                                          <tr>
                                                <th class="px-4 py-3 text-xs font-semibold uppercase">Staff Name</th>
                                                <th class="px-4 py-3 text-xs font-semibold uppercase">Date Assigned</th>
                                          </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200" id="cleaning-details">${rows.join('\n')}</tbody>
                              </table>
                        </div>
                  </div>
            </div>
      `;

      document.querySelector('#viewRoomInfoPortal').innerHTML += modal;
}

async function renderAssignStaffModal(area_name, room_no){
      const staffs = await allStaffs();
      const modal = `
            <div id="assign-staff-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-card-bg dark:bg-gray-900 w-full max-w-[800px] rounded-lg shadow-2xl p-6 relative fade-in-up">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 text-center flex items-center justify-center gap-2"><i class="fas fa-user-tag text-primary-blue"></i> Assign Cleaners </h3>
                        <form id="assignStaffForm">
                              <div class="w-full mb-6 flex flex-col gap-2">
                                    <input type="hidden" name="area_name" value="${area_name}">
                                    <input type="hidden" name="room_no" value="${room_no}">
                                    <div class="text-sm text-gray-600 dark:text-gray-300 mt-3">
                                          <label >Select Staff:</label>
                                          <select  name="name"class="w-full  border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-4 pr-8 text-gray-700 dark:text-gray-100 dark:bg-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                                                ${staffs}
                                          </select>
                                    </div>
                                    <div class="text-sm text-gray-600 dark:text-gray-300 mt-3 flex flex-col">
                                          <label>Date Assigned:</label>
                                          <input type="date" name="date" class="p-4 border border-gray-400 dark:border-gray-200 dark:text-gray-100 text-gray-800 rounded-sm date-icon" required>
                                    </div>
                              </div>
                              <div class="flex justify-end gap-3">
                                    <button type="button" class="px-5 py-2 border border-gray-300 dark:border-gray-200 rounded-lg text-gray-700 dark:text-gray-200 dark:bg-white/10 dark:hover:bg-white/8 hover:bg-gray-100 transition" id="close-assign-staff-modal"> Cancel</button>
                                    <button type="submit" class="px-5 py-2 bg-primary-blue dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"><i class="fas fa-paper-plane mr-1"></i> Assign</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.querySelector('#assignStaffPortal').innerHTML += modal;
}

function removePrevRoomDetailsRow(){
      document.querySelectorAll('#room-details tr').forEach(row => row.remove());
}

function openStaffDetails(btn) {
      const row = btn.closest('tr'); 
      const cells = row.querySelectorAll('td');
      
      const room_name = document.getElementById('modalRoomTitle').textContent.split('-');
      const roomNo = cells[0].textContent.trim();

      renderAssignStaffModal(room_name[0], roomNo);
}

function getMonthsAndDays(){
      document.querySelectorAll('#monthSelect3 option').forEach(opt => opt.remove());

      const monthSelect = document.getElementById("monthSelect3");
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
      
      document.querySelectorAll('#daySelect2 option').forEach(opt => opt.remove());
      const daySelect = document.getElementById("daySelect2");
      const currentDate3 = new Date();
      const currentYear3 = currentDate3.getFullYear();
      const currentMonth3 = currentDate3.getMonth(); // 0-11
      const currentDay = currentDate3.getDate();    // 1-31

      // Get number of days in the current month
      const monthDays = new Date(currentYear3, currentMonth3 + 1, 0).getDate();

      for (let day = 1; day <= monthDays; day++) {
            const option = document.createElement("option");
            option.value = day;
            option.textContent = day;
      
            if (day === currentDay) option.selected = true;
      
            daySelect.appendChild(option);
      }
}

function loadingAnimation0(){
      const load = `
            <div id="loading" class="absolute top-45 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-auto text-white space-y-2 z-50 ">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black">Fetcing data...</p>
            </div>
      `;      

      document.getElementById('loadingCleanPortal').innerHTML += load;
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


// -------------------- DATA ------------------------- //
async function accomodationData(){
      showLoader('table');
      const response = await fetch('/total-area-data');
      const result = await response.json();
      
      if (result.success){
            document.querySelectorAll('#room-status-tbody tr').forEach(row => row.remove());
            const areaNames = {
                  "Barkada": "Barkada Room",
                  "Family": "Family Room",
                  "Garden": "Garden View Room",
                  "Premium": "Premium Villa Room",
                  "Standard": "Standard Villa Room"
            };
            result.data.forEach(data => {
                  createRowData(areaNames[data.name], data.total_room, data.need_clean, data.on_clean, data.ready, data.occupied, data.reserved);
            });
      }else{
            const empty_row = `
                  <tr class="text-sm bg-gray-50 dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="7" class="text-center p-4">No data.</td>
                  </tr>
            `;

            document.getElementById('room-status-tbody').innerHTML += empty_row;
      }
      hideLoader();
}

async function historyData(){
      const month = document.getElementById('monthSelect3').value;
      const day = document.getElementById('daySelect2').value;

      const response = await fetch(`/cleaning-history?month=${month}&day=${day}`);
      const result = await response.json();

      document.querySelectorAll('#clean-history-tbody tr').forEach(row => row.remove());
      if (result.success){
            result.data.forEach(data => {
                  createRowDataHistory(data.room, data.name, data.date, data.status);
            });
      }else{
            const empty_row = `
                  <tr class="text-sm bg-gray-50 dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="4" class="text-center p-4">No data.</td>
                  </tr>
            `;

            document.getElementById('clean-history-tbody').innerHTML += empty_row;
      }
}

async function allStaffs(){
      const response = await fetch('/staff-cleaners');
      const result = await response.json();

      if (result.success){
            let staff_list = [];

            result.data.forEach(staff => {
                  const opt = `
                        <option value="${staff.staff_name}" class="text-md">${staff.staff_name}</option>
                  `;
                  staff_list.push(opt);
            });
            staff_list.unshift('<option value="" hidden class="py-3">Choose Staff ↓</option>');
            return staff_list.join('\n');
      }else{
            const empty_opt = `
                  <option value="">No staff available to clean today.</option>
            `;
            return empty_opt;
      }
}

async function submitAssignStaff(e){
      e.preventDefault();
      const form = new FormData(e.target);
      showLoader('add', 'Assigning staff...');
      const response = await fetch('/assign-cleaner', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const result = await response.json();

      if(result.success){
            successMessageCard7(result.message);
            notifications();
            document.getElementById('assign-staff-modal').remove();
            openRoomDetails(form.get('area_name'));
            getSummarryCardData();
            accomodationData();
      }else{
            failedMessageCard7(result.message);
      }
      hideLoader();
}

async function getSummarryCardData(){
      const response = await fetch('/summary-data');
      const result = await response.json();

      document.getElementById('to-be-clean').textContent = result.need_clean;
      document.getElementById('on-clean').textContent = result.on_clean;
      document.getElementById('ready').textContent = result.ready;
      document.getElementById('occupied').textContent = result.occupied;
      document.getElementById('all-areas').textContent = result.total_room;
      document.getElementById('reserved').textContent = result.reserved;
}

async function markReady(btn){
      const row = btn.closest('tr'); 
      const cells = row.querySelectorAll('td');
      const roomNo = cells[0].textContent.trim();
      showLoader('add', 'Updating room status...');
      const response = await fetch(`/update-area-condition?room_no=${roomNo}&area_name=${row.dataset.room}`, {
            method: 'POST'
      });
      const result = await response.json();

      if(result.success){
            notifications();
            successMessageCard7(result.message);
            openRoomDetails(row.dataset.room);
            getSummarryCardData();
            accomodationData();
            document.querySelector('#roomDetailsModal').remove();
      }else{
            failedMessageCard7(result.message);
      }
      hideLoader();
}

async function openRoomDetails(roomType){
      const response = await fetch(`/area-data?accomodation=${roomType}`);
      const result = await response.json();

      if (result.success){
            removePrevRoomDetailsRow();
            result.data.forEach(data => {
                  createRowForRoomDetails(roomType, data.room, data.status);
            });
      }else{
            failedMessageCard7('Error fecthing data');
      }
}

function switchRoomStatus(room_btn){
      document.getElementById('clean-history-table').classList.add('hidden');
      document.getElementById('room-status-table').classList.remove('hidden');
      document.querySelector('.dateBox').classList.add('hidden');
      document.getElementById('table-title').textContent = 'Room Status';
      document.getElementById('title-icon').setAttribute("data-lucide", "bed-double");
      document.getElementById('title-icon').classList.remove("text-green-500");
      document.getElementById('title-icon').classList.add("text-blue-500");
      accomodationData();

      if (room_btn){
            room_btn.id = "history-btn";
            room_btn.textContent = "Switch to Cleaning History";
            room_btn.classList.remove('bg-green-500', 'hover:bg-green-600');
            room_btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
      }

      lucide.createIcons();
}

function switchCleaningHistory(e){
      document.getElementById('room-status-table').classList.add('hidden');
      document.getElementById('clean-history-table').classList.remove('hidden');
      document.getElementById('table-title').textContent = 'Cleaning History';
      document.getElementById('title-icon').setAttribute("data-lucide", "clipboard-clock");
      document.getElementById('title-icon').classList.remove("text-blue-500");
      document.getElementById('title-icon').classList.add("text-green-500");
      document.querySelector('.dateBox').classList.remove('hidden');
      historyData();
      e.target.textContent = "Switch to Room Status";
      e.target.id = 'room-status-btn';
      e.target.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
      e.target.classList.add('bg-green-600', 'hover:bg-green-600');

      lucide.createIcons();
}

// ---------------- EVENT LISTENERS ----------------
document.addEventListener('click', (e) => {
      // buttons
      const btn = e.target.closest('.room-action-btn');
      if (btn) {
            switch (btn.id) {
                  case 'assign-staff':
                        openStaffDetails(btn); // pass btn if needed
                        break;
                  case 'mark-ready':
                        markReady(btn);
                        break;
                  case 'view-info':
                        render_openViewInfoRoomDetails(btn);
                        break;
            }
      }
      if (e.target.matches('#view-room-details')) (renderViewDetailsModal(e.target.closest('tr').dataset.room), openRoomDetails(e.target.closest('tr').dataset.room));

      // spans
      if (e.target.matches('#closeRoomDetails')) document.getElementById('roomDetailsModal').remove();
      if (e.target.matches('#close-assign-staff-modal')) document.getElementById('assign-staff-modal').remove();
      if (e.target.matches('#close-view-info-modal')) document.querySelector('#view-info-modal').remove();
      
      if (e.target.id === "history-btn") {
            switchCleaningHistory(e);
      }else if (e.target.id === "room-status-btn") {
            switchRoomStatus(e.target);
      }

});

document.addEventListener('submit', (e) => {
      if (e.target.matches('#assignStaffForm')) submitAssignStaff(e);
});

document.addEventListener('change', (e) => {
      if (e.target.closest('#monthSelect3')) historyData();
      if (e.target.closest('#daySelect2')) historyData();
});

getMonthsAndDays();

export function initPageHousekeeping(){
      getSummarryCardData();
      switchRoomStatus(document.querySelector('#room-status-btn'));
      notifications();
}