
const tbody = document.getElementById('staff-tbody');
const table = document.querySelector('.staff-table');

function changeTableDetails(type){
      document.querySelector('.add-btn-staff').style.opacity = '1';
      document.querySelector('.add-btn-staff').style.pointerEvents = 'auto';

      // for button that change the table
      document.querySelectorAll('.change-btn').forEach(btn => {
            btn.classList.remove('bg-green-500', 'hover:bg-green-600');
            btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
      });
      document.querySelector(`#${type}`).classList.add('bg-green-500', 'hover:bg-green-600');

      // change the add btn
      if (type === 'staff-attendance'){
            document.querySelector('.add-btn-staff').setAttribute('id', 'add-attendance');
            document.querySelectorAll('tbody tr').forEach(row => row.remove());
            document.getElementById('table-title').textContent = 'Staff Attendance Data';
            document.getElementById('table-icon').setAttribute('data-lucide', 'check-square');
            showStaffAttendance();
      }else if (type === 'staff-details'){
            document.querySelector('.add-btn-staff').setAttribute('id', 'add-btn-staff');
            document.getElementById('table-title').textContent = 'Staff Details Data';
            document.getElementById('table-icon').setAttribute('data-lucide', 'user');
            document.querySelectorAll('tbody tr').forEach(row => row.remove());      
            showStaff();
      }else{
            document.querySelector('.add-btn-staff').style.opacity = '0.4';
            document.querySelector('.add-btn-staff').style.pointerEvents = 'none';
            document.querySelectorAll('tbody tr').forEach(row => row.remove());  
            document.getElementById('table-icon').setAttribute('data-lucide', 'dollar-sign');
            document.getElementById('table-title').textContent = 'Staff Salary Data (Weekly)';   
            showStaffSalary();
      }

      const details_header = `
            <tr>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Staff Name</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Date Started</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Wage</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Leave</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Action</th>
            </tr>
      `;

      const attendance_header = `
            <tr>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Staff Name</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Work Duration</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Action</th>
            </tr>
      `;
      
      const salary_header = `
            <tr>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Staff Name</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">No. of Workdays</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">No. of Absences</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Salary</th>
                  <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Action</th>
            </tr>
      `;

      const head = table.querySelector('thead');
      head.querySelectorAll('tr').forEach(row => row.remove());

      head.innerHTML += type === 'staff-attendance' ? attendance_header : type === 'staff-salary' ? salary_header : details_header;
}

