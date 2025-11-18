
let isAttendanceNotEmpty = false;
const tbody = document.getElementById('staffList');

// ------------ HELPER FUNCTIONS ------------
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

function renderAddStaffModal(){
      const modal = `
            <div id="addStaffModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-2xl p-6 relative fade-in-up">
                        <button id="closeAddStaff" class="absolute top-4 text-2xl right-4 text-gray-600 dark:text-gray-300 hover:text-red-500">&times;</button>
                        
                        <div class="mb-6 border-b border-gray-300 dark:border-gray-700 pb-3 flex items-center justify-between">
                              <h2 class="text-xl font-bold text-gray-800 dark:text-white">Add New Staff</h2>
                        </div>
                        
                        <!-- Add Form -->
                        <form id="addStaffForm" class="flex flex-col gap-2">
                              <input type="hidden" name="status" value="Active">
                              <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input type="text" id="addName" name="staff_name" placeholder="Enter full name" class="text-gray-900 dark:text-gray-400 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                              </div>
                        
                              <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                                    <select id="addPosition" name="position" class="text-gray-900 dark:text-gray-400 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                          <option value="">Select position</option>
                                          <option value="Front Desk">Front Desk</option>
                                          <option value="Janitor">Janitor</option>
                                          <option value="Gardener">Gardener</option>
                                          <option value="Security Guard">Security Guard</option>
                                          <option value="Maintenance">Maintenance</option>
                                    </select>
                              </div>
                        
                              <div class="grid grid-cols-2 gap-4">
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Salary (₱)</label>
                                          <input type="number" id="addDailySalary" name="daily_salary" min="0" placeholder="e.g., 500" class="text-gray-900 dark:text-gray-400 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                    </div>
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Leave Days</label>
                                          <input type="number" id="addMaxLeave" name="avl_leave" min="0" readonly value="5" class="text-gray-900 dark:text-gray-400 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                    </div>
                              </div>
                        
                              <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Started</label>
                                    <input type="date" id="addDateStarted" name="date_started" class="text-gray-900 dark:text-gray-400 w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                              </div>
                              
                              <button type="submit" class="mt-3 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">Add Staff</button>
                        </form>
                  </div>
            </div>      
      `;
      
      document.getElementById('staffManagementPortal').innerHTML += modal; 
}

async function renderAddStaffAttendanceModal(){
      const generated_row = await getAllStaff();
      const modal =  `
                  <div id="bulkAttendanceModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[85%] max-w-4xl py-8 px-10 relative fade-in-up">
                              <button id="closeBulkAttendance" class="absolute top-4 right-4 text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500">&times;</button>
                        
                              <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Add Attendance</h2>
                              <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Mark attendance for all staff on a specific date.</p>
                              
                              <form id="addStaffAttendanceForm">
                                    <div class="mb-4">
                                          <label for="attendanceType" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attendance Type:</label>
                                          <select id="attendanceType" class="px-3 py-2 min-w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full">
                                                <option value="Present">Present</option>
                                                <option value="Absent">Absent</option>
                                          </select>
                                    </div>
                              
                                    <div class="mb-6 flex flex-col md:flex-row gap-4">
                                          <div class="flex-1">
                                                <label for="attendanceDateAll" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date:</label>
                                                <input type="date" id="attendanceDateAll" required class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                          </div>
                                    
                                          <!-- Time-in Input (only shows if Present) -->
                                          <div class="flex-1" id="timeInWrapper">
                                                <label for="attendanceTimein" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time-in:</label>
                                                <input type="time" id="attendanceTimein" required class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                          </div>
                                    </div>

                                    <div class="flex justify-start gap-4 items-center mb-4">
                                          <button id="selectAll" type="button" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">Select All</button>
                                          <button id="resetAllSelected" type="button" class="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm transition">Unselect All</button>
                                    </div>
                              
                                    <!-- Attendance Table -->
                                    <div class="overflow-x-auto max-h-[350px] border border-gray-200 dark:border-gray-700 rounded-xl">
                                          <table class="w-full text-sm border-collapse">
                                                <thead class="bg-gray-900 dark:bg-gray-700">
                                                      <tr>
                                                            <th class="p-2 text-center text-white dark:text-gray-300">Select Here </th>
                                                            <th class="p-2 text-center text-white dark:text-gray-300">Staff Name</th>
                                                            <th class="p-2 text-center text-white dark:text-gray-300">Position</th>
                                                      </tr>
                                                </thead>
                                                <tbody id="bulkAttendanceTable" class="text-gray-700 dark:text-gray-300">
                                                      ${generated_row}
                                                </tbody>
                                          </table>
                                    </div>
                              
                                    <div class="flex justify-end mt-6">
                                          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">Save Attendance</button>
                                    </div>
                              </form>
                        </div>
                  </div>
      `;
      
      document.getElementById('staffManagementPortal').innerHTML += modal; 
      lucide.createIcons();
}

