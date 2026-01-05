import { successToast, failedToast } from './helper.js';

lucide.createIcons();

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

backToLogin2.addEventListener('click', () => {
      forgotForm.classList.remove('opacity-100');
      setTimeout(() => {
            changePasswordForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            setTimeout(() => loginForm.classList.remove('opacity-0'), 50);
      }, 300);
});


// toggle view password with dynamic icon
document.addEventListener('click', (e) => {
      if (e.target.matches('#show')){
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            e.target.src = type === "password" ? 'static/assets/eye.webp' : 'static/assets/hidden.webp';
      }
      
      if (e.target.matches('#get_code')) forgotPassword(); 
      if (e.target.matches('#link-change-pass')) verifyCode();
      if (e.target.matches('#change-pass')) changePassword();
      if(e.target.matches('#open-login')) loginOverlay.classList.remove('hidden');
      if(e.target.matches('#close-login')) loginOverlay.classList.add('hidden');
});

// show password
document.addEventListener('change', (e) => {
      if(e.target.matches('#showPassword')) showPassword();
});

// submit form
loginForm.addEventListener('submit', (e) => loginAdmin(e) );

window.addEventListener('load', () => {
      const initial = document.getElementById('initial-loading');
      if (initial){
            initial.remove();
            document.getElementById('overlay-container').classList.remove('hidden');
      }
});

// ----------------- HELPERS ---------------- //
function showPassword() {
      const input = document.querySelector('#changePasswordForm input[name="new_password"]');
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
}

function successToastRedirect(message, redirect = null, duration = 3000) {
      const toast = `
            <div class="fixed top-4 left-1/2 z-50 flex items-center gap-4 bg-gray-50 border border-gray-200 shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-xl px-5 py-4 text-gray-800 transform -translate-x-1/2 -translate-y-full scale-95 opacity-0 transition-all duration-300 ease-out" data-toast>

                  <!-- Icon -->
                  <div class="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 border border-green-500">
                        <i data-lucide="check" class="w-5 h-5 text-green-600"></i>
                  </div>

                  <!-- Message -->
                  <span class="text-sm font-medium leading-tight">
                        ${message}
                  </span>
            </div>
      `;
      console.log(redirect);
      const portal = document.getElementById('messagePortal');
      portal.insertAdjacentHTML('beforeend', toast);
      lucide.createIcons();

      const toastEl = portal.querySelector('[data-toast]:last-child');

      // trigger slide-in
      requestAnimationFrame(() => {
            toastEl.classList.remove('-translate-y-full', 'opacity-0');
      });

      // auto remove (slide out)
      setTimeout(() => {
            toastEl.classList.add('-translate-y-full', 'opacity-0');
            setTimeout(() => toastEl.remove(), 300);
      }, duration);
      
      if (redirect) {
            showLoader('Logging in...');
            window.location.href = redirect;
      }
}

function showLoader(message) {
      const load = `
            <div id="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center h-screen inset-0 bg-black/50 text-white space-y-2">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse">${message}</p>
            </div>
      `;      

      document.getElementById('loadingPortal').innerHTML += load;
}

function hideLoader() {
const loader = document.querySelector('#loading');
if (loader) loader.remove();
}  

// ----------------- DATA --------------------//
async function loginAdmin(e) {
      e.preventDefault();
      const form = new FormData(e.target);

      try {
          // Show loader before fetch
            showLoader('Validating...');
            
            const response = await fetch('/login/auth', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(Object.fromEntries(form.entries()))
            });
            const result = await response.json();
      
            if (result.success){
                  hideLoader();
                  successToastRedirect(result.message, result.redirect);
            } else {
                  hideLoader();
                  failedToast(result.message);
            }

      } catch (error) {
            console.error('Error:', error);
            hideLoader();
            failedMessageCard1('Something went wrong. Please try again.');
      }
}

async function forgotPassword() {
      const email = document.querySelector('input[name="email"]').value;

      if (email === '') return failedToast('Empty input! Please fill in before getting code.')
      try {
            showLoader('Sending code...');
            const response = await fetch(`/forgot-password`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ email : email })
            });
            const result = await response.json();
      
            if (result.success){
                  hideLoader();
                  successToast(result.message);
            }else{
                  hideLoader();
                  failedToast('Invalid email! ');
            }
      
      } catch (error) {
            console.error('Error:', error);
            failedToast('Something went wrong. Please try again.');
      }
}

async function verifyCode() {
      const code = document.querySelector('input[name="code"]').value;

      if (code !== ''){
            showLoader('Checking code...')
            const response = await fetch(`/forgot-password/code-verification`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ code : code })
            });
            const result = await response.json();
            console.log(result);
            if (result.success){
                  hideLoader();
                  successToast('Code matched! You can now update your password.')
                  changePasswordForm.classList.add('opacity-0');
                  setTimeout(() => {
                        forgotForm.classList.add('hidden');
                        changePasswordForm.classList.remove('hidden');
                        setTimeout(() => changePasswordForm.classList.add('opacity-100'), 50);
                  }, 300);
            }else{
                  hideLoader();
                  failedToast('Invalid code! Try again.');
            }
      }else {
            failedToast('No code inputted!');
      }
}

async function changePassword() {
      const new_password = document.querySelector('input[name="new_password"]').value;
      
      try {
            showLoader('Updating password...');

            const response = await fetch(`/change-password`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ new_password : new_password })
            });
            const result = await response.json();
      
            if (result.success){
                  hideLoader();
                  successToast(result.message);
                  changePasswordForm.classList.remove('opacity-100');
                  setTimeout(() => {
                        changePasswordForm.classList.add('hidden');
                        loginForm.classList.remove('hidden');
                        setTimeout(() => loginForm.classList.remove('opacity-0'), 50);
                  }, 300);
            }else{
                  hideLoader();
                  failedToast('Failed! Something went wrong.');
            }
      } catch (error) {
            console.error('Error:', error);
            failedToast('Something went wrong. Please try again.');
      } finally {
            hideLoader();
      }
}