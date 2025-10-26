
let occupancyChart = null;
let heavyMonthChart = null;

      // --------------------------- HELPER ------------------------
async function drawOccupancyForecastChart() {
      const response = await fetch('/occupancy-forecast', { method: "GET" });
      const result = await response.json();
      
      const ctx = document.getElementById('occupancyChartForecast').getContext('2d');

      // Convert dates to ISO internally
      const historicalDatesISO = result.historical.date.map(d => new Date(d).toISOString().split('T')[0]);
      const forecastedDatesISO = result.forecasted.date.map(d => new Date(d).toISOString().split('T')[0]);

      // Merge all dates and values
      const allDatesISO = historicalDatesISO.concat(forecastedDatesISO);
      const historicalValues = result.historical.value.concat(new Array(result.forecasted.value.length).fill(null));
      const forecastValues = new Array(result.historical.value.length).fill(null).concat(result.forecasted.value);

      // Format labels for display: "Oct 10"
      const displayLabels = allDatesISO.map(d => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
      });
      
      if (occupancyChart) occupancyChart.destroy();

      occupancyChart = new Chart(ctx, {
            type: 'line',
            data: {
                  labels: displayLabels,
                  datasets: [
                  {
                        label: 'Historical Occupancy (%) ',
                        data: historicalValues,
                        borderColor: '#0aeb30ff',  // Blue
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                  },
                  {
                        label: 'Forecasted Occupancy(%) ',
                        data: forecastValues,
                        borderColor: '#e2280fff',  // Green
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                  }
                  ]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                  y: {
                        min: 0,
                        max: 100,
                        title: { display: true, text: 'Occupancy %', color: '#555' },
                        grid: { color: '#eee' }
                  },
                  x: {
                        ticks: { maxTicksLimit: 15, autoSkip: true },
                        grid: { display: false }
                  }
                  },
                  plugins: {
                  legend: { display: true },
                  tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                              label: function (context) {
                              // Show ISO date in tooltip
                              const isoDate = allDatesISO[context.dataIndex];
                              return `${context.dataset.label}: ${context.parsed.y ?? '-'}%`;
                              }
                        }
                  }
                  },
            }
      });
}

function displayAlert(res, type){
      if (type === 'occupancy'){
            const alert_card = document.getElementById('alertToast');
            alert_card.classList.remove('hidden');
      
            document.getElementById('alertMessage').textContent = res.message;
            document.getElementById('data').textContent = `Average Occupancy Percentage: ${res.data}%`;      
      }else{
            const alert_card = document.getElementById('alertHousekeeping');
            alert_card.classList.remove('hidden');
      
            document.getElementById('alertMessage2').textContent = res.message;
      }
}

function loadingAnimation(){
      const load = `
            <div id="loading" class="absolute top-0 left-0 z-50 flex flex-col items-center justify-center h-screen inset-0 bg-black/50 text-white space-y-2">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse">Loading, please wait...</p>
            </div>
      `;      

      document.getElementById('adminModalPortal').innerHTML += load;
}

async function drawHeavyMonthChart() {
      const response = await fetch('/heavy-guest-month', {method: "GET"});
      const result = await response.json();
      const ctx = document.getElementById('heavy-month-chart').getContext('2d');

      // Mock Data: Historical average guest count by month
      const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            values: result.value,
      };

      // Identify the peak month (July - index 6)
      const maxGuests = Math.max(...data.values);
      const backgroundColors = data.values.map(v => 
            v === maxGuests ? '#ffc107' : '#10569c' // Highlight peak month with secondary-gold
      );

      if (heavyMonthChart){
            heavyMonthChart.destroy();
      }

      heavyMonthChart = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels: data.labels,
                  datasets: [{
                        label: 'Avg. Guest Volume (Past 3 Yrs)',
                        data: data.values,
                        backgroundColor: backgroundColors,
                        hoverBackgroundColor: '#0e4a86',
                        borderRadius: 4, // Add rounded corners to bars
                  }]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                        y: {
                              beginAtZero: true,
                              title: { display: true, text: 'Total Guests', color: '#555' },
                              grid: { color: '#eee' }
                        },
                        x: {
                              grid: { display: false }
                        }
                  },
                  plugins: {
                        legend: { display: false },
                        tooltip: {
                        callbacks: {
                              label: function(context) {
                                    return ' Avg. Guests: ' + context.parsed.y.toLocaleString();
                              }
                        }
                        }
                  }
            }
      });
}

async function totalGuestInHouse() {
      // total guest in house
      const response = await fetch('/total-guest-in-house', {method: "GET"});
      const res = await response.json();

      document.getElementById('total-guest-in-house').textContent = res.today;
      document.getElementById('change-rate-guest').textContent = res.change > 0 ? `+${res.change}` : `${res.change}`;
}

async function todayGuest() {
      // total guest in house
      const response = await fetch('/today-guest', {method: "GET"});
      const res = await response.json();

      document.getElementById('today-guest').textContent = res.today_guest;
      document.getElementById('change-rate-today-guest').textContent = res.change > 0 ? `+${res.change}` : `${res.change}`;
}

async function todayCheckin() {
      // total check in
      const response = await fetch('/today-checkin', {method: "GET"});
      const res = await response.json();
      document.getElementById('check-ins-data').textContent = res.check_in;
      document.getElementById('change-rate-checkin').textContent = Number(res.change) < 0  || Number(res.change) == 0 ? `${res.change}` : `+${res.change}`;
}

async function todayOccupancy() {
      // Current occupancy
      const response = await fetch('/occupancy', {method: "GET"});
      const res = await response.json();

      document.getElementById('occupancy-rate').textContent = `${res.occupancy}%`;
      document.getElementById('total-room').textContent = res.total_room;
}

async function todayProjectedRevenue(){
      // revenue
      const response = await fetch('/revenue', {method: "GET"});
      const res = await response.json();
      
      document.getElementById('total-revenue').textContent = `₱${res.current_revenue}`;
      document.getElementById('target-revenue').textContent = Number(res.change) > 0 ? `+${res.change}%` : `${res.change}%`;
}

async function alertOccupancy() {
      const response = await fetch('/occupancy-alert', {method: "GET"});
      const res = await response.json();

      if (res.message != null){
            displayAlert(res, 'occupancy');
      }
}

async function alertHousekeeping() {
      const response = await fetch('/housekeeping-alert', {method: "GET"});
      const res = await response.json();
      
      if (res.message != null){
            displayAlert(res, 'housekeeping');
      }
}

document.addEventListener('click', (e) => {
      if (e.target.matches('#closeAlert')) document.getElementById('alertToast').classList.add('hidden');
      if (e.target.matches('#closeAlertHousekeeping')) document.getElementById('alertHousekeeping').classList.add('hidden');
});

loadingAnimation();
setTimeout(() => {
      alertOccupancy();
      alertHousekeeping();
      todayGuest();
      todayCheckin();
      totalGuestInHouse();
      todayOccupancy();
      todayProjectedRevenue();
      drawHeavyMonthChart();
      drawOccupancyForecastChart();

      document.querySelector('#loading').remove();
}, 1000);

// Initial load: ensure the default content is shown and charts are drawn
export function initPageDashboard() {
      alertOccupancy();
      alertHousekeeping();
      todayGuest();
      todayCheckin();
      totalGuestInHouse();
      todayOccupancy();
      todayProjectedRevenue();
      drawHeavyMonthChart();
      drawOccupancyForecastChart();
};
