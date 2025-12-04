import { notifications } from "./home-dashboard.js";

// -------------------- HELPERS ------------------------- //
function successMessageCard(message, redirect = null) {
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="success-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4">
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
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="failed-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4">
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

function createRowData(acc_name, acc_count, need_clean, on_clean, ready, occupied){
      const row = `
            <tr data-room="${acc_name}" class="fade-in-up border-b border-gray-200 dark:border-gray-700">
                  <td class="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">${acc_name}</td>
                  <td class="px-6 py-4 text-gray-800 dark:text-gray-100">${acc_count}</td>
                  <td class="px-6 py-4 ${Number(need_clean) > 0 ? 'text-red-600' : 'text-blue-600'} dark:text-gray-blue-500 font-bold">${need_clean}</td>
                  <td class="px-6 py-4 text-yellow-600 dark:text-gray-yellow-500 font-bold">${on_clean}</td>
                  <td class="px-6 py-4 text-green-600  dark:text-green-blue-500 font-bold">${ready}</td>
                  <td class="px-6 py-4 text-purple-600 dark:text-purple-blue-500 font-bold">${occupied}</td>
                  <td class="px-6 py-4 flex justify-center">
                        <button class="px-4 py-2 text-sm bg-primary-blue dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex gap-2 items-center" id="view-room-details"><i data-lucide="building" class="text-lg"></i>View Rooms</button>
                  </td>
            </tr>
      `;

      document.getElementById('acc-tbody').innerHTML += row;
      lucide.createIcons();
}

function removePrevTable(){
      document.querySelectorAll('#acc-tbody tr').forEach(row => row.remove());
}

function createRowForRoomDetails(room_name, room_no, status, assign_staff, date){
      let new_status = null;
      let bg_color = null;;
      let action_name = status === "need-clean" ? 'Assign' : status === "on-clean" ? 'Mark Ready' : 'View Info';
      let btn_color = status === "need-clean" ? 'bg-red-500 hover:bg-red-600' : status === "on-clean" ? 'bg-green-500 hover:bg-green-600 ' : 'bg-teal-500 hover:bg-teal-600';
      let icon = action_name === 'View Info' ? '<i data-lucide="eye" class="text-lg"></i>' : action_name === 'Mark Ready' ? '<i data-lucide="clipboard-check" class="text-lg"></i>' : '<i data-lucide="user-plus" class="text-lg"></i>' 
      
      if (status === 'avl') (new_status = 'Ready/Available', bg_color = 'bg-green-100 text-green-700 dark:text-white dark:bg-green-500');
      if (status === 'occupied') (new_status = 'Occupied', bg_color = 'bg-purple-100 text-purple-700 dark:text-white dark:bg-purple-500');
      if (status === 'need-clean') (new_status = 'Need Clean', bg_color = 'bg-blue-100 text-blue-700 dark:text-white dark:bg-blue-500');
      if (status === 'on-clean') (new_status = 'Cleaning', bg_color = 'bg-yellow-100 text-yellow-700 dark:text-white dark:bg-yellow-500');

      const formattedDate = new Date(date).toLocaleString("en-US", { month: "short", day: "numeric" });

      const row = `
            <tr data-room="${room_name}">
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">${room_no}</td>
                  <td class="px-4 py-3"><span class="px-2 py-1 rounded-full ${bg_color} text-xs font-semibold">${new_status}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-100">${assign_staff !== null ? assign_staff : "--" }</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-100">${ date !== null ? formattedDate : "--" }</td>
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
                  <div class="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-lg shadow-xl p-6 relative fade-in-up">
                        <span class="absolute top-2 right-4 text-gray-500 dark:text-gray-100 dark:hover:text-gray-200 hover:text-gray-700 text-[25px] cursor-pointer" id="closeRoomDetails">&times;</span>
                        <h3 id="modalRoomTitle" class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">${roomType} Room - Details</h3>

                        <div class="overflow-y-auto max-h-[50vh] thin-scroll">
                              <table class="min-w-full divide-y divide-gray-200 text-center">
                                    <thead class="dark:bg-gray-700 bg-gray-900 text-white sticky top-0">
                                          <tr>
                                          <th class="px-4 py-3 text-xs font-semibold uppercase">Room No.</th>
                                          <th class="px-4 py-3 text-xs font-semibold uppercase">Status</th>
                                          <th class="px-4 py-3 text-xs font-semibold uppercase">Assigned To</th>
                                          <th class="px-4 py-3 text-xs font-semibold uppercase">Date Assigned</th>
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

function render_openViewInfoRoomDetails(btn) {
      const row = btn.closest('tr'); 
      const cells = row.querySelectorAll('td');

      const room_name = document.getElementById('modalRoomTitle').textContent.split(' ');
      const roomNo = cells[0].textContent.trim();
      const status = cells[1].textContent.trim();
      const staff = cells[2].textContent.trim();
      const lastCleaned = cells[3].textContent.trim();

      const modal = `
            <div id="view-info-modal" class="fixed inset-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                  <div class="bg-card-bg dark:bg-gray-900 w-full max-w-[500px] rounded-lg shadow-2xl px-6 py-4 relative fade-in-up">
                        <span class="absolute top-3 right-4 text-gray-500 dark:text-gray-200 text-[25px]  cursor-pointer transition" id="close-view-info-modal">&times;</span>
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 text-center flex items-center justify-center gap-2" id="view-info-title"><i class="fas fa-user-tag text-primary-blue"></i>${room_name[0]} Room ${roomNo} - Info</h3>
                        <div class="flex flex-col gap-2 mt-4 text-gray-900 dark:text-gray-400">
                              Status:
                              <label id="status" class="font-semibold text-[17px] text-gray-800 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-400 bg-gray-50 border border-gray-200 rounded-sm p-4">${status}</label>
                              Date cleaned:
                              <label id="date" class="font-medium text-[17px] text-blue-700 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-400 bg-blue-50 border border-blue-100 rounded-sm p-4">${lastCleaned}</label>
                              Assigned to:
                              <label id="assigned" class="font-medium text-[17px] text-blue-700 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-400 bg-blue-50 border border-blue-100 rounded-sm p-4">${staff}</label>
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
                                    <select  name="name"class="w-full  border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-4 pr-8 text-gray-700 dark:text-gray-100 dark:bg-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                                          <option value="">Select Staff</option>
                                          ${staffs}
                                    </select>
                                    <label class="mt-2 text-[15px] text-gray-700 dark:text-gray-400">Date Assigned:</label>
                                    <input type="date" name="date" class="p-4 border border-gray-400 dark:border-gray-200 dark:text-gray-100 text-gray-800 rounded-sm" required>
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
      
      const room_name = document.getElementById('modalRoomTitle').textContent.split(' ');
      const roomNo = cells[0].textContent.trim();

      renderAssignStaffModal(room_name[0], roomNo);
}

// -------------------- DATA ------------------------- //
async function accomodationData(){
      const response = await fetch('/total-area-data');
      const result = await response.json();

      if (result.success){
            removePrevTable();
            result.data.forEach(data => {
                  createRowData(data.name, data.total_room, data.need_clean, data.on_clean, data.ready, data.occupied, data.maintenance);
            });
      }else{
            failedMessageCard('Error fecthing data');
      }
}

async function allStaffs(){
      const response = await fetch('/staff-cleaners');
      const result = await response.json();
      console.log(result);
      if (result.success){
            let staff_list = [];

            result.data.forEach(staff => {
                  const opt = `
                        <option value="${staff.staff_name}">${staff.staff_name}</option>
                  `;

                  staff_list.push(opt);
            });

            return staff_list.join('\n');
      }else{
            failedMessageCard('No staffs yet.');
      }
}

async function submitAssignStaff(e){
      e.preventDefault();
      const form = new FormData(e.target);

      const response = await fetch('/assign-cleaner', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const result = await response.json();

      if(result.success){
            successMessageCard(result.message);
            document.getElementById('assign-staff-modal').remove();
            openRoomDetails(form.get('area_name'));
            getSummarryCardData();
            accomodationData();
      }else{
            failedMessageCard(result.message);
      }
}

async function getSummarryCardData(){
      const response = await fetch('/summary-data');
      const result = await response.json();

      document.getElementById('to-be-clean').textContent = result.need_clean;
      document.getElementById('on-clean').textContent = result.on_clean;
      document.getElementById('ready').textContent = result.ready;
      document.getElementById('occupied').textContent = result.occupied;
      document.getElementById('all-areas').textContent = result.total_room;
}

async function markReady(btn){
      const row = btn.closest('tr'); 
      const cells = row.querySelectorAll('td');
      const roomNo = cells[0].textContent.trim();
      
      const response = await fetch(`/update-area-condition?room_no=${roomNo}&area_name=${row.dataset.room}`, {
            method: 'POST'
      });
      const result = await response.json();

      if(result.success){
            notifications();
            successMessageCard(result.message);
            openRoomDetails(row.dataset.room);
            getSummarryCardData();
            accomodationData();
            document.querySelector('#roomDetailsModal').remove();
      }else{
            failedMessageCard(result.message);
      }
}

async function openRoomDetails(roomType){
      const response = await fetch(`/area-data?accomodation=${roomType}`);
      const result = await response.json();
      if (result.success){
            removePrevRoomDetailsRow();
            result.data.forEach(data => {
                  createRowForRoomDetails(roomType, data.room, data.status, data.staff_assign, data.date);
            });
      }else{
            failedMessageCard('Error fecthing data');
      }
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
});

document.addEventListener('submit', (e) => {
      if (e.target.matches('#assignStaffForm')) submitAssignStaff(e);
});

export function initPageHousekeeping(){
      getSummarryCardData();
      accomodationData();
}