function renderAddStaffModal(){
      const form  = `
            <div id="add-staff-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-3xl relative p-8 fade-in-up">
                        <span id="close-add-staff" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 dark:hover:text-gray-400 hover:text-gray-700 text-3xl font-light cursor-pointer">&times;</span>
                        <div class="text-center mb-6">
                              <h2 class="text-xl font-bold text-gray-700 dark:text-white">Add Staff</h2>
                        </div>
                        <form id="addStaffForm" class="flex flex-col gap-2">
                              <select id="role" name="role" class="border border-gray-300 text-gray-800 p-4 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all" required>
                                    <option value="" selected disabled>Select Staff Role</option>
                                    <option value="Front Desk Officer">Front Desk Officer</option>
                                    <option value="Security Guard">Security Guard</option>
                                    <option value="Housekeeping / Room Attendant">Housekeeping / Room Attendant</option>
                                    <option value="Janitor">Janitor</option>
                                    <option value="Gardener">Gardener</option>
                                    <option value="Chef / Cook">Chef / Cook</option>
                                    <option value="Restaurant Waitstaff">Restaurant Waitstaff</option>
                                    <option value="Maintenance Technician">Maintenance Technician</option>
                              </select>

                              <input type="text" name="name" placeholder="Staff Name" class="border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <input type="number" name="salary" placeholder="Salary (₱)" min="1" class="border dark:text-gray-100 text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <input type="number" name="avl_leave" placeholder="Allowed Leave" class="border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              
                              <div class="flex flex-col gap-1">
                                    <label class="text-gray-600 dark:text-gray-400 text-[14px] mb-1 block">Date Started:</label>
                                    <input type="date" name="date_started" class="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              </div>
                              
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md py-3 rounded-md transition-all mt-2">Submit</button>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += form; 
}


async function renderAddAttendanceModal(){
      let staffs = await staffLIst();

      const form  = `
            <div id="add-attendance-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-4xl relative p-8 fade-in-up">
                        <span id="close-add-attendance" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 dark:hover:text-gray-400 hover:text-gray-700 text-3xl font-light cursor-pointer">&times;</span>
                        
                        <div class="text-center mb-6">
                              <h2 class="text-xl font-bold text-gray-700 dark:text-white">Add Staff Attendance</h2>
                              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Check staff present today and mark their attendance type.</p>
                        </div>
                  
                        <form id="addAttendanceForm" class="flex flex-col gap-4">
                              <div class="flex flex-col gap-1">
                                    <label class="text-gray-600 dark:text-gray-400 text-[14px] mb-1 block">Date:</label>
                                    <input type="date" name="attendance_date" class="w-full border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              </div>
                        
                              <div class="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div class="bg-gray-900 p-3 font-semibold text-gray-700 dark:text-gray-200 dark:bg-gray-700">Staff List</div>
                                    
                                    <div class="h-[30vh] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700" id="staff-list">${staffs}</div>
                              </div>
                        
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md py-3 rounded-md transition-all mt-2">Submit Attendance</button>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += form; 
}

function renderUpdateStaffModal(e){
      const tr = e.target.closest('tr');
      const td = tr.querySelectorAll('td');

      const id = tr.getAttribute('data-set');
      const name = td[0].textContent;
      const date = new Date(td[1].textContent).toISOString().split('T')[0];
      const salary = td[2].textContent;
      const role = td[3].textContent;
      const avl_leave = td[4].textContent;

      const form  = `
            <div id="update-staff-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-3xl relative p-8 fade-in-up">
                        <span id="close-update-staff" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 dark:hover:text-gray-400 hover:text-gray-700 text-3xl font-light cursor-pointer">&times;</span>
                        <div class="text-center mb-6">
                              <h2 class="text-xl font-bold text-gray-700 dark:text-white">Update Staff</h2>
                        </div>
                        <form id="updateStaffForm" class="flex flex-col gap-2">
                              <input type="hidden" name="id" value="${id}">
                              <select id="role" name="role" class="border border-gray-300 text-gray-800 p-4 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all" required>
                                    <option value="" disabled ${!role ? 'selected' : ''}>Select Staff Role</option>
                                    <option value="Front Desk Officer" ${role === 'Front Desk Officer' ? 'selected' : ''}>Front Desk Officer</option>
                                    <option value="Security Guard" ${role === 'Security Guard' ? 'selected' : ''}>Security Guard</option>
                                    <option value="Housekeeping / Room Attendant" ${role === 'Housekeeping / Room Attendant' ? 'selected' : ''}>Housekeeping / Room Attendant</option>
                                    <option value="Janitor" ${role === 'Janitor' ? 'selected' : ''}>Janitor</option>
                                    <option value="Gardener" ${role === 'Gardener' ? 'selected' : ''}>Gardener</option>
                                    <option value="Chef / Cook" ${role === 'Chef / Cook' ? 'selected' : ''}>Chef / Cook</option>
                                    <option value="Restaurant Waitstaff" ${role === 'Restaurant Waitstaff' ? 'selected' : ''}>Restaurant Waitstaff</option>
                                    <option value="Maintenance Technician" ${role === 'Maintenance Technician' ? 'selected' : ''}>Maintenance Technician</option>                          
                              </select>

                              <input type="text" name="name" value="${name}" placeholder="Staff Name" class="border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <input type="number" name="salary" value="${salary}" placeholder="Salary (₱)" min="1" class="border dark:text-gray-100 text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <input type="number" name="avl_leave" value="${avl_leave}" placeholder="Allowed Leave" class="border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              
                              <div class="flex flex-col gap-1">
                                    <label class="text-gray-600 dark:text-gray-400 text-[14px] mb-1 block">Date Started:</label>
                                    <input type="date" name="date_started" value="${date}" class="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              </div>
                              
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md py-3 rounded-md transition-all mt-2">Submit</button>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += form; 
}

function renderUpdateStaffSalaryModal(e){
      const tr = e.target.closest('tr');
      const td = tr.querySelectorAll('td');

      const id = tr.getAttribute('data-set');
      const name = td[0].textContent;
      const workdays = td[1].textContent;
      const absences = td[2].textContent;
      const salary = td[3].textContent;

      const form  = `
            <div id="update-salary-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-3xl relative p-8 fade-in-up">
                        <span id="close-update-salary" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 dark:hover:text-gray-400 hover:text-gray-700 text-3xl font-light cursor-pointer">&times;</span>
                        <div class="text-center mb-6">
                              <h2 class="text-xl font-bold text-gray-700 dark:text-white">Update Staff Salary</h2>
                        </div>
                        <form id="updateSalaryForm" class="flex flex-col gap-2">
                              <input type="hidden" name="id" value="${id}">
                              <label class="text-gray-500 dark:text-gray-400 text-sm">Staff Name</label>
                              <input type="text" name="name" readonly value="${name}" placeholder="Staff Name" class="mt-[-20px] border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <label class="text-gray-500 dark:text-gray-400 text-sm">No. of Workdays</label>
                              <input type="number" name="workdays" value="${workdays}" placeholder="Workdays" class="border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <label class="text-gray-500 dark:text-gray-400 text-sm">No. of Absences</label>
                              <input type="number" name="absences" value="${absences}" placeholder="Absences" class="border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <label class="text-gray-500 dark:text-gray-400 text-sm">Salary (₱)</label>
                              <input type="number" name="salary" value="${salary}" placeholder="Salary (₱)" min="1" class="border dark:text-gray-100 text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md py-3 rounded-md transition-all mt-2">Submit</button>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += form; 
}

