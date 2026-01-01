

function createRow(date, direct, online, total){
      const online_payment =  Number(online).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
      const direct_payment =  Number(direct).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
      const total_revenue =  Number(total).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
      
      const row = `
            <tr class="fade-in-up z-10 text-gray-800 bg-gray-50 dark:bg-white/2 hover:bg-black/5 dark:hover:bg-white/5 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700">
                  <td class="px-6 py-4 text-center whitespace-nowrap">${date}</td>
                  <td class="px-6 py-4 text-center  whitespace-nowrap">${direct_payment}</td>
                  <td class="px-6 py-4 text-center  whitespace-nowrap">${online_payment}</td>
                  <td class="px-6 py-4 text-center  whitespace-nowrap">${total_revenue}</td>
            </tr>
      `;

      document.getElementById('accounting-tbody').innerHTML += row;
}

function removePrevRow(){
      document.querySelectorAll('#accounting-tbody tr').forEach(row => row.remove());
}

function formatPesoShort1(num) {
      if (num >= 1_000_000_000) return "₱" + (num / 1_000_000_000).toFixed(2).replace(/\.0$/, "") + "B";  
      if (num >= 1_000_000)     return "₱" + (num / 1_000_000).toFixed(2).replace(/\.0$/, "") + "M";  
      if (num >= 1_000)         return "₱" + (num / 1_000).toFixed(2).replace(/\.0$/, "") + "K";  
      return "₱" + num.toLocaleString("en-PH");
}

function loadingAnimation0(){
      const load = `
            <div id="loading" class="absolute top-45 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center h-auto text-white space-y-2 z-50 ">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black">Fetching data...</p>
            </div>
      `;      

      document.getElementById('loadingAccountingPortal').innerHTML += load;
}

function showLoader() {
      loadingAnimation0(); // adds #loading inside #loadingPortal
}

function hideLoader() {
      const loader = document.querySelector('#loading');
      if (loader) loader.remove();
}

async function getYearNow(){
      const response = await fetch('/get-years');
      const result = await response.json();

      result.years.forEach(year => {
            const option = document.createElement("option"); 
            option.value = year.year;
            option.textContent = year.year;
      
            if (year.year === new Date().getFullYear()) option.selected = true; 
      
            document.getElementById('filter-payment').appendChild(option);
      });
}

async function getSummaryData() {
      const response = await fetch('/accounting-data');
      const result = await response.json();

      document.getElementById('direct-payment').textContent = formatPesoShort1(Number(result.direct));
      document.getElementById('online-payment').textContent = formatPesoShort1(Number(result.online));
      document.getElementById('booking-revenue').textContent = formatPesoShort1(Number(result.total_revenue));
}

async function loadBookingRevenue(year) {
      showLoader();
      const response = await fetch(`/load-revenue?year=${year}`);
      const result = await response.json();

      if (result.success){
            removePrevRow();
            result.data.forEach(data => {
                  createRow(data.month_name, data.direct, data.online, data.total);
            });
      }else {
            alert('Failed to fetch data.');
      }
      hideLoader();
}

document.addEventListener('change', (e) => {
      if (e.target.matches('#filter-payment')) loadBookingRevenue(e.target.value);
});

getYearNow();

export function initPageAccounting(){
      getSummaryData();
      loadBookingRevenue('2025');
}