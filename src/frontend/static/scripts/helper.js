
export function successToast(message, redirect = null, duration = 3000) {
      const toast = `
            <div class="fixed top-4 left-1/2 z-50 flex items-center gap-4 dark:text-gray-100 bg-gray-50  dark:bg-gray-600 border   border-gray-200 dark:border-gray-500 shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-xl px-5 py-4 text-gray-800 transform -translate-x-1/2 -translate-y-full scale-95 opacity-0 transition-all duration-300 ease-out" data-toast>

                  <!-- Icon -->
                  <div class="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 border border-green-500 dark:bg-green-500">
                        <i data-lucide="check" class="w-5 h-5 text-green-600 dark:text-white"></i>
                  </div>

                  <!-- Message -->
                  <span class="text-sm font-medium leading-tight">
                        ${message}
                  </span>
            </div>
      `;

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
}

export function failedToast(message, duration = 3000) {
      const toast = `
            <div class="fixed top-4 left-1/2 z-50 flex items-center gap-4 dark:text-gray-100 bg-gray-50  dark:bg-gray-600 border   border-gray-200 dark:border-gray-500 shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-xl px-5 py-4 text-gray-800 transform -translate-x-1/2 -translate-y-full scale-95 opacity-0 transition-all duration-300 ease-out" data-toast>

                  <!-- Icon -->
                  <div class="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 border border-red-500">
                        <i data-lucide="x" class="w-5 h-5 text-red-600"></i>
                  </div>

                  <!-- Message -->
                  <span class="text-sm font-medium leading-tight">
                        ${message}
                  </span>
            </div>
      `;

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
}

export function promoDateWarningMessageCard(message) {
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center z-80" id="warning-message">
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
                  <i data-lucide="alert-circle" class="w-20 h-20 text-red-500"></i>
                  <h2 class="text-lg text-gray-600 dark:text-white" id="message">${message}</h2>
  
                  <div class="flex gap-4 mt-4">
                      <button class="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 px-6 py-2" id="cancel-remove">Cancel</button>
                      <button class="bg-blue-500 text-white rounded-lg hover:bg-blue-600 px-6 py-2" id="confirm-remove">Okay</button>
                  </div>
              </div>
          </div>
      `;

      // Append the popup
      document.getElementById('messagePortal').innerHTML += msg;
      lucide.createIcons();
}