function renderUpdateStaffAttendanceModal(e){
      const tr = e.target.closest('tr');
      const td = tr.querySelectorAll('td');

      const staff_id = tr.getAttribute('data-id');
      const name = td[0].textContent;
      const date = new Date(td[1].textContent).toISOString('').split('T')[0];
      const label = td[2].textContent;

      const form  = `
            <div id="update-attendance-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-3xl relative p-8 fade-in-up">
                        <span id="close-update-attendance" class="absolute top-4 right-4 text-gray-500 dark:text-gray-200 dark:hover:text-gray-400 hover:text-gray-700 text-3xl font-light cursor-pointer">&times;</span>
                        <div class="text-center mb-6">
                              <h2 class="text-xl font-bold text-gray-700 dark:text-white">Update Staff Salary</h2>
                        </div>
                        <form id="updateAttendanceForm" class="flex flex-col gap-2">
                              <input type="hidden" name="staff_id" value="${staff_id}">
                              <label class="text-gray-500 dark:text-gray-400 text-sm">Staff Name:</label>
                              <input type="text" name="name" readonly value="${name}" placeholder="Staff Name" class="mt-[-20px] border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <label class="text-gray-500 dark:text-gray-400 text-sm">Date:</label>
                              <input type="date" name="date" value="${date}" placeholder="Date" class="border border-gray-300 dark:text-gray-100 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-all" required>
                              <select name="label" class="border border-gray-300 text-gray-800 p-4 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 rounded-md transition-all" required>
                                    <option value="" disabled ${!label ? 'selected' : ''}>Select Staff Role</option>
                                    <option value="Whole Day" ${label === 'Whole Day}"' ? 'selected' : ''}>Whole Day</option>
                                    <option value="Half-day" ${label === 'Half Day' ? 'selected' : ''}>Half Day</option>                          
                              </select>
                              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md py-3 rounded-md transition-all mt-2">Submit</button>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += form; 
}

function createTable(id, name, date_started, salary, role, avl_leave){
      const row = `
            <tr data-set="${id}" class="hover:bg-blue-50 text-gray-700 dark:text-gray-100 dark:hover:bg-white/3 border-b border-gray-300 dark:border-gray-700 transition fade-in-up text-[17px]">
                  <td class="py-3 px-10 text-center">${name}</td>
                  <td class="py-3 px-6 text-center">${date_started}</td>
                  <td class="py-3 px-5 font-medium text-center">${salary}</td>
                  <td class="py-3 px-8 text-center">${role}</td>
                  <td class="py-3 px-4 text-center">${avl_leave}</td>
                  <td class="flex gap-2 text-center items-center justify-center py-3 px-4">
                        <button id="update-btn-staff" class="bg-teal-500 hover:bg-teal-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 cursor-pointer"><i class="ti ti-edit text-white text-lg"></i>Update</button>
                        <button id="remove-btn-staff" class="bg-red-500 hover:bg-red-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 cursor-pointer"><i class="ti ti-trash text-white text-lg"></i>Remove</button>
                  </td>
            </tr>
      `;

      tbody.innerHTML += row;
}

function createTableAttendance(id, staff_id, name, date, label){
      const row = `
            <tr data-id="${staff_id}" class="hover:bg-blue-50 text-gray-700 dark:text-gray-100 dark:hover:bg-white/3 border-b border-gray-300 dark:border-gray-700 transition fade-in-up text-[17px]">
                  <td class="py-3 px-10 text-center">${name}</td>
                  <td class="py-3 px-6 text-center">${date}</td>
                  <td class="py-3 px-5 font-medium text-center">${label}</td>
                  <td class="flex gap-2 text-center items-center justify-center py-3 px-4">
                        <button id="update-attendance-staff" class="bg-teal-500 hover:bg-teal-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 cursor-pointer"><i class="ti ti-edit text-white text-lg"></i>Update</button>
                  </td>
            </tr>
      `;

      tbody.innerHTML += row;
}

function createTableSalary(id, name, workdays, absences, salary){
      const row = `
            <tr data-set="${id}" class="hover:bg-blue-50 text-gray-700 dark:text-gray-100 dark:hover:bg-white/3 border-b border-gray-300 dark:border-gray-700 transition fade-in-up text-[17px]">
                  <td class="py-3 px-10 text-center">${name}</td>
                  <td class="py-3 px-6 text-center">${workdays}</td>
                  <td class="py-3 px-5 font-medium text-center">${absences}</td>
                  <td class="py-3 px-5 font-medium text-center">${salary}</td>
                  <td class="flex gap-2 text-center items-center justify-center py-3 px-4">
                        <button id="update-salary-staff" class="bg-teal-500 hover:bg-teal-600 py-2 px-3 rounded-sm text-white text-sm flex gap-2 cursor-pointer"><i class="ti ti-edit text-white text-lg"></i>Update</button>
                  </td>
            </tr>
      `;

      tbody.innerHTML += row;
}

async function addStaff(e){
      e.preventDefault();
      const form = new FormData(e.target);
      console.log(form);
      try{
            const response = await fetch('/add-staff', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();
            console.log(result);
            if (result.success){
                  alert(result.message);
                  document.querySelector('#add-staff-overlay').remove();
                  showStaff();
            }else{
                  alert(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function addStaffAttendance(e){
      e.preventDefault();
      const form = new FormData(e.target);
      const entries = [...form.entries()];
      
      const result = { staffs: [] };
      let current = {};
      
      entries.forEach(([key, value]) => {
            if (key === 'attendance_date') {
                  result.attendance_date = value;
            } else if (key === 'id') {
                  // If current has data, push it before starting new
                  if (Object.keys(current).length) result.staffs.push(current);
                  current = { id: value };
            } else {
                  current[key] = value;
            }
      });
      
      // Push the last one
      if (Object.keys(current).length) result.staffs.push(current);
      
      try{
            const response = await fetch('/add-staff-attendance', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(result)
            });
            const res = await response.json();

            if (result.success){
                  alert(res.message);
                  document.querySelector('#add-attendance-overlay').remove();
                  showStaffAttendance();
            }else{
                  alert(res.message);
            }
      }catch(err){
            console.error(err);
      }
}

async function updateStaff(e){
      e.preventDefault();
      const form = new FormData(e.target);

      try{
            const response = await fetch('/update-staff', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();

            if (result.success){
                  alert(result.message);
                  document.querySelector('#update-staff-overlay').remove();
                  showStaff();
            }else{
                  alert(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function updateStaffSalary(e){
      e.preventDefault();
      const form = new FormData(e.target);

      try{
            const response = await fetch('/update-staff-salary', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();

            if (result.success){
                  alert(result.message);
                  document.querySelector('#update-salary-overlay').remove();
                  showStaffSalary();
            }else{
                  alert(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function updateStaffAttendance(e){
      e.preventDefault();
      const form = new FormData(e.target);

      try{
            const response = await fetch('/update-staff-attendance', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();

            if (result.success){
                  alert(result.message);
                  document.querySelector('#update-attendance-overlay').remove();
                  showStaffAttendance();
            }else{
                  alert(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function removeStaff(id){
      try{
            const response = await fetch(`/remove-staff?id=${id}`, {
                  method: 'DELETE'
            });
            const result = await response.json();

            if (result.success){
                  alert(result.message);
                  showStaff();
            }else{
                  alert(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function removeStaffAttendance(id){
      try{
            const response = await fetch(`/remove-staff-attendance?id=${id}`, {
                  method: 'DELETE'
            });
            const result = await response.json();

            if (result.success){
                  alert(result.message);
                  showStaff();
            }else{
                  alert(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function showStaff(){
      try{
            const response = await fetch('/all-staff', {});
            const result = await response.json();

            if (result.success){
                  document.querySelectorAll('tbody tr').forEach(row => row.remove());      
                  result.data.forEach(staff => {
                        const date = new Date(staff.date_started).toISOString().split('T')[0];
                        const formattedDate = new Date(date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                        });
                        
                        createTable(staff.id, staff.staff_name, formattedDate, staff.wage, staff.role, staff.avl_leave);
                  });
            }else{
                  const empty_row = `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/3 transition-all duration-200 ease-in-out">
                              <td colspan="7" class="text-center bg-gray-50 dark:bg-white/3 dark:text-white text-gray-600 py-6 bg-gray-50">No data.</td>
                        </tr>
                  `;
                  
                  tbody.innerHTML += empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

async function showStaffAttendance(){
      try{
            const response = await fetch('/all-staff-attendance', {});
            const result = await response.json();

            if (result.success){
                  document.querySelectorAll('tbody tr').forEach(row => row.remove());      
                  result.data.forEach(staff => {
                        const date = new Date(staff.date).toISOString().split('T')[0];
                        const formattedDate = new Date(date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                        });
                        createTableAttendance(staff.id, staff.staff_id, staff.name, formattedDate, staff.label);
                  });
            }else{
                  const empty_row = `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/3 transition-all duration-200 ease-in-out">
                              <td colspan="4" class="text-center bg-gray-50 dark:bg-white/3 dark:text-white text-gray-600 py-6 bg-gray-50">No data.</td>
                        </tr>
                  `;
                  
                  tbody.innerHTML += empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

async function showStaffSalary(){
      try{
            const response = await fetch('/all-staff-salary', {});
            const result = await response.json();

            if (result.success){
                  document.querySelectorAll('tbody tr').forEach(row => row.remove());      
                  result.data.forEach(staff => {
                        createTableSalary(staff.id, staff.name, staff.workdays, staff.absent, staff.salary);
                  });
            }else{
                  const empty_row = `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/3 transition-all duration-200 ease-in-out">
                              <td colspan="5" class="text-center bg-gray-50 dark:bg-white/3 dark:text-white text-gray-600 py-6 bg-gray-50">No data.</td>
                        </tr>
                  `;
                  
                  tbody.innerHTML += empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

async function staffLIst(){
      try{
            const response = await fetch('/all-staff', {});
            const result = await response.json();

            if (result.success){
                  let staff_list = [];

                  result.data.forEach(staff => {
                        staff_list.push(`
                              <div class="flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/2 transition">
                                    <input type="hidden" name="id" value="${staff.id}">
                                    <label class="text-gray-700 dark:text-gray-200"><input type="checkbox" name="name" value="${staff.staff_name}" class="w-4 h-4 accent-blue-600">${staff.staff_name}</label>
                                    <select name="label" class="border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm dark:bg-gray-900 dark:text-gray-100">
                                          <option value="Whole Day">Whole Day</option>
                                          <option value="Half-day">Half Day</option>
                                    </select>
                              </div>
                        `);
                  });
                  
                  return staff_list.join('\n');
            }else{
                  return 'No staff';
            }
      }catch(err){
            console.error(err);
      }
}

// Event Listeners
document.addEventListener('click', (e) => {
      if (e.target.matches('#add-btn-staff')) renderAddStaffModal();
      if (e.target.matches('#add-attendance')) renderAddAttendanceModal();
      if (e.target.matches('#update-btn-staff')) renderUpdateStaffModal(e);
      if (e.target.matches('#update-salary-staff')) renderUpdateStaffSalaryModal(e);
      if (e.target.matches('#update-attendance-staff')) renderUpdateStaffAttendanceModal(e);
      if (e.target.matches('#remove-btn-staff')) removeStaff(e.target.closest('tr').getAttribute('data-set'));
      if (e.target.matches('#remove-attendance-staff')) removeStaffAttendance(e.target.closest('tr').getAttribute('data-set'));
      
      // change table
      if (e.target.matches('#staff-salary')) changeTableDetails('staff-salary');
      if (e.target.matches('#staff-attendance')) changeTableDetails('staff-attendance');
      if (e.target.matches('#staff-details')) changeTableDetails('staff-details');

      // close modal
      if (e.target.matches('#close-add-staff')) document.querySelector('#add-staff-overlay').remove();
      if (e.target.matches('#close-add-attendance')) document.querySelector('#add-attendance-overlay').remove();
      if (e.target.matches('#close-update-staff')) document.querySelector('#update-staff-overlay').remove();
      if (e.target.matches('#close-update-attendance')) document.querySelector('#update-attendance-overlay').remove();
});

document.addEventListener('submit', (e) => {
      if (e.target.matches('#addStaffForm')) addStaff(e);
      if (e.target.matches('#addAttendanceForm')) addStaffAttendance(e);
      if (e.target.matches('#updateStaffForm')) updateStaff(e);
      if (e.target.matches('#updateSalaryForm')) updateStaffSalary(e);
      if (e.target.matches('#updateAttendanceForm')) updateStaffAttendance(e);
});

showStaff();

export function initPageStaffMgmt(){

};

/*
                        <div class="bg-card-bg dark:bg-gray-900 rounded-lg shadow-lg p-4 h-[60vh] flex flex-col gap-4">
                                    <div class="flex space-x-2">
                                          <button id="staff-details" class="change-btn flex-1 flex items-center justify-center gap-2 p-2 bg-green-500 rounded-md text-white hover:bg-green-600 transition-all duration-200"><i data-lucide="user" class="w-5 h-5"></i>Staff Details</button>
                                          <button id="staff-attendance" class="change-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200"><i data-lucide="check-square" class="w-5 h-5"></i>Staff Attendance</button>
                                          <button id="staff-salary" class="change-btn flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200"><i data-lucide="dollar-sign" class="w-5 h-5"></i>Staff Salary  (Weekly)</button>
                                    </div>
                              
                                    <div class="flex items-center justify-center mt-4">
                                          <div class="flex gap-3 items-center">
                                                <label data-lucide="user-circle" class="w-6 h-6 text-green-600 dark:text-green-400" id="table-icon"></label>
                                                <h3 id="table-title" class="text-xl font-semibold text-gray-900 dark:text-gray-100">Staff Details</h3>
                                          </div>
                                    </div>
                                    <div class="flex justify-start">
                                          <button id="add-btn-staff" class="add-btn-staff bg-green-500 py-2 px-6 rounded-sm flex items-center gap-1 hover:bg-green-600" style="pointer-events: auto; opacity: 1;"><i data-lucide="plus" class="w-4 h-4"></i>Add</button>
                                    </div>

                                    <div class="overflow-y-auto flex-1">
                                          <table class="staff-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead class="bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-200 sticky top-0 z-10" id="staff-head">
                                                      <tr>
                                                            <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Staff Name</th>
                                                            <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Date Started</th>
                                                            <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Wage</th>
                                                            <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Role</th>
                                                            <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Leave</th>
                                                            <th class="px-6 py-3 text-xs text-center font-medium uppercase tracking-wider">Action</th>
                                                      </tr>
                                                </thead>
                                                <tbody class="bg-card-bg dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" id="staff-tbody"></tbody>
                                          </table>
                                    </div>
                        </div>
                  
                        */

                        

                        <div id="bulkAttendanceModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                              <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-4xl p-6 relative fade-in-up">
                                    <button id="closeBulkAttendance" class="absolute top-4 right-4 text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500">&times;</button>
                                    
                                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Add Attendance</h2>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Mark attendance for all staff on a specific date.</p>
                                    
                                    <form id="addStaffAttendanceForm">
                                          <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                <div class="flex flex-col">
                                                      <label for="attendanceDateAll" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date:</label>
                                                      <input type="date" id="attendanceDateAll" required class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                </div>
            
                                                <div class="flex flex-col">
                                                      <label for="attendanceTimein" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time-in:</label>
                                                      <input type="time" id="attendanceTimein" required class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                </div>
                                          </div>
                                          
                                          <div class="flex justify-between items-center mb-4">
                                                <div class="space-x-2">
                                                      <button id="markAllPresent" type="button" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">Mark All Present</button>
                                                      <button id="markAllAbsent" type="button" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition">Mark All Absent</button>
                                                </div>
                                                <button id="resetAll" type="button" class="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm transition">Reset</button>
                                          </div>
                                          
                                          <!-- Attendance Table -->
                                          <div class="overflow-x-auto max-h-[350px] border border-gray-200 dark:border-gray-700 rounded-xl">
                                                <table class="w-full text-sm border-collapse">
                                                      <thead class="bg-gray-200 dark:bg-gray-700">
                                                            <tr>
                                                                  <th class="p-2 text-center text-gray-700 dark:text-gray-300">Staff Name</th>
                                                                  <th class="p-2 text-center text-gray-700 dark:text-gray-300">Position</th>
                                                                  <th class="p-2 text-center text-gray-700 dark:text-gray-300">Present</th>
                                                                  <th class="p-2 text-center text-gray-700 dark:text-gray-300">Absent</th>
                                                            </tr>
                                                      </thead>
                                                      <tbody id="bulkAttendanceTable" class="text-gray-700 dark:text-gray-300">
                                                            ${generated_row}
                                                      </tbody>
                                                </table>
                                          </div>
                                          
                                          <div class="flex justify-end mt-6">
                                                <button id="submitBulkAttendance" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"> Save Attendance</button>
                                          </div>
                                    </form>
                              </div>
                        </div>