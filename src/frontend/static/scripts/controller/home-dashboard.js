
let occupancyChart = null;
let heavyMonthChart = null;
let mostBookedAreaChart = null;
let occupancyChartPercentage = null;

const observer = new MutationObserver(() => {
      // Safely destroy each chart if it exists
      if (typeof heavyMonthChart !== 'undefined' && heavyMonthChart) {
            heavyMonthChart.destroy();
      }

      if (typeof occupancyChart !== 'undefined' && occupancyChart) {
            occupancyChart.destroy();
      }

      if (typeof mostBookedAreaChart !== 'undefined' && mostBookedAreaChart) {
            mostBookedAreaChart.destroy();
      }
      
      if (typeof occupancyChartPercentage !== 'undefined' && occupancyChartPercentage) {
            occupancyChartPercentage.destroy();
      }
      
      drawOccupancyForecastChart();
      drawMostBookedArea();
      drawHeavyMonthChart();
      drawOccupancyPercentage();
});

observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

// --------------------------- HELPER ------------------------
async function drawOccupancyPercentage(){
      // Current occupancy
      const response = await fetch('/occupancy', {method: "GET"});
      const res = await response.json();

      document.getElementById('total-avl-rooms').textContent = res.total_room;
      const occupancyValue = res.occupancy; // target percentage
      
      // Plugin to draw animated center text
      const centerTextPlugin = {
            id: 'centerText',
            afterDraw(chart) {
                  const { ctx, chartArea: { width, height } } = chart;
                  ctx.save();
                  ctx.font = 'bold 28px sans-serif';
                  ctx.fillStyle = '#3b82f6';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
      
                  // Get the value of the first slice (animated automatically)
                  const value = chart.data.datasets[0].data[0];
                  ctx.fillText(Math.round(value) + '%', width / 2, height / 2);
                  ctx.restore();
            }
      };
      
      if (occupancyChartPercentage) occupancyChartPercentage.destroy();

      const ctx = document.getElementById('occupancyChart').getContext('2d');
            
      // Colors based on mode
      const isDarkMode = document.documentElement.classList.contains('dark');
      const occupiedColor = isDarkMode ? '#3b82f6' : '#1e40af'; // e.g., bright blue in dark, darker in light
      const availableColor = isDarkMode ? 'rgba(255,255,255,0.1)' : '#f3f4f6'; // subtle gray/white in light

      occupancyChartPercentage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                  labels: ['Occupied', 'Available'],
                  datasets: [{
                        data: [occupancyValue, 100 - occupancyValue],
                        backgroundColor: [occupiedColor, availableColor],
                        borderWidth: 0
                  }]
            },
            options: {
                  cutout: '70%',
                  responsive: true,
                  animation: {
                        duration: 2000,
                        easing: 'easeOutCubic'
                  },
                  plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                  }
            },
            plugins: [centerTextPlugin]
      });
}

async function drawOccupancyForecastChart() {
      const response = await fetch('/occupancy-forecast', { method: "GET" });
      const result = await response.json();
      const ctx = document.getElementById('occupancyChartForecast').getContext('2d');

      const historicalDatesISO = result.historical.date.map(d => new Date(d).toISOString().split('T')[0]);
      const forecastedDatesISO = result.forecasted.date.map(d => new Date(d).toISOString().split('T')[0]);

      // Merge all dates and values
      const allDatesISO = historicalDatesISO.concat(forecastedDatesISO);
      const historicalValues = result.historical.value.concat(new Array(result.forecasted.value.length).fill(null));
      const forecastValues = new Array(result.historical.value.length).fill(null).concat(result.forecasted.value);

      // Format labels for display: "Oct 10"
      const displayLabels = allDatesISO.map(d => {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      });

      // Destroy previous chart if exists
      if (occupancyChart) occupancyChart.destroy();

      // Detect dark mode
      const isDarkMode = document.documentElement.classList.contains('dark');

      occupancyChart = new Chart(ctx, {
            type: 'line',
            data: {
                  labels: displayLabels,
                  datasets: [
                        {
                              label: 'Historical Occupancy (%)',
                              data: historicalValues,
                              borderColor: '#3B82F6',
                              backgroundColor: '#3B82F6',
                              borderWidth: 2,
                              tension: 0.4,
                              pointRadius: 0,
                              spanGaps: true,
                        },
                        {
                              label: 'Forecasted Occupancy (%)',
                              data: forecastValues,
                              borderColor: '#FBBF24',
                              backgroundColor: '#FBBF24',
                              borderDash: [8, 5],
                              borderWidth: 2,
                              tension: 0.4,
                              pointRadius: 0,
                              spanGaps: true,
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
                              title: { 
                                    display: true, 
                                    text: 'Occupancy %', 
                                    color: isDarkMode ? '#E5E7EB' : '#111827' // light gray for dark mode, black for light
                              },
                              ticks: { 
                                    color: isDarkMode ? '#E5E7EB' : '#374151' 
                              },
                              grid: { 
                                    color: isDarkMode ? '#374151' : '#E5E7EB' 
                              }
                        },
                        x: {
                              ticks: { 
                                    color: isDarkMode ? '#E5E7EB' : '#374151',
                                    maxTicksLimit: 15,
                                    autoSkip: true
                              },
                              grid: { display: false }
                        }
                  },
                  plugins: {
                        legend: { 
                              labels: { 
                                    color: isDarkMode ? '#E5E7EB' : '#111827' 
                              } 
                        },
                        tooltip: {
                              mode: 'nearest',
                              intersect: false,
                              backgroundColor: '#111827',
                              titleColor: '#FBBF24',
                              bodyColor: '#F9FAFB',
                              borderColor: '#374151',
                              borderWidth: 1,
                              padding: 10,
                              titleFont: { size: 23, weight: 'bold' },
                              bodyFont: { size: 25 },
                              callbacks: {
                                    label: function (context) {
                                          return `${ context.dataset.label}: ${context.parsed.y ?? '-'}%`;
                                    }
                              }
                        }
                  }
            }
      });
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

function timeAgo(inputTime) {
      const date = new Date(inputTime);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);
      const absSec = Math.abs(diffSec); // convert into seconds

      if (Math.round(absSec / 60) < 60) return `${absSec} seconds ago`;
      if (absSec < 3600) return `${Math.floor(absSec / 60)} minutes ago`;
      if (absSec < 86400) return `${Math.floor(absSec / 3600)} hours ago`;
      return `${Math.floor(absSec / 86400)} days ago`;
}