async function renderUpdateAttendanceModal(e){
      const generated_row = await getAllPresentStaff();

      const modal = `
            <div id="updateAttendanceModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[85%] max-w-4xl py-8 px-10 relative fade-in-up">
                        <button id="closeUpdateAttendance" class="absolute top-4 right-4 text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500">&times;</button>
                        
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Update Staff Time Outs</h2>
                        
                        <form id="updateStaffAttendanceForm">
                              <div class="mb-6 flex justify-start w-full">
                                    <div class="flex flex-col">
                                          <label for="attendanceTimeout" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time-out:</label>
                                          <input type="time" id="attendanceTimeout" required class="px-3 py-2 w-90 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    </div>
                              </div>

                              <div class="flex justify-start gap-4 items-center mb-4">
                                    <button id="selectAll" type="button" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition">Select All</button>
                                    <button id="resetAllSelected" type="button" class="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm transition">Unselect All</button>
                              </div>
                              
                              <!-- Attendance Table -->
                              <div class="overflow-x-auto max-h-[350px] border border-gray-200 dark:border-gray-700 rounded-xl">
                                    <table class="w-full text-sm border-collapse">
                                          <thead class="bg-gray-200 dark:bg-gray-700">
                                                <tr>
                                                      <th class="p-2 text-center text-gray-700 dark:text-gray-300">Select Here</th>
                                                      <th class="p-2 text-center text-gray-700 dark:text-gray-300">Staff Name</th>
                                                      <th class="p-2 text-center text-gray-700 dark:text-gray-300">Time In</th>
                                                </tr>
                                          </thead>
                                          <tbody id="updateAttendanceTable" class="text-gray-700 dark:text-gray-300">
                                                ${generated_row}
                                          </tbody>
                                    </table>
                              </div>
                              
                              <div class="flex justify-end mt-6">
                                    <button id="submitBulkAttendance" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"> Save Update</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += modal; 
      lucide.createIcons();
}

async function renderViewStaffInfo(id, staff_name, date_started, position, daily_salary, estimated_weekly, estimated_monthly, actual_weekly, actual_monthly, workdays, absent, avl_leave){
      const generated_row = await individualStaffAttendance(id);

      const modal = `
            <div id="viewStaffModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-4xl p-6 relative fade-in-up">
                  
                        <button id="closeViewStaff" class="absolute top-4 right-4 text-gray-600 dark:text-gray-300 text-2xl hover:text-red-500">&times;</button>
                        
                        <div class="flex justify-between items-center mb-6 border-b border-gray-300 dark:border-gray-700 pb-4">
                              <div class="flex items-center gap-4 ">
                                    <img id="staffPhoto" src="/static/assets/user.png" alt="Staff" class="w-16 h-16 rounded-full object-cover">
                                    <div>
                                          <h2 id="staffName" class="text-2xl font-bold text-gray-800 dark:text-white">${staff_name}</h2>
                                          <p id="staffPosition" class="text-gray-600 dark:text-gray-400 text-sm">${position}</p>
                                    </div>
                              </div>
                              <div class="mt-8">
                                    <label class="text-sm text-gray-500 dark:text-gray-400">Started on ${date_started}</label>
                              </div>
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                              <div class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-center shadow-sm">
                                    <h3 class="text-sm text-gray-500 dark:text-gray-400">Daily Salary</h3>
                                    <p id="dailySalary" class="text-xl font-semibold text-gray-800 dark:text-white">${daily_salary.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                              </div>
                        
                              <div class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-center shadow-sm">
                                    <h3 class="text-sm text-gray-500 dark:text-gray-400">Estimated Weekly</h3>
                                    <p id="weeklySalary" class="text-xl font-semibold text-gray-800 dark:text-white">${estimated_weekly.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                              </div>
                        
                              <div class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-center shadow-sm">
                                    <h3 class="text-sm text-gray-500 dark:text-gray-400">Estimated Monthly</h3>
                                    <p id="monthlySalary" class="text-xl font-semibold text-gray-800 dark:text-white">${estimated_monthly.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                              </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-6">
                              <div class="p-4 rounded-xl bg-green-50 dark:bg-green-900/40 text-center shadow-sm">
                                    <h3 class="text-sm text-gray-500 dark:text-gray-400">Actual Monthly</h3>
                                    <p id="actualMonthlySalary" class="text-xl font-semibold text-green-700 dark:text-green-300">${actual_weekly.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                              </div>
                              
                              <div class="p-4 rounded-xl bg-green-50 dark:bg-green-900/40 text-center shadow-sm">
                                    <h3 class="text-sm text-gray-500 dark:text-gray-400">Actual Weekly</h3>
                                    <p id="actualWeeklySalary" class="text-xl font-semibold text-green-700 dark:text-green-300">${actual_monthly.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</p>
                              </div>
                        </div>
                        
                        <!-- Attendance & Leave Summary -->
                        <div class="grid grid-cols-2 gap-4 mb-6">
                              <div class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm">
                                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Attendance Summary</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Total Days Worked: <span id="daysWorked" class="font-semibold text-gray-800 dark:text-white">${workdays}</span></p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Absent Days: <span id="daysAbsent" class="font-semibold text-gray-800 dark:text-white">${absent}</span></p>
                              </div>
                        
                              <div class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm">
                                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Leave Information</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Max Leave Days: <span id="maxLeave" class="font-semibold text-gray-800 dark:text-white">5</span></p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">Remaining Leave: <span id="remainingLeave" class="font-semibold text-gray-800 dark:text-white">${avl_leave}</span> </p>
                              </div>
                        </div>
                        
                        <div class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm">
                              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">Attendance History</h3>
                              <div class="overflow-y-auto max-h-[250px]">
                                    <table class="w-full text-sm border-collapse">
                                          <thead class="bg-gray-900 dark:bg-gray-700">
                                                <tr class="text-center">
                                                      <th class="p-2 text-white dark:text-gray-300 w-50">Date</th>
                                                      <th class="p-2 text-white dark:text-gray-300 w-45">Time In</th>
                                                      <th class="p-2 text-white dark:text-gray-300 w-45">Time Out</th>
                                                      <th class="p-2 text-white dark:text-gray-300 w-60">Status</th>
                                                </tr>
                                          </thead>
                                          <tbody id="attendanceTableIndividual" class="text-gray-700 dark:text-gray-300">
                                                ${generated_row}
                                          </tbody>
                                    </table>
                              </div>
                        </div>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += modal; 
}

function renderUpdateStaffModal(staff_id, staff_name, position, daily_salary, avl_leave, date_started, status){
      const modal = `
            <div id="updateStaffModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-2xl p-6 relative fade-in-up">
                        <button id="closeUpdateStaff" class="absolute top-4 text-2xl right-4 text-gray-600 dark:text-gray-300 hover:text-red-500">&times;</button>
                        
                        <div class="mb-6 border-b border-gray-300 dark:border-gray-700 pb-3 flex items-center justify-between">
                              <h2 class="text-xl font-bold text-gray-800 dark:text-white">Update Staff Information</h2>
                        </div>
                        
                        <form id="updateStaffForm" class="flex flex-col gap-2">
                              <input type="hidden" name="staff_id" value="${staff_id}">
                              <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input type="text" id="updateName" name="staff_name" value="${staff_name}" placeholder="Enter full name" class="w-full p-3 text-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                              </div>
                        
                              <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                                    <select id="updatePosition" name="position" class="w-full p-3 rounded-lg border border-gray-300 text-gray-800 dark:text-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                          <option value="">Select position</option>
                                          <option value="Front Desk" ${position === 'Front Desk' ? 'selected' : ''}>Front Desk</option>
                                          <option value="Janitor" ${position === 'Janitor' ? 'selected' : ''}>Janitor</option>
                                          <option value="Gardener" ${position === 'Gardener' ? 'selected' : ''}>Gardener</option>
                                          <option value="Security Guard" ${position === 'Security Guard' ? 'selected' : ''}>Security Guard</option>
                                          <option value="Maintenance" ${position === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                                    </select>
                              </div>
                        
                              <div class="grid grid-cols-2 gap-4">
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Salary (₱)</label>
                                          <input type="number" id="updateDailySalary" value="${daily_salary}" name="daily_salary" min="0" placeholder="e.g., 500" class="w-full p-3 text-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                    </div>
                                    <div>
                                          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remaining Leave Days</label>
                                          <input type="number" id="updateMaxLeave" value="${avl_leave}" name="avl_leave" min="0" placeholder="e.g., 5" class="w-full p-3 rounded-lg text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                    </div>
                              </div>
                        
                              <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Started</label>
                                    <input type="date" id="updateDateStarted" value="${date_started}" name="date_started" class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                              </div>
                        
                              <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select id="addStatus" name="status" class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700  text-gray-800 dark:text-gray-100dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                                          <option value="Active" ${status == 'Active' ? 'selected' : ''}>Active</option>
                                          <option value="Absent" ${status == 'Absent' ? 'selected' : ''}>Absent</option>
                                          <option value="On Leave"  ${status == 'On Leave' ? 'selected' : ''}>On Leave</option>
                                    </select>
                              </div>

                              <button type="submit" class="mt-3 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">Update</button>
                        </form>
                  </div>
            </div>      
      `;
      
      document.getElementById('staffManagementPortal').innerHTML += modal; 
}

async function showAllOnLeave(){
      const generated_row = await thisWeekOnLeave();

      const modal = `
            <div id="onLeaveModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-3xl p-6 relative fade-in-up">
                  
                        <button id="closeOnLeaveStaff" class="absolute top-2 right-4 text-gray-600 dark:text-gray-300 text-2xl hover:text-red-500">&times;</button>
                        
                        <div class="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm mt-4">
                              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">Staff On Leave History</h3>
                              <div class="overflow-y-auto max-h-[250px]">
                                    <table class="w-full text-sm border-collapse">
                                          <thead class="bg-gray-200 dark:bg-gray-700">
                                                <tr class="text-center">
                                                      <th class="p-2 text-gray-700 dark:text-gray-300">Staff Name</th>
                                                      <th class="p-2 text-gray-700 dark:text-gray-300">Position</th>
                                                      <th class="p-2 text-gray-700 dark:text-gray-300">Date</th>
                                                </tr>
                                          </thead>
                                          <tbody id="attendanceTableIndividual" class="text-gray-700 dark:text-gray-300">
                                                ${generated_row}
                                          </tbody>
                                    </table>
                              </div>
                        </div>
                  </div>
            </div>
      `;

      document.getElementById('staffManagementPortal').innerHTML += modal; 
}

function createStaffListRow(id, staff_name, position, status){
      const row = `
            <li data-id="${id}" class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 shadow-md flex justify-between items-center fade-in-up transition-all duration-200 ease-in-out hover:-translate-y-1">
                  <div>
                        <div class="flex items-center gap-2">
                              <span class="font-semibold text-lg text-gray-900 dark:text-gray-100">${staff_name}</span>
                  
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full
                                    ${status === 'Active' ? 'bg-green-100 text-green-600 dark:bg-green-500 dark:text-white' :
                                    status === 'On Leave' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500 dark:text-white' :
                                    status === 'Absent' ? 'bg-red-100 text-red-600 dark:bg-red-500 dark:text-white' :
                                    'bg-gray-200 text-gray-600'}">
                  
                                    <i data-lucide="${
                                    status === 'Active' ? 'badge-check' :
                                    status === 'On Leave' ? 'calendar-off' :
                                    status === 'Absent' ? 'user-x' : 'help-circle'
                                    }" class="w-3 h-3"></i>${status}
                              </span>
                        </div>
                  
                        <div class="text-sm text-gray-500 dark:text-gray-400">${position}</div>
                  </div>
                  
                  <div class="flex gap-2">
                        <button id="viewStaffInfo" class="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-lg">
                              <i data-lucide="eye"></i>
                        </button>
                  
                        <button id="updateStaffInfo" class="p-2 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-gray-700 rounded-lg">
                              <i data-lucide="edit">edit</i>
                        </button>
                  
                        <button id="removeStaffInfo" class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 rounded-lg">
                              <i data-lucide="trash-2"></i>
                        </button>
                  </div>
            </li>
      `;

      document.getElementById('staffList').innerHTML += row; 
      lucide.createIcons();
}

function createStaffAttendanceRow(staff_id, staff_name, time_in, time_out, date, status, type=null){
      if (type) {  
            const row = `
                  <tr data-id="${staff_id}" class="bg-gray-50 dark:bg-white/3 hover:bg-black/10 text-gray-700 dark:text-gray-100 dark:hover:bg-white/5 border-b border-gray-300 dark:border-gray-700 transition fade-in-up text-[17px]">
                        <td class="py-3 px-10 text-center text-sm">${date}</td>
                        <td class="py-3 px-10 text-center text-sm">${time_in}</td> 
                        <td class="py-3 px-10 text-center text-sm">${time_out}</td> 
                        <td class="py-3 px-6 text-center" text-sm>
                              <label class="text-[12px] font-semibold py-1 px-3 rounded-2xl ${status === "Absent"  ? 'text-green-600 bg-red-100 dark:text-white dark:bg-red-500' : 'text-green-600 bg-green-100 dark:text-white dark:bg-green-500'}">${status}</label>
                        </td>
                  </tr>
            `;

            return row;
      }else{
            const row = `
                  <tr data-id="${staff_id}" class="bg-gray-50 dark:bg-white/3 hover:bg-black/10 text-gray-700 dark:text-gray-100 dark:hover:bg-white/5 border-b border-gray-300 dark:border-gray-700 transition fade-in-up text-[17px] overflow-x-auto">
                        <td class="py-3 px-10 text-center text-sm truncate max-w-[180px]">
                              <div class="w-full overflow-x-auto scroll-hide whitespace-nowrap">
                                    ${staff_name}
                              </div>
                        </td> 
                        <td class="py-3 px-10 text-center text-sm truncate max-w-[180px]">${time_in}</td> 
                        <td class="py-3 px-10 text-center text-sm truncate max-w-[180px]">${time_out}</td> 
                        <td class="py-3 px-10 text-center text-sm">${date}</td>
                        <td class="py-3 px-6 text-center w-[200px]">
                              <label class="text-[12px] font-semibold py-1 px-3 rounded-2xl w-full overflow-x-auto scroll-hide whitespace-nowrap
                                    ${status === "Absent"  ? 'text-green-600 bg-red-100 dark:text-white dark:bg-red-500' :
                                    status === '--' ? 'text-gray-900 dark:text-white ' :
                                    'text-green-600 bg-green-100 dark:text-white dark:bg-green-500' 
                              }">${status}</label>
                        </td>
                        <td class="py-3 px-6 text-center flex gap-2 items-center justify-center">
                              <button id="removeStaffAttendance" class="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-gray-800 rounded" title="Remove"><i data-lucide="trash-2"></i></button>
                        </td>
                  </tr>
            `;

            document.getElementById('attendanceTable').innerHTML += row; 
      }

      lucide.createIcons();
}

function markAllAsPresent(){
      const radios = document.querySelectorAll('.attendance-radio');
      const groups = {};

      radios.forEach(r => {
            const name = r.name;
            groups[name] = groups[name] || [];
            groups[name].push(r);
      });

      Object.values(groups).forEach(group => {
            const present = group.find(r => r.value === "Present");
            if (present) present.checked = true;
      });
}

function selectAllCheckboxes() {
      const checkboxes = document.querySelectorAll('.timeout-checkbox');
      checkboxes.forEach(cb => cb.checked = true);

      lucide.createIcons();
}

function unselectAllCheckboxes() {
      const checkboxes = document.querySelectorAll('.timeout-checkbox');
      checkboxes.forEach(cb => cb.checked = false);

      lucide.createIcons();
}

function markAllAsAbsent(){
      const radios = document.querySelectorAll('.attendance-radio');
      const groups = {};

      radios.forEach(r => {
            const name = r.name;
            groups[name] = groups[name] || [];
            groups[name].push(r);
      });

      Object.values(groups).forEach(group => {
            const absent = group.find(r => r.value === "Absent");
            if (absent) absent.checked = true;
      });
}

function resetAll(){
      const radios = document.querySelectorAll('.attendance-radio');
      radios.forEach(r => r.checked = false);
}

function enableTimeOutBtn(){
      const btn = document.getElementById('updateStaffAttendance');
      
      if (isAttendanceNotEmpty){
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
      }else{
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
      }
}

function resetMonthAndDay(){ 
      let currentMonth = new Date().getMonth() + 1;
      let currentDay = new Date().getDate();
      
      document.getElementById('monthSelect2').value = currentMonth;
      document.getElementById('daySelect').value = currentDay;
}

function changeAttendanceType(type){
      const timeInInput = document.getElementById('attendanceTimein');
      const wrapper = document.getElementById('timeInWrapper');

      // Toggle input
      timeInInput.disabled = type === "Absent"  ? true : false;
      timeInInput.style.opacity = type ==="Absent" ? '0.4' : '1';
      wrapper.style.opacity = type ==="Absent" ? '0.4' : '1';
}

function markCheckIcon(e){
      const checkbox = e.target;
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

// --------- DATA FETCHING FUNCTIONS -----------------
async function addStaff(e){
      e.preventDefault();
      const form = new FormData(e.target);

      try{
            const response = await fetch('/add-staff', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();

            if (result.success){
                  successMessageCard(result.message);
                  document.querySelector('#addStaffModal').remove();
                  showAllStaff();
                  sumarryCards();
            }else{
                  failedMessageCard(result.message);
            }
      }catch(err){
            console.error(err);
      }
}

async function viewStaffInfo(id){
      try{
            const response = await fetch(`/view-staff-info?id=${id}`);
            const result = await response.json();

            if (result.success){
                  const data = result.data;
                  const date = new Date(data.date_started).toISOString().split('T')[0];
                  const formattedDate = new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                  });
                  
                  renderViewStaffInfo(data.id, data.staff_name, formattedDate, data.position, data.daily_salary, data.estimate_weekly, data.estimate_month, data.weekly_salary, data.monthly_salary, data.workdays, data.absent, data.avl_leave);
            }else{
                  alert(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function showAllStaff(){
      try{
            const response = await fetch('/all-staff', {});
            const result = await response.json();

            if (result.success){
                  document.querySelectorAll('ul li').forEach(row => row.remove());      
                  result.data.forEach(staff => {
                        createStaffListRow(staff.id, staff.staff_name, staff.position, staff.status);
                  });
            }else{
                  const empty_row = `
                        <li class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 shadow-lg flex justify-between items-center">
                              <div>
                                    <div id="name" class="font-medium text-gray-900 dark:text-gray-100">No data.</div>
                              </div>
                        </li>
                  `;
                  
                  tbody.innerHTML += empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

// for add staff attendance
async function getAllStaff(){
      try{
            const response = await fetch('/staff-list', {});
            const result = await response.json();

            if (result.success){
                  let count = 1;
                  let staff_list = [];

                  result.data.forEach(staff => {
                        const row = `
                              <tr data-set="${staff.id}" class="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 hover:bg-black/3 dark:bg-white/3">  
                                    <td class="py-3 px-1 text-center">
                                          <label class="flex items-center  justify-center gap-2 cursor-pointer select-none">
                                                <input type="checkbox" name="select_staff" class="timeout-checkbox hidden peer">
                                                <span
                                                      class="w-6 h-6 flex items-center justify-center rounded-md border border-gray-400 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition">
                                                      <i data-lucide="check" class="w-4 h-4 text-transparent"></i>
                                                </span>
                                          </label>
                                    </td>
                                    <td class="p-3 text-center">${staff.staff_name}</td>
                                    <td class="p-3 text-center">${staff.position}</td>
                              </tr>
                        `;

                        staff_list.push(row);
                        count += 1;
                  });

                  return staff_list.join('\n');
            }else{
                  const empty_row = `
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                              <td colspan="4" class="p-3 text-center dark:text-gray-100 text-gray-800">All Staff has been recorded.</td>
                        </tr>
                  `;
                  
                  return empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

// for update staff time out
async function getAllPresentStaff(){
      try{
            const response = await fetch('/all-present-staff', {});
            const result = await response.json();

            if (result.success){
                  let count = 1;
                  let staff_list = [];

                  result.data.forEach(staff => {
                        const row = `
                              <tr data-set="${staff.staff_id}" class="border-b border-gray-200 dark:border-gray-700 hover:bg-black/3 dark:bg-white/3">
                                    <td class="py-3 px-1 text-center">
                                          <label class="flex items-center  justify-center gap-2 cursor-pointer select-none">
                                                <input type="checkbox" name="select_staff" class="timeout-checkbox hidden peer">
                                                <span
                                                      class="w-6 h-6 flex items-center justify-center rounded-md border border-gray-400 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition">
                                                      <i data-lucide="check" class="w-4 h-4 text-transparent"></i>
                                                </span>
                                          </label>
                                    </td>
                                    <td class="p-3 text-center">${staff.name}</td>
                                    <td class="p-3 text-center">${staff.time_in}</td>
                              </tr>
                        `;

                        staff_list.push(row);
                        count += 1;
                  });
                  
                  return staff_list.join('\n');
            }else{
                  const empty_row = `
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                              <td colspan="4" class="p-3 text-center dark:text-gray-100 text-gray-800">All Staff has been updated.</td>
                        </tr>
                  `;
                  
                  return empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

// for onleave modal
async function thisWeekOnLeave(){
      try{
            const response = await fetch('/thisweek-onleave-data');
            const result = await response.json();

            if (result.success){
                  let count = 1;
                  let staff_list = [];

                  result.data.forEach(staff => {
                        const date = new Date(staff.date).toISOString().split('T')[0];
                        const formattedDate = new Date(date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                        });

                        const row = `
                              <tr data-set="${staff.staff_id}" class="border-b border-gray-200 dark:border-gray-700">
                                    <td class="p-3 text-center">${staff.name}</td>
                                    <td class="p-3 text-center">${staff.position}</td>
                                    <td class="p-3 text-center">${formattedDate}</td>
                              </tr>
                        `;

                        staff_list.push(row);
                        count += 1;
                  });
                  
                  return staff_list.join('\n');
            }else{
                  const empty_row = `
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                              <td colspan="4" class="p-3 text-center dark:text-gray-100 text-gray-800">No staff on leave this week.</td>
                        </tr>
                  `;
                  
                  return empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

async function addStaffAttendance(e){
      e.preventDefault();
      
      const date = document.getElementById('attendanceDateAll').value;
      const time_in = document.getElementById('attendanceTimein').value;
      const attendanceType = document.querySelector('#attendanceType').value;
      
      const attendanceData = [];
      let allValid = false; // flag to check if every row has a selection
      const rows = document.querySelectorAll('#bulkAttendanceTable tr');

      rows.forEach(row => {
            const selected = row.querySelector('input[type="checkbox"]:checked');
            const id = row.getAttribute('data-set');
            const name = row.querySelector('td:nth-child(2)').textContent.trim();
            
            if (selected) {
                  allValid = true
                  const status = attendanceType;
                  attendanceData.push({ id, name, time_in, status, date });
            }
      });

      if (!allValid) {
            failedMessageCard("Please mark attendance for all staff before submitting.");
            return; // stop submission
      }
      
      try{
            const response = await fetch('/add-staff-attendance', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(attendanceData)
            });
            const result = await response.json();

            if (result.success){
                  successMessageCard(result.message);
                  document.querySelector('#bulkAttendanceModal').remove();
                  allStaffAttendance();
                  sumarryCards();
                  showAllStaff();
            }else{
                  failedMessageCard(result.message);
            }
      }catch(err){
            console.error(err);
      } 
}

async function updateStaffAttendance(e){
      e.preventDefault();
      
      let data = [];
      const rows = document.querySelectorAll('#updateAttendanceTable tr');
      const time_out = document.getElementById('attendanceTimeout').value;

      rows.forEach(row => {
            const selected = row.querySelector('input[type="checkbox"]:checked');
            const id = row.getAttribute('data-set');
            const td = row.querySelectorAll('td');
            const timeInStr = td[2].textContent;
            const time_in = new Date(`1970-01-01 ${timeInStr}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

            if (selected) {
                  data.push({ id, time_out, time_in});
            }
      });

      try{
            const response = await fetch('/update-staff-attendance', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.success){
                  successMessageCard(result.message);
                  document.querySelector('#updateAttendanceModal').remove();
                  allStaffAttendance();
                  sumarryCards();
            }else{
                  failedMessageCard(result.message);
            }
      }catch(err){
            console.error(err);
      } 
}

async function updateStaffInfo(e){
      e.preventDefault();
      const form = new FormData(e.target);
      console.log(form);
      try{
            const response = await fetch('/update-staff-info', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();

            if (result.success){
                  successMessageCard(result.message);
                  document.querySelector('#updateStaffModal').remove();
                  showAllStaff();
                  sumarryCards();
            }else{
                  failedMessageCard(result.message);
            }
      }catch(err){
            console.error(err);
      } 
}

async function allStaffAttendance(){
      document.querySelectorAll('#attendanceTable tr').forEach( row => row.remove());
      try{
            const response = await fetch('/all-staff-attendance', {});
            const result = await response.json();

            if (result.success){ 
                  isAttendanceNotEmpty = false;
                  result.data.forEach(staff => {
                        const date = new Date(staff.date).toISOString().split('T')[0];
                        const formattedDate = new Date(date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                        });

                        createStaffAttendanceRow(staff.staff_id, staff.name, staff.time_in, staff.time_out, formattedDate, staff.status);
                  });
            }else{
                  isAttendanceNotEmpty = true;
                  const empty_row = `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 ease-in-out">
                              <td colspan="6" class="text-center bg-gray-50 dark:bg-gray-800 dark:text-white text-gray-600 py-3 bg-gray-50">No data.</td>
                        </tr>
                  `;
                  
                  document.getElementById('attendanceTable').innerHTML += empty_row; 
            }
            enableTimeOutBtn();
      }catch(err){
            console.error(err);
      }
}

async function individualStaffAttendance(id){
      try{
            const response = await fetch(`/individual-staff-attendance?id=${id}`,);
            const result = await response.json();
            
            if (result.success){ 
                  let all_row = [];

                  result.data.forEach(staff => {
                        const date = new Date(staff.date).toISOString().split('T')[0];
                        const formattedDate = new Date(date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                        });

                        all_row.push(createStaffAttendanceRow(staff.staff_id, staff.name, staff.time_in, staff.time_out, formattedDate, staff.status, 'inidividual'));
                  });

                  return all_row.join('\n');
            }else{
                  const empty_row = `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 ease-in-out">
                              <td colspan="6" class="text-center bg-gray-50 dark:bg-gray-800 dark:text-white text-gray-600 py-3 bg-gray-50">No data.</td>
                        </tr>
                  `;
                  
                  return empty_row; 
            }
      }catch(err){
            console.error(err);
      }
}

async function getIndividualStaffInfo(id){
      try{
            const response = await fetch(`/view-staff-info?id=${id}`);
            const result = await response.json();

            if (result.success){
                  const staff = result.data;
                  const date = new Date(staff.date_started).toISOString().split('T')[0];

                  renderUpdateStaffModal(staff.id, staff.staff_name, staff.position, staff.daily_salary, staff.avl_leave, date, staff.status);

            }else{
                  alert('Empty data.')
            }
      }catch(err){
            console.error(err);
      }
}

async function searchStaff(name){
      try{
            const response = await fetch(`/search-staff?staff_name=${name}`);
            const result = await response.json();

            if (result.success){
                  document.querySelectorAll('ul li').forEach(row => row.remove());      
                  result.data.forEach(staff => {
                        createStaffListRow(staff.id, staff.staff_name, staff.position);
                  });
            }else{
                  document.querySelectorAll('ul li').forEach(row => row.remove());      
                  const empty_row = `
                        <li class="p-3 rounded-lg bg-gray-50  text-center  dark:bg-gray-800 shadow-lg flex justify-between items-center">
                              <div>
                                    <div id="name" class="font-medium text-gray-900 dark:text-gray-100">No data.</div>
                              </div>
                        </li>
                  `;
                  
                  tbody.innerHTML += empty_row;
            }
      }catch(err){
            console.error(err);
      }
}

async function sortAttendanceData(){
      document.querySelectorAll('#attendanceTable tr').forEach( row => row.remove());
      const month = document.getElementById('monthSelect2').value;
      const day = document.getElementById('daySelect').value;

      try{
            const response = await fetch(`/sort-attendance-data?month=${month}&day=${day}`);
            const result = await response.json();

            if (result.success){ 
                  isAttendanceNotEmpty = false;
                  result.data.forEach(staff => {
                        const date = new Date(staff.date).toISOString().split('T')[0];
                        const formattedDate = new Date(date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                        });

                        createStaffAttendanceRow(staff.staff_id, staff.name, staff.time_in, staff.time_out, formattedDate, staff.status);
                  });
            }else{
                  isAttendanceNotEmpty = true;
                  const empty_row = `
                        <tr class="hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-200 ease-in-out">
                              <td colspan="6" class="text-center bg-gray-50 dark:bg-gray-800 dark:text-white text-gray-600 py-3 bg-gray-50">No data.</td>
                        </tr>
                  `;
                  
                  document.getElementById('attendanceTable').innerHTML += empty_row; 
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
                  success(result.message);
                  showAllStaff();
                  sumarryCards();
            }else{
                  failedMessageCard(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function removeStaffAttendance(e){
      const tr = e.target.closest('tr');
      const id = tr.getAttribute('data-id');
      const td = tr.querySelectorAll('td');
      const status = td[4].textContent.trim();
      const date = td[3].textContent.trim();

      try{
            const response = await fetch(`/remove-staff-attendance?id=${id}&status=${status}&date=${date}`, {
                  method: 'DELETE'
            });
            const result = await response.json();

            if (result.success){
                  successMessageCard(result.message);
                  allStaffAttendance();
                  sumarryCards();
                  showAllStaff();
            }else{
                  failedMessageCard(result.message);
            }

      }catch(err){
            console.error(err);
      }
}

async function sumarryCards(id){
      try{
            const response = await fetch(`/summary-cards-data`);
            const result = await response.json();

            if (result.success){
                  const data = result.data;
                  
                  document.getElementById('total-staff').textContent = data.total_staff;
                  document.getElementById('on-duty').textContent = data.today_duty;
                  document.getElementById('absent').textContent = data.today_absent;
                  document.getElementById('on-leave').textContent = data.total_leave;
            }else{
                  alert('Something wrong!');
            }
      }catch(err){
            console.error(err);
      }
}


// ------------ EVENT LISTENERS -------------
document.addEventListener('click', (e) => {
      if (e.target.matches('#addStaffBtn')) renderAddStaffModal();
      if (e.target.matches('#addAttendanceBtn')) renderAddStaffAttendanceModal();
      if (e.target.closest('#viewStaffInfo')) viewStaffInfo(e.target.closest('li').getAttribute('data-id'));
      if (e.target.closest('#updateStaffInfo')) getIndividualStaffInfo(e.target.closest('li').getAttribute('data-id'));
      if (e.target.closest('#removeStaffInfo')) removeStaff(e.target.closest('li').getAttribute('data-id'));
      if (e.target.closest('#updateStaffAttendance')) renderUpdateAttendanceModal(e);
      if (e.target.closest('#removeStaffAttendance')) removeStaffAttendance(e);
      if (e.target.closest('#viewOnLeave')) showAllOnLeave();

      if (e.target.closest('#markAllPresent')) markAllAsPresent();
      if (e.target.closest('#markAllAbsent')) markAllAsAbsent();
      if (e.target.closest('#resetAll')) resetAll();
      if (e.target.closest('#selectAll')) selectAllCheckboxes();
      if (e.target.closest('#resetAllSelected')) unselectAllCheckboxes();

      if (e.target.matches('#closeAddStaff')) document.getElementById('addStaffModal').remove(); 
      if (e.target.matches('#closeBulkAttendance')) document.getElementById('bulkAttendanceModal').remove();
      if (e.target.matches('#closeUpdateAttendance')) document.getElementById('updateAttendanceModal').remove();
      if (e.target.matches('#closeViewStaff')) document.getElementById('viewStaffModal').remove();
      if (e.target.matches('#closeUpdateStaff')) document.getElementById('updateStaffModal').remove();
      if (e.target.matches('#closeModal')) document.getElementById('updateAttendanceModal').remove(); 
      if (e.target.matches('#closeOnLeaveStaff')) document.getElementById('onLeaveModal').remove(); 
});

document.addEventListener('input', (e) => {
      if (e.target.matches('input[name="search-staff"]')) searchStaff(e.target.value);
});

document.addEventListener('change', (e) => {
      if (e.target.closest('#monthSelect2')) sortAttendanceData();
      if (e.target.closest('#daySelect')) sortAttendanceData();
      if (e.target.closest('#attendanceType')) changeAttendanceType(e.target.value);
      if (e.target.matches('input[name="select_staff"]')) markCheckIcon(e);
});


document.addEventListener('submit', (e) => {
      if (e.target.matches('#addStaffForm')) addStaff(e);
      if (e.target.matches('#addStaffAttendanceForm')) addStaffAttendance(e);
      if (e.target.matches('#updateStaffAttendanceForm')) updateStaffAttendance(e);
      if (e.target.matches('#updateStaffForm')) updateStaffInfo(e);
});

// ----------- EXPORT ON LOAD ------------
export function initPageStaffMgmt(){
      showAllStaff();
      allStaffAttendance();
      sumarryCards();
      enableTimeOutBtn();
      resetMonthAndDay();
}
