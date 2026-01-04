
export function successToast(message, redirect = null, duration = 3000) {
      const toast = `
            <div class="fixed top-4 right-4 z-50 w-auto flex items-center gap-3 bg-white dark:bg-gray-900 border-l-4 border-green-500 shadow-lg rounded-md px-5 py-4 text-gray-700 dark:text-white transform translate-x-full opacity-0 transition-all duration-300 ease-out" data-toast>
                  <i data-lucide="circle-check" class="w-6 h-6 text-green-500"></i>
                  <span class="text-sm font-medium">${message}</span>
            </div>
      `;

      const portal = document.getElementById('messagePortal');
      portal.insertAdjacentHTML('beforeend', toast);
      lucide.createIcons();

      const toastEl = portal.querySelector('[data-toast]:last-child');

      // trigger slide-in
      requestAnimationFrame(() => {
            toastEl.classList.remove('translate-x-full', 'opacity-0');
      });

      // auto remove (slide out)
      setTimeout(() => {
            toastEl.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toastEl.remove(), 300);
      }, duration);
      
      if (redirect) {
            showLoader('Logging out...');
            window.location.href = redirect;
      }
}

export function failedToast(message, duration = 3000) {
      const toast = `
            <div class="fixed top-8 right-4 z-50 w-[300px] flex items-center gap-3 bg-white dark:bg-gray-900 border-l-4 border-red-500 shadow-lg rounded-md px-5 py-4 text-gray-700 dark:text-white transform translate-x-full opacity-0 transition-all duration-300 ease-out" data-toast>
                  <i data-lucide="circle-x" class="w-6 h-6 text-red-500"></i>
                  <span class="text-sm font-medium">${message}</span>
            </div>
      `;

      const portal = document.getElementById('messagePortal');
      portal.insertAdjacentHTML('beforeend', toast);
      lucide.createIcons();

      const toastEl = portal.querySelector('[data-toast]:last-child');

      // trigger slide-in
      requestAnimationFrame(() => {
            toastEl.classList.remove('translate-x-full', 'opacity-0');
      });

      // auto remove (slide out)
      setTimeout(() => {
            toastEl.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toastEl.remove(), 300);
      }, duration);
}

export function successToastRedirect(message, redirect = null, duration = 3000) {
      const toast = `
            <div class="fixed top-8 right-6 z-50 w-[300px] flex items-center gap-3 bg-white dark:bg-gray-900 border-l-4 border-green-500 shadow-lg rounded-md px-5 py-4 text-gray-700 dark:text-white transform translate-x-full opacity-0 transition-all duration-300 ease-out" data-toast>
                  <i data-lucide="circle-check" class="w-6 h-6 text-green-500"></i>
                  <span class="text-sm font-medium">${message}</span>
            </div>
      `;

      const portal = document.getElementById('messagePortal');
      portal.insertAdjacentHTML('beforeend', toast);
      lucide.createIcons();

      const toastEl = portal.querySelector('[data-toast]:last-child');

      // trigger slide-in
      requestAnimationFrame(() => {
            toastEl.classList.remove('translate-x-full', 'opacity-0');
      });

      // auto remove (slide out)
      setTimeout(() => {
            toastEl.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toastEl.remove(), 300);
      }, duration);
      
      if (redirect) {
            showLoader('Logging out...');
            window.location.href = redirect;
      }
}

export function promoDateWarningMessageCard(message) {
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-50" id="warning-message">
                  <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4 fade-in-up">
                        <i data-lucide="alert-circle" class="w-15 h-15 text-red-500"></i>
                        <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600 px-6 py-2" id="close-message">Okay</button>
                  </div>
            </div>
      `;

      // Append message popup
      document.getElementById('messagePortal').innerHTML += msg;
      lucide.createIcons();

      document.getElementById("close-message").addEventListener("click", () =>  {
            const box = document.querySelector("#warning-message");
            box.remove();
      });
}

export function promoRemoveWarningMessageCard(message) {
      const msg = `
          <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-50" id="warning-message">
              <div class="bg-white dark:bg-gray-900 w-[23%] h-auto shadow-md rounded-sm flex flex-col justify-center items-center p-6 text-center gap-4 fade-in-up">
                  <i data-lucide="alert-circle" class="w-15 h-15 text-red-500"></i>
                  <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
  
                  <div class="flex gap-4 mt-4">
                      <button class="bg-blue-500 text-white rounded-lg hover:bg-blue-600 px-6 py-2" id="confirm-remove">Okay</button>
                      <button class="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 px-6 py-2" id="cancel-remove">Cancel</button>
                  </div>
              </div>
          </div>
      `;

      // Append the popup
      document.getElementById('messagePortal').innerHTML += msg;
      lucide.createIcons();
}
