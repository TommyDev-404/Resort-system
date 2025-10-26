
const adminNum = document.getElementById('admin-num');
const adminName = document.getElementById('admin-name');
const adminEmail = document.getElementById('admin-email');
const datePasswordChange = document.getElementById('date-pass-change');

// ------------- HELPERS ---------------- //
function renderChangePassword(email){
      const modal = `
            <div id="passwordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div class="bg-white p-6 rounded-xl w-110 relative">
                        <h3 class="text-xl font-bold mb-4 text-center">Change Password</h3>
                        <form id="changePassForm">
                              <input type="hidden" name="email" value="${email}">
                              <div class="currentPass relative" >
                                    <label class="block mb-1 text-sm">Current Password</label>
                                    <input type="password" name="current_password" class="w-full p-4 mb-2 border rounded">
                              </div>
                              <div class="newPass relative">
                                    <label class="block mb-1 text-sm">New Password</label>
                                    <input type="password" name="new_password" class="w-full p-4 mb-2 border rounded">
                              </div>
                              <div class="confirmPass relative">
                                    <label class="block mb-1 text-sm">Confirm New Password</label>
                                    <input type="password" name="confirm_password" class="w-full p-4 mb-2 border rounded">
                              </div>
                              <label class="flex justify-end gap-2 text-sm mb-6"><input type="checkbox" id="show">Show Password</label>
                              <div class="flex justify-end gap-2">
                                    <button id="cancel-change-pass" type="button" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
                                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Change</button>
                              </div>
                        </form>
                  </div>
            </div>

      `;

      document.getElementById('adminModalPortal').innerHTML += modal;
};

function showPassword() {
      const inputs = document.querySelectorAll('#changePassForm input[type="password"], #changePassForm input[type="text"]');
      
      inputs.forEach(input => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
      });
}

function renderEditModal(type, value){
      const modal = `
            <div id="editModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div class="bg-white p-6 rounded-xl w-96 relative">
                        <h3 class="text-xl font-bold mb-4 text-center">Edit ${type}</h3>
                              <input id="input${type === "Contact Number" ? "ContactNumber" : type}" type="text" name="${type ==+ "Contact Number" ? "ContactNumber" : type}" class="w-full p-4 mb-4 border rounded" placeholder="Enter ${type}" value="${value}">
                              <div class="flex justify-end gap-2">
                                    <button id="cancel" type="button" class="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
                                    <button id="change${type === "Contact Number" ? "ContactNumber" : type}" type="button" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Change</button>
                              </div>
                  </div>
            </div>
      `;
      
      document.getElementById('adminModalPortal').innerHTML += modal;
}

function renderCodeModal(){
      const modal = `
            <div id="codeModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-2xl shadow-lg p-6 w-90 max-w-full">
                        <h2 class="text-xl font-bold mb-4 text-center">Enter 6-Digit Code</h2>
                        <div class="grid grid-cols-1 md:grid-cols-6 gap-2 mt-2 mb-4">
                              <input id="codeInput1" type="text" maxlength="1" class="w-full p-2 border border-gray-300 rounded-md text-center text-lg tracking-widest" />
                              <input id="codeInput2" type="text" maxlength="1" class="w-full p-2 border border-gray-300 rounded-md text-center text-lg tracking-widest" />
                              <input id="codeInput3" type="text" maxlength="1" class="w-full p-2 border border-gray-300 rounded-md text-center text-lg tracking-widest" />
                              <input id="codeInput4" type="text" maxlength="1" class="w-full p-2 border border-gray-300 rounded-md text-center text-lg tracking-widest" />
                              <input id="codeInput5" type="text" maxlength="1" class="w-full p-2 border border-gray-300 rounded-md text-center text-lg tracking-widest" />
                              <input id="codeInput6" type="text" maxlength="1" class="w-full p-2 border border-gray-300 rounded-md text-center text-lg tracking-widest" />
                        </div>
                        <div class="mt-4 flex justify-end gap-2 ">
                              <button id="closeCode" class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Cancel</button>
                              <button id="submitCode" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Submit</button>
                        </div>
                  </div>
            </div>
      `;

      document.getElementById('adminModalPortal').innerHTML += modal;
}

