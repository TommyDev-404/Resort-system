

function createRow(date, direct, online){
      const row = `
            <tr class="fade-in-up">
                  <td class="px-6 py-4 whitespace-nowrap">${date}</td>
                  <td class="px-6 py-4 whitespace-nowrap">₱${direct}</td>
                  <td class="px-6 py-4 whitespace-nowrap">₱${online}</td>
            </tr>
      `;

      document.getElementById('accounting-tbody').innerHTML += row;
}

function removePrevRow(){
      document.querySelectorAll('#accounting-tbody tr').forEach(row => row.remove());
}

async function getYears(){
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

      document.getElementById('direct-payment').textContent = `₱${result.direct}`;
      document.getElementById('online-payment').textContent = `₱${result.online}`;
      document.getElementById('booking-revenue').textContent = `₱${result.total_revenue}`;
}

async function loadBookingRevenue(year) {
      const response = await fetch(`/load-revenue?year=${year}`);
      const result = await response.json();

      if (result.success){
            removePrevRow();
            result.data.forEach(data => {
                  createRow(data.month_year, data.direct, data.online);
            });
      }else {
            alert('Failed to fetch data.');
      }
}

document.addEventListener('change', (e) => {
      if (e.target.matches('#filter-payment')) loadBookingRevenue(e.target.value);
});

getYears();

export function initPageAccounting(){
      getSummaryData();
      loadBookingRevenue('2025');
}