function viewAllNotifications(){
      const modal = `
            <div id="notificationsModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50] hidden">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-md p-6 relative fade-in-up">
                  
                  <!-- Close Button -->
                  <button id="closeNotifications" class="absolute top-4 right-4 text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500">&times;</button>
                  
                  <!-- Modal Title -->
                  <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Notifications</h2>
                  
                  <!-- Notifications List -->
                  <div class="max-h-80 overflow-y-auto border-t border-b border-gray-200 dark:border-gray-700 py-2">
                        <ul id="notificationsList" class="space-y-2 text-gray-700 dark:text-gray-300">
                        <!-- Example Notification -->
                        <li class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
                        <p class="text-sm font-medium">New staff added: John Doe</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Nov 15, 2025 10:00 AM</p>
                        </li>
                        <li class="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
                        <p class="text-sm font-medium">Payroll updated</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Nov 14, 2025 05:30 PM</p>
                        </li>
                        <!-- More notifications dynamically injected here -->
                        </ul>
                  </div>
                  
                  <!-- Footer -->
                  <div class="mt-4 flex justify-end">
                        <button id="clearNotifications" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition">Clear All</button>
                  </div>
                  
                  </div>
            </div>
      `;

      document.getElementById('notificationPortal').innerHTML += modal;
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
      
      // Detect dark mode
      const isDarkMode = document.documentElement.classList.contains('dark');
  
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
                        legend: { display: false },
                        tooltip: {
                              backgroundColor: '#111827',
                              titleColor: '#FBBF24',
                              bodyColor: '#F9FAFB',
                              borderColor: '#374151',
                              borderWidth: 1,
                              padding: 10,
                              titleFont: { size: 23, weight: 'bold', family: 'Poppins' },
                              bodyFont: { size: 22, family: 'Inter' },
                              callbacks: {
                                    label: function(context) {
                                    return `${context.label}: ${context.parsed.y} Guests`;
                                    }
                              }
                        }
                        },
                  scales: {
                        x: {
                              ticks: { color: isDarkMode ? '#F9FAFB' : '#374151', font: { weight: '500' } },
                              grid: { display: false, color: isDarkMode ? '#37415133' : '#E5E7EB' }
                        },
                        y: {
                              beginAtZero: true,
                              ticks: { color: isDarkMode ? '#F9FAFB' : '#6B7280' },
                              grid: { color: isDarkMode ? '#37415133' : '#E5E7EB' }
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
            'Barkada ',
            'Big Cottage',
            'Cabana Cottage',
            'Family',
            'Garden View ',
            'Hall',
            'Premium Villa ',
            'Small Cottage',
            'Standard Villa '
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

      // Detect dark mode
      const isDarkMode = document.documentElement.classList.contains('dark');

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
                              position: 'bottom', // move legend below chart
                              align: 'center',   // center legend
                              labels: {
                                    color: isDarkMode ? '#F9FAFB' : '#374151', // white in dark mode
                                    font: { size: 10, weight: '500' }
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

async function todayProjectedRevenue(){
      // revenue
      const response = await fetch('/revenue', {method: "GET"});
      const res = await response.json();
      
      document.getElementById('total-revenue').textContent = `₱${res.current_revenue}`;
      document.getElementById('target-revenue').textContent = Number(res.change) > 0 ? `+${res.change}%` : `${res.change}%`;
}

async function notificationCount() {
      const response = await fetch('/notification-count', {method: "GET"});
      const res = await response.json();

      document.getElementById('notification-count').textContent = `${res.count}+`;
}

async function alertOccupancy() {
      document.querySelectorAll('.notif-item').forEach(item => item.remove());
      const response = await fetch('/occupancy-alert', {method: "GET"});
      const res = await response.json();
      
      let time = timeAgo(res.time);
      let notification = res.message;

      const occupancy_notif = `
            <div class="notif-item px-4 py-3 flex items-start gap-3 dark:hover:bg-gray-700 hover:bg-black/7 transition border-b border-gray-100 dark:border-transparent">
                  <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-400 mt-0.5"></i>
                  <div class="flex flex-col">
                        <p class="text-sm text-gray-800 dark:text-gray-100">${notification}</p>
                        <span class="text-xs text-gray-400 mt-1">${time}</span>
                  </div>
            </div>
      `;
      
      document.getElementById('notif-modal').insertAdjacentHTML('beforeend', occupancy_notif);
      lucide.createIcons(); 
}

async function alertHousekeeping() {
      document.querySelectorAll('.notif-item').forEach(item => item.remove());
      const response = await fetch('/housekeeping-alert', {method: "GET"});
      const res = await response.json();
      
      if (res.success){
            res.data.forEach(data => {
                  let time = timeAgo(data.date);
                  let notification = data.name;

                  const housekeeping_notif = `
                        <div class="notif-item px-4 py-3 flex items-start gap-3 dark:hover:bg-gray-700 hover:bg-black/7 transition border-b border-gray-100 dark:border-transparent">
                              <i data-lucide="house" class="w-5 h-5 text-blue-400 mt-0.5"></i>
                              <div class="flex flex-col">
                              <p class="text-sm text-gray-800 dark:text-gray-100">${notification}</p>
                              <span class="text-xs  text-gray-800 dark:text-gray-400 mt-1">${time}</span>
                              </div>
                        </div>
                  `;
                  
                  document.getElementById('notif-modal').insertAdjacentHTML('beforeend', housekeeping_notif);
                  lucide.createIcons(); 
            });
      }
}

function createMostBookedArea(area_name, percentage){
      const areas = {
            'premium': 'Premium Villa Room',
            'standard': 'Standard Villa Room',
            'barkada': 'Barkada Room',
            'garden': 'Garden View Room',
            'family': 'Family Room',
            'cabana': 'Cabana Cottage',
            'small': 'Small Cottage',
            'big': 'Big Cottage'
      };

      const area_color =  {
            'premium': 'bg-green-400',
            'standard': 'bg-yellow-400',
            'barkada': 'bg-blue-400',
            'garden': 'bg-indigo-400',
            'family': 'bg-red-400',
            'cabana': 'bg-teal-400',
            'small': 'bg-orange-400',
            'big': 'bg-purple-400'
      };

      const row = `
            <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                              <span class="w-3 h-3 ${area_color[area_name]} rounded-full"></span>
                              <p class="text-sm text-gray-800 dark:text-gray-100 font-medium">${areas[area_name]}</p>
                        </div>
                        <p class="text-sm dark:text-gray-400 text-black font-semibold">${percentage}%</p>
                  </div>
                  <div class="h-2 dark:bg-gray-700 bg-black/5 rounded-full overflow-hidden">
                        <div class="h-2 ${area_color[area_name]} rounded-full" style="width:${percentage}%"></div>
                  </div>
            </div>
      `;

      document.getElementById('top-booked-area').innerHTML += row;
}

async function mostBookedArea() {
      const area = document.getElementById('top-booked-area');
      area.querySelectorAll('div').forEach(row => row.remove());
      try{
            const response = await fetch('/top-booked-area');
            const res = await response.json();

            if (res.success){
                  res.data.forEach(data => {
                        createMostBookedArea(data.area_name, data.percentage);
                  });
            }
      }catch(err){
            console.error(err);
      }
}

document.addEventListener('click', (e) => {
      if (e.target.matches('#closeAlert')) document.getElementById('alertToast').classList.add('hidden');
      if (e.target.matches('#closeAlertHousekeeping')) document.getElementById('alertHousekeeping').classList.add('hidden');
      if (e.target.closest('#viewAllNotifications')) viewAllNotifications();
      if (e.target.matches('#closeNotifications')) document.getElementById('notificationsModal').remove();
});

loadingAnimation();
setTimeout(() => {
      mostBookedArea();
      todayGuest();
      todayCheckin();
      totalGuestInHouse();
      todayProjectedRevenue();
      drawHeavyMonthChart();
      drawOccupancyForecastChart();
      drawMostBookedArea();
      drawOccupancyPercentage();
      document.querySelector('#loading').remove();
}, 1000);

// Initial load: ensure the default content is shown and charts are drawn
export function initPageDashboard() {
      mostBookedArea();
      alertOccupancy();
      notificationCount();
      alertHousekeeping();
      todayGuest();
      todayCheckin();
      totalGuestInHouse();
      todayProjectedRevenue();
      drawHeavyMonthChart();
      drawOccupancyForecastChart();
      drawMostBookedArea();
      drawOccupancyPercentage();
};
