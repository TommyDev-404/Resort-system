
const input = document.querySelector('input[name="password"]');
const loginForm = document.getElementById('loginForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const forgotForm = document.getElementById('forgotForm');
const forgotLink = document.getElementById('forgotLink');
const backToLogin = document.getElementById('backToLogin');
const backToLogin2 = document.getElementById('backToLogin2');
const linkChangePass = document.getElementById('link-change-pass');
const loginOverlay = document.querySelector('.login-overlay');


/*---------------- LOGIN EVENT LISTENER ----------------*/
forgotLink.addEventListener('click', () => {
      loginForm.classList.add('opacity-0');
      setTimeout(() => {
            loginForm.classList.add('hidden');
            forgotForm.classList.remove('hidden');
            setTimeout(() => forgotForm.classList.add('opacity-100'), 50);
      }, 300);
});

backToLogin.addEventListener('click', () => {
      forgotForm.classList.remove('opacity-100');
      setTimeout(() => {
            forgotForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            setTimeout(() => loginForm.classList.remove('opacity-0'), 50);
      }, 300);
});

// remove password icon & show eye icon
input.addEventListener('input', (e) => {
      const img = document.querySelector('.passField img');
      console.log(e.target.value);
      if (e.target.value != ''){
            img.src = 'static/assets/eye.png';
            img.setAttribute('id', 'show');
      }else {
            e.target.setAttribute('type', 'password');
            img.src = 'static/assets/pass.png';
            img.setAttribute('id', 'ps-icon');
      }
});

// toggle view password with dynamic icon
document.addEventListener('click', (e) => {
      if (e.target.matches('#show')){
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            e.target.src = type === "password" ? 'static/assets/eye.png' : 'static/assets/hidden.png';
      }
      
      if (e.target.matches('#get_code')) forgotPassword(); 
      if (e.target.matches('#link-change-pass')) verifyCode();
      if (e.target.matches('#change-pass')) changePassword();
      if(e.target.matches('#open-login')) loginOverlay.classList.remove('hidden');
      if(e.target.matches('#close-login')) loginOverlay.classList.add('hidden');
      if (e.target.matches('#close-failed-message')) document.querySelector('#failed-message').remove();
});

// show password
document.addEventListener('change', (e) => {
      if(e.target.matches('#showPassword')) showPassword();
});

// submit form
loginForm.addEventListener('submit', (e) => loginAdmin(e) );


// ----------------- HELPERS ---------------- //
function loadingAnimation(){
      const load = `
            <div id="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center h-screen inset-0 bg-black/50 text-white space-y-2">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse">Loading, please wait...</p>
            </div>
      `;      

      document.getElementById('loadingPortal').innerHTML += load;
}

function showPassword() {
      const input = document.querySelector('#changePasswordForm input[name="new_password"]');
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
}

function successMessageCard(message, redirect=null){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="success-message">
                  <div class="bg-white w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                        <i class="ti ti-circle-check text-6xl font-light text-green-500"></i>
                        <h2 class="text-lg text-gray-600" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-message">Okay</button>
                  </div>
            </div>
      `;
      document.getElementById('messagePortal').innerHTML += msg;

      document.querySelector('#close-message').addEventListener('click', (e) => {
            if (redirect) window.location.href = redirect;
            document.querySelector('#success-message').remove();
      });
}

function failedMessageCard(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="failed-message">
                  <div class="bg-white w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                        <i class="ti ti-circle-x text-6xl font-light text-red-500"></i>
                        <h2 class="text-lg text-gray-600" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-failed-message">Okay</button>
                  </div>
            </div>
      `;

      document.getElementById('messagePortal').innerHTML += msg;
}

// ----------------- DATA --------------------//
async function loginAdmin(e) {
      e.preventDefault();
      const form = new FormData(e.target);

      try {
            loadingAnimation();
            
            const response = await fetch('/login/auth', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();
      
            console.log(result);
            if (result.success){
                  successMessageCard(result.message, result.redirect);
            }else{
                  failedMessageCard(result.message);
            }
      } catch (error) {
            console.error('Error:', error);
            failedMessageCard('Something went wrong. Please try again.');
      } finally {
            document.querySelector('#loading').remove();
      }
}

async function forgotPassword() {
      const email = document.querySelector('input[name="email"]').value;
      try {
            loadingAnimation();

            const response = await fetch(`/forgot-password`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ email : email })
            });
            const result = await response.json();
      
            console.log(result);
            if (result.success){
                  successMessageCard(result.message);
            }else{
                  failedMessageCard(result.message);
            }
      
      } catch (error) {
            console.error('Error:', error);
            failedMessageCard('Something went wrong. Please try again.');
      } finally {
            document.querySelector('#loading').remove();
      }
}

async function verifyCode() {
      const code = document.querySelector('input[name="code"]').value;

      const response = await fetch(`/forgot-password/code-verification`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code : code })
      });
      const result = await response.json();

      if (result.success){
            changePasswordForm.classList.add('opacity-0');
            setTimeout(() => {
                  forgotForm.classList.add('hidden');
                  changePasswordForm.classList.remove('hidden');
                  setTimeout(() => changePasswordForm.classList.add('opacity-100'), 50);
            }, 300);
      }else{
            failedMessageCard(result.message);
      }
}

async function changePassword() {
      const new_password = document.querySelector('input[name="new_password"]').value;
      
      try {
            loadingAnimation();

            const response = await fetch(`/change-password`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ new_password : new_password })
            });
            const result = await response.json();
      
            console.log(result);
            if (result.success){
                  successMessageCard(result.message);
                  changePasswordForm.classList.remove('opacity-100');
                  setTimeout(() => {
                        changePasswordForm.classList.add('hidden');
                        loginForm.classList.remove('hidden');
                        setTimeout(() => loginForm.classList.remove('opacity-0'), 50);
                  }, 300);
            }else{
                  failedMessageCard(result.message);
            }
      } catch (error) {
            console.error('Error:', error);
            failedMessageCard('Something went wrong. Please try again.');
      } finally {
            document.querySelector('#loading').remove();
      }
}