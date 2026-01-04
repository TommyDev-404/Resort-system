import './chart.umd.js';

let checkinChart = null;
let revenueCharts = null;
let heavyMonthChart = null;
let mostBookedAreaChart = null;
let occupancyChart = null;

const observer = new MutationObserver(() => {
      // Safely destroy each chart if it exists
      if (typeof checkinChart !== 'undefined' && checkinChart) {
            checkinChart.destroy();
      }

      if (typeof revenueCharts !== 'undefined' && revenueCharts) {
            revenueCharts.destroy();
      }

      drawRevenueChart();
      drawCheckinForecastChart();
      drawHeavyMonthChart();
      drawMostBookedArea();
      drawOccupancyForecastChart();
});

observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

// ---------------------- HELPERS -------------------------
async function drawCheckinForecastChart(type=null) {
      const url = type ? `/checkin-forecast-type?accomodation_type=${type}` : '/checkin-forecast-all';
      const response = await fetch(url);
      const result = await response.json();

      const ctx = document.getElementById('checkin-forecast-chart').getContext('2d');

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
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      if (checkinChart) {
            checkinChart.destroy();
      }

      const isDarkMode = document.documentElement.classList.contains('dark');

      checkinChart = new Chart(ctx, {
            type: 'line',
            data: {
                  labels: displayLabels,
                  datasets: [
                        {
                              label: 'Historical Check-in',
                              data: historicalValues,
                              borderColor: '#0bda0bff',
                              backgroundColor: '#18e411a8',
                              borderWidth: 2,
                              tension: 0.4,
                              pointRadius: 0,
                              spanGaps: true,
                              fill: true
                        },
                        {
                              label: 'Forecasted Check-in',
                              data: forecastValues,
                              borderColor: '#0a33ebff',
                              backgroundColor: '#0e24eb8e',
                              borderDash: [8, 5],
                              borderWidth: 2,
                              tension: 0.4,
                              pointRadius: 0,
                              spanGaps: true,
                              fill: true
                        }
                  ]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                        y: {
                              min: 0,
                              max: 50,
                              title: { 
                                    display: true, 
                                    text: 'Checkin % ', 
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
                                          return `${context.dataset.label}: ${context.parsed.y ?? '-'} Check-ins`;
                                    }
                              }
                        }
                  }
            }
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
                              backgroundColor: '#508ae9b7',
                              borderWidth: 2,
                              tension: 0.4,
                              pointRadius: 0,
                              spanGaps: true,
                              fill: true
                        },
                        {
                              label: 'Forecasted Occupancy (%)',
                              data: forecastValues,
                              borderColor: '#FBBF24',
                              backgroundColor: '#e0f006af',
                              borderDash: [8, 5],
                              borderWidth: 2,
                              tension: 0.4,
                              pointRadius: 0,
                              spanGaps: true,
                              fill: true
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

async function drawRevenueChart(type=null) {
      const url = type ? `/revenue-forecast-type?accomodation_type=${type}` : '/revenue-forecast-all';
      const response = await fetch(url);
      const result = await response.json();

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const latestRevenue = Array(12).fill(null);
      const forecastedRevenue = Array(12).fill(null);

      // Historical
      result.historical.month.forEach((m, i) => {
            latestRevenue[m - 1] = result.historical.value[i]; // month 1 → index 0
      });

      // Forecasted
      result.forecasted.month.forEach((m, i) => {
            forecastedRevenue[m - 1] = result.forecasted.value[i];
      });

      // Now latestRevenue and forecastedRevenue can be used in your chart
      const ctx = document.getElementById('revenueForecastChart').getContext('2d');
      
      if (revenueCharts) {
            revenueCharts.destroy();
      }

      const isDarkMode = document.documentElement.classList.contains('dark');

      revenueCharts = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels: months,
                  datasets: [
                        {
                              label: 'Historical Revenue (₱)',
                              data: latestRevenue,
                              backgroundColor: 'rgba(233, 195, 24, 1)',
                              borderWidth: 1,
                              borderRadius: 6
                        },
                        {
                              label: 'Forecasted Revenue (₱)',
                              data: forecastedRevenue,
                              backgroundColor: 'rgba(230, 7, 174, 1)',
                              borderWidth: 1,
                              borderRadius: 6
                        }
                  ]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                        legend: { 
                              labels: { 
                                    color: isDarkMode ? '#E5E7EB' : '#111827' 
                              } 
                        },
                        tooltip: {
                              backgroundColor: '#111827',  // dark background
                              titleColor: '#FBBF24',       // title (month) color
                              bodyColor: '#F9FAFB',        // value text color
                              borderColor: '#374151',
                              borderWidth: 1,
                              padding: 10,
                              titleFont: { size: 23, weight: 'bold' },
                              bodyFont: { size: 22 },
                              callbacks: {
                              // Format tooltip text
                              label: function(context) {
                                    const value = context.parsed.y;
                                    return `${context.dataset.label}: ₱${value?.toLocaleString() ?? '-'}`;
                              }
                              }
                        }
                  },
                  scales: {
                        y: { 
                              beginAtZero: true, 
                              max: 1000000,
                              title: {
                                    color: isDarkMode ? '#E5E7EB' : '#374151',
                                    display: true, 
                                    text: 'Revenue (₱)' 
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
                                    autoSkip: false 
                              },
                              grid: { display: false }
                        }
                  }
            }
      });
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
                        borderRadius: 10
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
                              titleFont: { size: 23, weight: 'bold'},
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
                              ticks: { color: isDarkMode ? '#E5E7EB' : '#374151'  },
                              grid: { color: isDarkMode ? '#374151' : '#E5E7EB'  }
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

