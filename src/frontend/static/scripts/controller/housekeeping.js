
// -------------------- HELPERS ------------------------- //
function createRowData(acc_name, acc_count, need_clean, on_clean, ready, occupied){
      const row = `
            <tr data-room="${acc_name}">
                  <td class="px-6 py-4 font-semibold text-gray-800">${acc_name}</td>
                  <td class="px-6 py-4">${acc_count}</td>
                  <td class="px-6 py-4 text-blue-600 font-bold">${need_clean}</td>
                  <td class="px-6 py-4 text-yellow-600 font-bold">${on_clean}</td>
                  <td class="px-6 py-4 text-green-600 font-bold">${ready}</td>
                  <td class="px-6 py-4 text-purple-600 font-bold">${occupied}</td>
                  <td class="px-6 py-4">
                        <button class="px-4 py-2 text-sm bg-primary-blue text-white rounded-md hover:bg-blue-700 transition" id="view-room-details">View Details</button>
                  </td>
            </tr>
      `;

      document.getElementById('acc-tbody').innerHTML += row;
}

function removePrevTable(){
      document.querySelectorAll('#acc-tbody tr').forEach(row => row.remove());
}

function createRowForRoomDetails(room_name, room_no, status, assign_staff, date){
      let new_status = null;
      let bg_color = null;;
      let action_name = status === "need-clean" ? 'Assign' : status === "on-clean" ? 'Mark Ready' : 'View Info';
      let btn_color = status === "need-clean" ? ' bg-yellow' : status === "on-clean" ? 'bg-green' : 'bg-teal';
      
      if (status === 'avl') (new_status = 'Ready/Available', bg_color = 'bg-green-100 text-green-700');
      if (status === 'occupied') (new_status = 'Occupied', bg_color = 'bg-purple-100 text-purple-700');
      if (status === 'need-clean') (new_status = 'Need Clean', bg_color = 'bg-blue-100 text-blue-700');
      if (status === 'on-clean') (new_status = 'Cleaning', bg_color = 'bg-yellow-100 text-yellow-700');

      const formattedDate = new Date(date).toLocaleString("en-US", { month: "short", day: "numeric" });
      const row = `
            <tr data-room="${room_name}">
                  <td class="px-4 py-3 font-medium">${room_no}</td>
                  <td class="px-4 py-3"><span class="px-2 py-1 rounded-full ${bg_color} text-xs font-semibold">${new_status}</td>
                  <td class="px-4 py-3 text-gray-700">${assign_staff}</td>
                  <td class="px-4 py-3 text-gray-700">${ date !== '0000-00-00' ? formattedDate : "N/A" }</td>
                  <td class="px-4 py-3">
                        <button class="text-sm ${btn_color}-500 text-white py-2 px-3 rounded-md hover:${btn_color}-600" id="${action_name === 'View Info' ? 'view-info' : action_name === 'Mark Ready' ? 'mark-ready' : 'assign-staff'}">${action_name}</button>
                  </td>
            </tr>
      `;

      document.querySelector('#room-details').innerHTML += row;
}