function loadingAnimation(){
      document.querySelector('#passwordModal').remove();

      const load = `
            <div id="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center h-screen inset-0 bg-black/50 text-white space-y-2">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse">Loading, please wait...</p>
            </div>
      `;      

      document.getElementById('adminModalPortal').innerHTML += load;
}

// -------------------- DATA FETCHING --------------------//
async function changePassv2(e) {
      const code = [
            document.getElementById('codeInput1').value,
            document.getElementById('codeInput2').value,
            document.getElementById('codeInput3').value,
            document.getElementById('codeInput4').value,
            document.getElementById('codeInput5').value,
            document.getElementById('codeInput6').value
      ].join(''); // combine into a single string

      const response = await fetch(`/change-password-final?code=${code}`, { method: 'POST' });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            document.querySelector('#codeModal').remove();
      }else{
            alert(result.message);
      }
}

async function changePass(e) {
      e.preventDefault();

      const new_pass = document.querySelector('input[name="new_password"]').value;
      const confirm_pass = document.querySelector('input[name="confirm_password"]').value;

      if (confirm_pass !== new_pass) return alert('Password unmatched!');

      const form = new FormData(e.target);

      try {
            loadingAnimation();

            const response = await fetch('/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });

            const result = await response.json();

            if (result.success) {
                  alert(result.message);
                  e.target.reset();
                  renderCodeModal();
            } else {
                  alert(result.message);
                  renderChangePassword(adminEmail.textContent);
            }
      } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong. Please try again.');
      } finally {
            document.getElementById('loading').remove();
      }
}

async function editInfo(type) {
      const value = document.getElementById(`input${type === "Contact" ? "ContactNumber" : type}`).value;

      const response = await fetch(`/edit-info?info=${value}&type=${type}&id=${1}`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}
      });
      const result = await response.json();

      if (result.success){
            alert(result.message);
            document.querySelector('#editModal').remove();
            adminProfile();
      }else{
            alert(result.message);
      }
}

async function adminProfile() {
      const response = await fetch(`/get-admin-profile`);
      const result = await response.json();

      if (result.success){
            const formatDate = new Date(result.data.date_pass_change).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

            adminName.textContent = result.data.username;
            adminEmail.textContent = result.data.email;
            adminNum.textContent = result.data.contact;
            datePasswordChange.textContent = formatDate;
      }else{
            alert(result.message);
      }
}

adminProfile();

// -------------------- EVENT LISTENERS -----------------//
document.addEventListener('click', (e) => {
      // open modals
      if (e.target.matches('#change-pass')) renderChangePassword(adminEmail.textContent);
      if (e.target.matches('#change-name')) renderEditModal('Name', adminName.textContent);
      if (e.target.matches('#change-num')) renderEditModal('Contact Number', adminNum.textContent);
      if (e.target.matches('#change-email')) renderEditModal('Email', adminEmail.textContent);

      // show passwords
      if (e.target.matches('.currentPass img#show')) {
            const input = e.target.closest('.currentPass').querySelector('input[name="current_password"]');
            showPassword(input, e);
      }
      if (e.target.matches('.newPass img#show')) {
            const input = e.target.closest('.newPass').querySelector('input[name="new_password"]');
            showPassword(input, e);
      }
      if (e.target.matches('.confirmPass img#show')) {
            const input = e.target.closest('.confirmPass').querySelector('input[name="confirm_password"]');
            showPassword(input, e);
      }
      
      // submit / change info
      if(e.target.matches('#changeEmail')) editInfo("Email");
      if(e.target.matches('#changeName')) editInfo("Name");
      if(e.target.matches('#changeContactNumber')) editInfo("Contact");

      // submit 6-digit code
      if(e.target.matches('#submitCode')) changePassv2(e);

      // close
      if(e.target.matches('#cancel-change-pass')) document.querySelector('#passwordModal').remove();
      if(e.target.matches('#cancel')) document.querySelector('#editModal').remove();
      if(e.target.matches('#closeCode')) document.querySelector('#codeModal').remove();
});

document.addEventListener('submit', (e) => {
      if(e.target.matches('#changePassForm')) changePass(e);
});

document.addEventListener('change', (e) => {
      if(e.target.matches('#show')) showPassword();
});

export function initPageAdmin(){
      adminProfile();
}