async function occupancyData(type=null) {
      const url = type ? `/mtd-occupancy-type?accomodation_type=${type}` : '/mtd-occupancy-all';
      const response = await fetch(url);
      const res = await response.json();

      document.getElementById('occupancy-percentage').textContent = `${res.current}%`;
      document.getElementById('occupancy-change').textContent = res.change < 0 ? `${res.change}%` : `+${res.change}%`;
      document.getElementById('current-occupancy-data').textContent = `${Math.round(res.current)}%`;

      if (res.change < 0){
            document.getElementById('occupancy-change').classList.remove('text-green-500', 'dark:text-green-400');
            document.getElementById('occupancy-change').classList.add('text-red-500', 'dark:text-red-500');
            document.getElementById('change-occupancy-icon').setAttribute("data-lucide", "arrow-down");
            document.getElementById('change-occupancy-icon').classList.remove("text-green-500", 'dark:text-green-400');
            document.getElementById('change-occupancyt-icon').classList.add("text-red-500", 'dark:text-red-500');
      }else{
            document.getElementById('occupancy-change').classList.remove('text-red-500', 'dark:text-red-500');
            document.getElementById('occupancy-change').classList.add('text-green-500', 'dark:text-green-400');
            document.getElementById('change-occupancy-icon').setAttribute("data-lucide", "arrow-up");
            document.getElementById('change-occupancy-icon').classList.remove("text-red-500", 'dark:text-red-500');
            document.getElementById('change-occupancy-icon').classList.add("text-green-500", 'dark:text-green-400');
      }

      lucide.createIcons();
}

async function dailyRevenue(type=null){  
      const url = type ? `/daily-revenue-type?accomodation_type=${type}` : 'daily-revenue-all';
      const response = await fetch(url);
      const res = await response.json();

      document.getElementById('today-revenue-analytics').textContent = formatPesoShort3(Number(res.current));
      document.getElementById('today-revenue-change').textContent = res.change < 0? `${res.change}%` : `+${res.change}%`;

      if (res.change < 0){
            document.getElementById('today-revenue-change').classList.remove('text-green-500', 'dark:text-green-400');
            document.getElementById('today-revenue-change').classList.add('text-red-500', 'dark:text-red-500');
            document.getElementById('change-today-icon').setAttribute("data-lucide", "arrow-down");
            document.getElementById('change-today-icon').classList.remove("text-green-500", 'dark:text-green-400');
            document.getElementById('change-today-icon').classList.add("text-red-500", 'dark:text-red-500');
      }else{
            document.getElementById('today-revenue-change').classList.remove('text-red-500', 'dark:text-red-500');
            document.getElementById('today-revenue-change').classList.add('text-green-500', 'dark:text-green-400');
            document.getElementById('change-today-icon').setAttribute("data-lucide", "arrow-up");
            document.getElementById('change-today-icon').classList.remove("text-red-500", 'dark:text-red-500');
            document.getElementById('change-today-icon').classList.add("text-green-500", 'dark:text-green-400');
      }
      
      lucide.createIcons();
}

