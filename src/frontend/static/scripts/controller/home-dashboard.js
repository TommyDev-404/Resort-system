
let occupancyChart = null;
let heavyMonthChart = null;
let occupancyChartHistorical = null;
let mostBookedAreaChart = null;


// --------------------------- HELPER ------------------------
async function drawOccupancyForecastChart() {
      const response = await fetch('/occupancy-forecast', { method: "GET" });
      const result = await response.json();
      
      const ctx = document.getElementById('occupancyChartForecast').getContext('2d');

      // Convert dates to ISO internally
      const forecastedDatesISO = result.forecasted.date.map(d => new Date(d).toISOString().split('T')[0]);

      // Merge all dates and values
      const allDatesISO = forecastedDatesISO.slice(0, 30);
      const forecastValues = result.forecasted.value.slice(0, 30);

      // Format labels for display: "Oct 10"
      const displayLabels = allDatesISO.map(d => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
      });
      
      if (occupancyChart) occupancyChart.destroy();

      occupancyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels: displayLabels,
                  datasets: [
                        {
                              label: 'Forecasted Occupancy(%) ',
                              data: forecastValues,
                              backgroundColor: '#fa0909ff',
                              borderWidth: 1,
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
                        backgroundColor: '#111827',
                        titleColor: '#FBBF24',
                        bodyColor: '#F9FAFB',
                        borderColor: '#374151',
                        borderWidth: 1,
                        padding: 10,
                        titleFont: {
                              size: 23,      // title (month)
                              weight: 'bold',
                              family: 'Poppins' // optional
                        },
                        bodyFont: {
                              size: 22,      // label text (guest value)
                              family: 'Inter' // optional
                        },
                        callbacks: {
                              label: function (context) {
                              const isoDate = allDatesISO[context.dataIndex];
                              return `${context.dataset.label}: ${context.parsed.y ?? '-'}%`;
                              }
                        }
                  }
                  },
            }
      });
}

async function drawOccupancyHistoricalChart() {
      const response = await fetch('/occupancy-forecast', { method: "GET" });
      const result = await response.json();
      
      const ctx = document.getElementById('occupancyChartHistorical').getContext('2d');

      // Convert dates to ISO internally
      const historicalDatesISO = result.historical.date.map(d => new Date(d).toISOString().split('T')[0]);

      // Merge all dates and values
      const allDatesISO = historicalDatesISO;
      const historicalValues = result.historical.value.concat(new Array(result.forecasted.value.length).fill(null));

      // Format labels for display: "Oct 10"
      const displayLabels = allDatesISO.map(d => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
      });
      
      if (occupancyChartHistorical) occupancyChartHistorical.destroy();

      occupancyChartHistorical = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels: displayLabels,
                  datasets: [
                  {
                        label: 'Historical Occupancy (%) ',
                        data: historicalValues,
                        backgroundColor: '#0aeb30ff',  // Blue
                        borderWidth: 1,
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
                        backgroundColor: '#111827',
                        titleColor: '#FBBF24',
                        bodyColor: '#F9FAFB',
                        borderColor: '#374151',
                        borderWidth: 1,
                        padding: 10,
                        titleFont: {
                              size: 23,      // title (month)
                              weight: 'bold',
                              family: 'Poppins' // optional
                        },
                        bodyFont: {
                              size: 22,      // label text (guest value)
                              family: 'Inter' // optional
                        },
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
      const response = await fetch('/heavy-guest-month', { method: "GET" });
      const result = await response.json();
      const ctx = document.getElementById('heavy-month-chart').getContext('2d');
  
      // Labels for all 12 months
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
      // Ensure data always has 12 values (fill missing with 0)
      const values = Array(12).fill(0);
      if (result.value && Array.isArray(result.value)) {
            result.value.forEach((v, i) => {
                  if (i < 12) values[i] = v;
            });
      }

      // Highlight the peak month with a bright color
      const maxGuests = Math.max(...values);
      const backgroundColors = values.map((v, i) => 
            v === maxGuests ? '#FBBF24' : '#1139e9ff'
      );
  
      // Destroy previous chart if it exists
      if (typeof heavyMonthChart !== 'undefined' && heavyMonthChart) {
            heavyMonthChart.destroy();
      }
  
      // Create the bar chart
      heavyMonthChart = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels,
                  datasets: [{
                        data: values,
                        backgroundColor: backgroundColors,
                        hoverOffset: 12,
                        borderWidth: 0,
                  }]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                        legend: {
                              display: false // no legend since each bar is a month
                        },
                        tooltip: {
                              backgroundColor: '#111827',
                              titleColor: '#FBBF24',
                              bodyColor: '#F9FAFB',
                              borderColor: '#374151',
                              borderWidth: 1,
                              padding: 10,
                              titleFont: {
                                    size: 23,      // title (month)
                                    weight: 'bold',
                                    family: 'Poppins' // optional
                              },
                              bodyFont: {
                                    size: 22,      // label text (guest value)
                                    family: 'Inter' // optional
                              },
                              callbacks: {
                                    label: function(context) {
                                          return `${context.label}: ${context.parsed.y} Guests`;
                                    }
                              }
                        }
                  },
                  scales: {
                        x: {
                              ticks: { color: '#374151', font: { weight: '500' } },
                              grid: { display: false }
                        },
                        y: {
                              beginAtZero: true,
                              ticks: { color: '#6B7280' },
                              grid: { color: '#E5E7EB' }
                        }
                  }
            }
      });
}

async function drawMostBookedArea() {
      const response = await fetch('/most-booked-area', { method: "GET" });
      const result = await response.json(); // e.g., {barkada: "71", big: null, cabana: "177", ...}
      const ctx = document.getElementById('mostBookedAreaChart').getContext('2d');
  
      // Extract labels and values, convert null to 0 and strings to numbers
      const values = Object.values(result).map(v => v ? Number(v) : 0);
      const labels = [
            'Barkada Room',
            'Big Cottage',
            'Cabana Cottage',
            'Family Room',
            'Garden View Room',
            'Hall',
            'Premium Villa Room',
            'Small Cottage',
            'Standard Villa Room'
      ];

      // Colors for each segment
      const colors = [
          '#4F46E5', '#3B82F6', '#0EA5E9', '#14B8A6', '#22C55E', 
          '#84CC16', '#FACC15', '#F97316', '#EF4444', '#E11D48', 
          '#8B5CF6', '#6366F1'
      ];
      const backgroundColors = labels.map((_, i) => colors[i % colors.length]);
  
      // Destroy previous chart if exists
      if (typeof mostBookedAreaChart !== 'undefined' && mostBookedAreaChart) {
          mostBookedAreaChart.destroy();
      }
  
      // Create pie chart
      mostBookedAreaChart = new Chart(ctx, {
          type: 'pie',
          data: {
              labels: labels,
              datasets: [{
                  data: values,
                  backgroundColor: backgroundColors,
                  borderWidth: 1,
                  hoverOffset: 12,
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      position: 'right',
                      labels: {
                          color: '#374151',
                          font: { size: 14, weight: '500' }
                      }
                  },
                  tooltip: {
                      backgroundColor: '#111827',
                      titleColor: '#FBBF24',
                      bodyColor: '#F9FAFB',
                      borderColor: '#374151',
                      borderWidth: 1,
                      padding: 10,
                      titleFont: { size: 23, weight: 'bold' },
                      bodyFont: { size: 22 },
                      callbacks: {
                          label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              return `${label}: ${value} Bookings`;
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
      drawOccupancyHistoricalChart();
      drawMostBookedArea();
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
      drawMostBookedArea();
      drawOccupancyHistoricalChart();
};