function renderViewDetailsModal(roomType){
      const modal = `
            <div id="roomDetailsModal" class="absolute w-full h-full inset-0 bg-black/30 flex items-center justify-center z-[50]">
                  <div class="bg-white w-full max-w-5xl rounded-lg shadow-xl p-6 relative">
                        <span class="absolute top-2 right-4 text-gray-500 hover:text-gray-700 text-[25px] cursor-pointer" id="closeRoomDetails">&times;</span>
                        <h3 id="modalRoomTitle" class="text-2xl font-semibold text-primary-blue mb-4">${roomType} Room - Details</h3>

                        <div class="overflow-y-auto max-h-[50vh]">
                              <table class="min-w-full divide-y divide-gray-200 text-center">
                                    <thead class="bg-gray-100 sticky top-0">
                                          <tr>
                                          <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Room No.</th>
                                          <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                                          <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                                          <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date Assigned</th>
                                          <th class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Action</th>
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

function render_openViewInfoRoomDetails(e) {
      const row = e.target.closest('tr'); 
      const cells = row.querySelectorAll('td');

      const room_name = document.getElementById('modalRoomTitle').textContent.split(' ');
      const roomNo = cells[0].textContent.trim();
      const status = cells[1].textContent.trim();
      const staff = cells[2].textContent.trim();
      const lastCleaned = cells[3].textContent.trim();

      const modal = `
            <div id="view-info-modal" class="fixed inset-0 w-full h-full bg-black/30 flex items-center justify-center z-50">
                  <div class="bg-card-bg w-full max-w-[500px] rounded-2xl shadow-2xl px-6 py-4 relative border border-gray-200">
                  <span class="absolute top-3 right-4 text-gray-500 text-[25px]  cursor-pointer transition" id="close-view-info-modal">&times;</span>
                        <!-- Title -->
                        <h3 class="text-2xl font-bold text-primary-blue mb-5 text-center flex items-center justify-center gap-2" id="view-info-title"><i class="fas fa-user-tag text-primary-blue"></i>${room_name[0]} Room ${roomNo} - Info</h3>
                        <div class="flex flex-col gap-2 mt-4">
                              Status:
                              <label id="status" class="font-semibold text-[17px] text-gray-800 bg-gray-50 border border-gray-200 rounded-sm p-4">${status}</label>
                              Date cleaned:
                              <label id="date" class="font-medium text-[17px] text-blue-700 bg-blue-50 border border-blue-100 rounded-sm p-4">${lastCleaned}</label>
                              Assigned to:
                              <label id="assigned" class="font-medium text-[17px] text-blue-700 bg-blue-50 border border-blue-100 rounded-sm p-4">${staff}</label>
                        </div>
                  </div>
            </div>
      `;

      document.querySelector('#viewRoomInfoPortal').innerHTML += modal;
}

function renderAssignStaffModal(){
      const modal = `
            <div id="assign-staff-modal" class="fixed inset-0 bg-black/30 z-[50] flex items-center justify-center z-[50]">
                  <div class="bg-card-bg w-full max-w-[800px] rounded-2xl shadow-2xl p-6 relative border border-gray-200">
                        <h3 class="text-2xl font-bold text-primary-blue mb-5 text-center flex items-center justify-center gap-2"><i class="fas fa-user-tag text-primary-blue"></i> Assign Staff </h3>
                        <form id="assignStaffForm">
                              <div class="w-full mb-6 flex flex-col gap-2">
                                    <input type="hidden" name="area_name">
                                    <input type="hidden" name="room_no">
                                    <select  name="name"class="w-full appearance-none border border-gray-300 rounded-lg px-3 py-4 pr-8 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                                          <option value="">Select Staff</option>
                                          <option value="maria">Maria Gonzales</option>
                                          <option value="john">John Dela Cruz</option>
                                          <option value="ana">Ana Santos</option>
                                          <option value="mark">Mark Villanueva</option>
                                          <option value="lisa">Lisa Ramos</option>
                                    </select>
                                    <label class="mt-2 text-[15px]">Date Assigned:</label>
                                    <input type="date" name="date" class="p-4 border border-gray-400 rounded-sm">
                              </div>
                              <div class="flex justify-end gap-3">
                                    <button type="button" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition" id="close-assign-staff-modal"> Cancel</button>
                                    <button type="submit" class="px-5 py-2 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition"><i class="fas fa-paper-plane mr-1"></i> Assign</button>
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

function openStaffDetails(e) {
      const row = e.target.closest('tr'); 
      const cells = row.querySelectorAll('td');
      
      const room_name = document.getElementById('modalRoomTitle').textContent.split(' ');
      const roomNo = cells[0].textContent.trim();

      renderAssignStaffModal();
      document.querySelector('input[name="area_name"]').value = room_name[0];
      document.querySelector('input[name="room_no"]').value = roomNo;
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
            alert('Error fecthing data');
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
            alert(result.message);
            document.getElementById('assign-staff-modal').remove();
            openRoomDetails(form.get('area_name'));
            getSummarryCardData();
            accomodationData();
      }else{
            alert(result.message);
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

async function markReady(e){
      const row = e.target.closest('tr'); 
      const cells = row.querySelectorAll('td');
      const roomNo = cells[0].textContent.trim();
      
      const response = await fetch(`/update-area-condition?room_no=${roomNo}&area_name=${row.dataset.room}`, {
            method: 'POST'
      });
      const result = await response.json();

      if(result.success){
            alert(result.message);
            openRoomDetails(row.dataset.room);
            getSummarryCardData();
            accomodationData();
      }else{
            alert(result.message);
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
            alert('Error fecthing data');
      }
}

// ---------------- EVENT LISTENERS ----------------
document.addEventListener('click', (e) => {
      // buttons
      if (e.target.matches('#view-room-details')) (renderViewDetailsModal(e.target.closest('tr').dataset.room), openRoomDetails(e.target.closest('tr').dataset.room));
      if (e.target.matches('#assign-staff')) openStaffDetails(e);
      if (e.target.matches('#mark-ready')) markReady(e);
      if (e.target.matches('#view-info')) render_openViewInfoRoomDetails(e);

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