async function monthlyRevenue(type=null){
      const url = type ? `/monthly-revenue-type?accomodation_type=${type}` : '/monthly-revenue-all';
      const response = await fetch(url);
      const res = await response.json();

      document.getElementById('monthly-revenue-analytics').textContent = formatPesoShort3(Number(res.monthly));
      document.getElementById('monthly-revenue-change').textContent = res.change < 0 ? `${res.change}%` : `+${res.change}%`;    
      
      if (res.change < 0){
            document.getElementById('monthly-revenue-change').classList.remove('text-green-500', 'dark:text-green-400');
            document.getElementById('monthly-revenue-change').classList.add('text-red-500', 'dark:text-red-500');
            document.getElementById('change-monthly-icon').setAttribute("data-lucide", "arrow-down");
            document.getElementById('change-monthly-icon').classList.remove("text-green-500", 'dark:text-green-400');
            document.getElementById('change-monthly-icon').classList.add("text-red-500", 'dark:text-red-500');
      }else{
            document.getElementById('monthly-revenue-change').classList.remove('text-red-500'), 'dark:text-red-500';
            document.getElementById('monthly-revenue-change').classList.add('text-green-500', 'dark:text-greeen-500');
            document.getElementById('change-monthly-icon').setAttribute("data-lucide", "arrow-up");
            document.getElementById('change-monthly-icon').classList.remove("text-red-500", 'dark:text-red-500');
            document.getElementById('change-monthly-icon').classList.add("text-green-500", 'dark:text-green-400');
      }
      lucide.createIcons();
}

async function targetRevenue(type=null){
      const url = type ? `/target-revenue-type?accomodation_type=${type}` : '/target-revenue';
      const response = await fetch(url);
      const res = await response.json();

      document.getElementById('target').textContent =  formatPesoShort3(Number(res.target));
}

function formatPesoShort3(num) {
      if (num >= 1_000_000_000) return "₱" + (num / 1_000_000_000).toFixed(2).replace(/\.0$/, "") + "B";  
      if (num >= 1_000_000)     return "₱" + (num / 1_000_000).toFixed(2).replace(/\.0$/, "") + "M";  
      if (num >= 1_000)         return "₱" + (num / 1_000).toFixed(2).replace(/\.0$/, "") + "K";  
      return "₱" + num.toLocaleString("en-PH");
}

function loadAccomodationType(accomodation_type=null){
      document.querySelectorAll('#accomodation_type').forEach(year => {
            year.textContent = accomodation_type ? `(${accomodation_type})` : '(All Resort Area)';
      });
}

function resetDropdown(){
      document.getElementById('roomTypeFilter').value = 'all';
}

// Filter
document.getElementById('roomTypeFilter').addEventListener('change', async(e) => {
      if (e.target.value != 'all'){
            occupancyData(e.target.value);
            monthlyRevenue(e.target.value);
            dailyRevenue(e.target.value);
            drawCheckinForecastChart(e.target.value);
            drawRevenueChart(e.target.value);
            loadAccomodationType(e.target.options[e.target.selectedIndex].text);
            targetRevenue(e.target.value);
      }else {
            occupancyData();
            monthlyRevenue();
            dailyRevenue();
            drawCheckinForecastChart();
            drawRevenueChart();
            loadAccomodationType();
            targetRevenue();
      }
}); 

// Initial load: ensure the default content is shown and charts are drawn
export function initPageAnalytics() {
      resetDropdown();
      occupancyData();
      monthlyRevenue();
      dailyRevenue();
      loadAccomodationType();
      drawCheckinForecastChart();
      drawRevenueChart();
      targetRevenue();
      drawHeavyMonthChart();
      drawMostBookedArea();
      drawOccupancyForecastChart();
};
