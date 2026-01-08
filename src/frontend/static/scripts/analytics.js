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

      drawAllForecasts()
      drawAnalyticsCharts();
});

observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

// ---------------------- HELPERS -------------------------
async function drawAllForecasts(accomodation_type) {
const forecastUrl = `/forecast-checkin-revenue?accomodation_type=${accomodation_type}`;

// Fetch once since route returns both datasets
const result = await fetch(forecastUrl).then(r => r.json());

const isDarkMode = document.documentElement.classList.contains('dark');

// ======= REVENUE CHART =======
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const latestRevenue = Array(12).fill(null);
const forecastedRevenue = Array(12).fill(null);

result.forecast_revenue.historical.month.forEach((m, i) => {
      latestRevenue[m - 1] = result.forecast_revenue.historical.value[i];
});
result.forecast_revenue.forecasted.month.forEach((m, i) => {
      forecastedRevenue[m - 1] = result.forecast_revenue.forecasted.value[i];
});

const revenueCtx = document.getElementById('revenueForecastChart').getContext('2d');
if (revenueCharts) revenueCharts.destroy();

revenueCharts = new Chart(revenueCtx, {
      type: 'bar',
      data: {
            labels: months,
            datasets: [
            { label: 'Historical Revenue (₱)', data: latestRevenue, backgroundColor: 'rgba(233,195,24,1)', borderWidth: 1, borderRadius: 6 },
            { label: 'Forecasted Revenue (₱)', data: forecastedRevenue, backgroundColor: 'rgba(230,7,174,1)', borderWidth: 1, borderRadius: 6 }
            ]
      },
      
            options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                  legend: { labels: { color: isDarkMode ? '#E5E7EB' : '#111827' } },
                  tooltip: {  
                    backgroundColor: '#111827',
                    titleColor: '#FBBF24',
                    bodyColor: '#F9FAFB',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 10,
                    titleFont: { size: 23, weight: 'bold' },
                    bodyFont: { size: 25 },
                        callbacks: {
                        label: ctx => `${ctx.dataset.label}: ₱${Number(ctx.parsed.y ?? 0).toLocaleString()}`
                        }
                  }
            },
            scales: {
                  y: { 
                        beginAtZero: true, 
                        max: 1000000, 
                        title: { display: true, text: 'Revenue (₱)', color: isDarkMode ? '#E5E7EB' : '#111827' },
                        ticks: { color: isDarkMode ? '#E5E7EB' : '#374151' },
                        grid: { color: isDarkMode ? '#374151' : '#E5E7EB' }
                  },
                  x: { ticks: { color: isDarkMode ? '#E5E7EB' : '#374151' }, grid: { display: false } }
            }
            }
});

// ======= CHECK-IN CHART =======
const historicalDatesISO = result.forecast_checkin.historical.date.map(d => new Date(d).toISOString().split('T')[0]);
const forecastedDatesISO = result.forecast_checkin.forecasted.date.map(d => new Date(d).toISOString().split('T')[0]);

const allDatesISO = historicalDatesISO.concat(forecastedDatesISO);
const historicalValues = result.forecast_checkin.historical.value.concat(new Array(result.forecast_checkin.forecasted.value.length).fill(null));
const forecastValues = new Array(result.forecast_checkin.historical.value.length).fill(null).concat(result.forecast_checkin.forecasted.value);

const displayLabels = allDatesISO.map(d => {
      const dateObj = new Date(d);
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

const checkinCtx = document.getElementById('checkin-forecast-chart').getContext('2d');
if (checkinChart) checkinChart.destroy();

checkinChart = new Chart(checkinCtx, {
      type: 'line',
      data: { labels: displayLabels, datasets: [
            { label: 'Historical Check-in', data: historicalValues, borderColor: '#0bda0bff', backgroundColor: '#18e411a8', borderWidth: 2, tension: 0.4, pointRadius: 0, spanGaps: true, fill: true },
            { label: 'Forecasted Check-in', data: forecastValues, borderColor: '#0a33ebff', backgroundColor: '#0e24eb8e', borderDash: [8,5], borderWidth: 2, tension: 0.4, pointRadius: 0, spanGaps: true, fill: true }
      ]},
      options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
            y: { 
                  min: 0, max: 50, 
                  title: { display: true, text: 'Check-in %', color: isDarkMode ? '#E5E7EB' : '#111827' },
                  ticks: { color: isDarkMode ? '#E5E7EB' : '#374151' },
                  grid: { color: isDarkMode ? '#374151' : '#E5E7EB' }
            },
            x: { 
                  ticks: { color: isDarkMode ? '#E5E7EB' : '#374151', maxTicksLimit: 15, autoSkip: true }, 
                  grid: { display: false } 
            }
      },
      plugins: {
            legend: { labels: { color: isDarkMode ? '#E5E7EB' : '#111827' } },
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
                  callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y ?? '-'} Check-ins` }
            }
      }
      }
});
}

async function drawAnalyticsCharts() {
      // Fetch all data in one request (assuming your Flask endpoint returns everything)
      const response = await fetch('/analytics-stats', { method: "GET" });
      const result = await response.json();
  
      // -------------------------------
      // 1️⃣ Occupancy Forecast Chart
      const occupancyCtx = document.getElementById('occupancyChartForecast').getContext('2d');
      const historicalDatesISO = result.occupancy_forecast.historical.date.map(d => new Date(d).toISOString().split('T')[0]);
      const forecastedDatesISO = result.occupancy_forecast.forecasted.date.map(d => new Date(d).toISOString().split('T')[0]);
  
      const allDatesISO = historicalDatesISO.concat(forecastedDatesISO);
      const historicalValues = result.occupancy_forecast.historical.value.concat(new Array(result.occupancy_forecast.forecasted.value.length).fill(null));
      const forecastValues = new Array(result.occupancy_forecast.historical.value.length).fill(null).concat(result.occupancy_forecast.forecasted.value);
  
      const displayLabels = allDatesISO.map(d => {
          const dateObj = new Date(d);
          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      });
  
      if (typeof occupancyChart !== 'undefined' && occupancyChart) occupancyChart.destroy();
      const isDarkMode = document.documentElement.classList.contains('dark');
  
      occupancyChart = new Chart(occupancyCtx, {
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
                      title: { display: true, text: 'Occupancy %', color: isDarkMode ? '#E5E7EB' : '#111827' },
                      ticks: { color: isDarkMode ? '#E5E7EB' : '#374151' },
                      grid: { color: isDarkMode ? '#374151' : '#E5E7EB' }
                  },
                  x: {
                      ticks: { color: isDarkMode ? '#E5E7EB' : '#374151', maxTicksLimit: 15, autoSkip: true },
                      grid: { display: false }
                  }
              },
              plugins: {
                  legend: { labels: { color: isDarkMode ? '#E5E7EB' : '#111827' } },
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
                              return `${context.dataset.label}: ${context.parsed.y ?? '-'}%`;
                          }
                      }
                  }
              }
          }
      });
  
      // -------------------------------
      // 2️⃣ Heavy Guest Month Chart
      const heavyCtx = document.getElementById('heavy-month-chart').getContext('2d');
      const heavyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const heavyValues = Array(12).fill(0);
      if (result.heavy_guest_month.value && Array.isArray(result.heavy_guest_month.value)) {
          result.heavy_guest_month.value.forEach((v, i) => { if (i < 12) heavyValues[i] = v; });
      }
  
      const maxGuests = Math.max(...heavyValues);
      const heavyColors = heavyValues.map(v => v === maxGuests ? '#FBBF24' : '#1139e9ff');
  
      if (typeof heavyMonthChart !== 'undefined' && heavyMonthChart) heavyMonthChart.destroy();
  
      heavyMonthChart = new Chart(heavyCtx, {
          type: 'bar',
          data: {
              labels: heavyLabels,
              datasets: [{ data: heavyValues, backgroundColor: heavyColors, borderRadius: 10 }]
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
                      titleFont: { size: 23, weight: 'bold' },
                      bodyFont: { size: 22 },
                      callbacks: {
                          label: function(context) {
                              return `${context.label}: ${context.parsed.y} Guests`;
                          }
                      }
                  }
              },
              scales: {
                  x: { ticks: { color: isDarkMode ? '#F9FAFB' : '#374151' }, grid: { display: false } },
                  y: { beginAtZero: true, ticks: { color: isDarkMode ? '#E5E7EB' : '#374151' } }
              }
          }
      });
  
      // -------------------------------
      // 3️⃣ Most Booked Area Chart
      const areaCtx = document.getElementById('mostBookedAreaChart').getContext('2d');
      const mostBookedData = result.most_booked_area;
      const areaValues = Object.values(mostBookedData).map(v => v ? Number(v) : 0);
      const areaLabels = ['Barkada', 'Big Cottage', 'Cabana Cottage', 'Family', 'Garden View', 'Hall', 'Premium Villa', 'Small Cottage', 'Standard Villa'];
      const areaColors = ['#4F46E5', '#3B82F6', '#0EA5E9', '#14B8A6', '#22C55E', '#84CC16', '#FACC15', '#F97316', '#EF4444'];
      const areaBackgroundColors = areaLabels.map((_, i) => areaColors[i % areaColors.length]);
  
      if (typeof mostBookedAreaChart !== 'undefined' && mostBookedAreaChart) mostBookedAreaChart.destroy();
  
      mostBookedAreaChart = new Chart(areaCtx, {
          type: 'pie',
          data: { labels: areaLabels, datasets: [{ data: areaValues, backgroundColor: areaBackgroundColors, borderWidth: 1 }] },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      position: 'bottom',
                      align: 'center',
                      labels: { color: isDarkMode ? '#F9FAFB' : '#374151', font: { size: 10, weight: '500' } }
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
                              return `${context.label}: ${context.parsed || 0} Bookings`;
                          }
                      }
                  }
              }
          }
      });
}

async function fetchAnalyticsMetrics(type) {
      try {
          // Single endpoint for merged metrics
          const url = `/analytics-metrics?accomodation_type=${type}`;
          const response = await fetch(url);
          const res = await response.json();

          // ---- Occupancy ----
          const occupancy = res.occupancy;
          document.getElementById('occupancy-percentage').textContent = `${occupancy.current}%`;
          document.getElementById('occupancy-change').textContent = occupancy.change < 0 ? `${occupancy.change}%` : `+${occupancy.change}%`;
          document.getElementById('current-occupancy-data').textContent = `${Math.round(occupancy.current)}%`;
  
          const occupancyIcon = document.getElementById('change-occupancy-icon');
          if (occupancy.change < 0) {
              document.getElementById('occupancy-change').classList.replace('text-green-500', 'text-red-500');
              document.getElementById('occupancy-change').classList.replace('dark:text-green-400', 'dark:text-red-500');
              occupancyIcon.setAttribute("data-lucide", "arrow-down");
              occupancyIcon.classList.replace('text-green-500', 'text-red-500');
              occupancyIcon.classList.replace('dark:text-green-400', 'dark:text-red-500');
          } else {
              document.getElementById('occupancy-change').classList.replace('text-red-500', 'text-green-500');
              document.getElementById('occupancy-change').classList.replace('dark:text-red-500', 'dark:text-green-400');
              occupancyIcon.setAttribute("data-lucide", "arrow-up");
              occupancyIcon.classList.replace('text-red-500', 'text-green-500');
              occupancyIcon.classList.replace('dark:text-red-500', 'dark:text-green-400');
          }
  
          // ---- Daily Revenue ----
          const daily = res.daily_revenue;
          document.getElementById('today-revenue-analytics').textContent = formatPesoShort3(Number(daily.current));
          document.getElementById('today-revenue-change').textContent = daily.change < 0 ? `${daily.change}%` : `+${daily.change}%`;
          const dailyIcon = document.getElementById('change-today-icon');
          if (daily.change < 0) {
              document.getElementById('today-revenue-change').classList.replace('text-green-500', 'text-red-500');
              document.getElementById('today-revenue-change').classList.replace('dark:text-green-400', 'dark:text-red-500');
              dailyIcon.setAttribute("data-lucide", "arrow-down");
              dailyIcon.classList.replace('text-green-500', 'text-red-500');
              dailyIcon.classList.replace('dark:text-green-400', 'dark:text-red-500');
          } else {
              document.getElementById('today-revenue-change').classList.replace('text-red-500', 'text-green-500');
              document.getElementById('today-revenue-change').classList.replace('dark:text-red-500', 'dark:text-green-400');
              dailyIcon.setAttribute("data-lucide", "arrow-up");
              dailyIcon.classList.replace('text-red-500', 'text-green-500');
              dailyIcon.classList.replace('dark:text-red-500', 'dark:text-green-400');
          }
  
          // ---- Monthly Revenue ----
          const monthly = res.monthly_revenue;
          document.getElementById('monthly-revenue-analytics').textContent = formatPesoShort3(Number(monthly.current));
          document.getElementById('monthly-revenue-change').textContent = monthly.change < 0 ? `${monthly.change}%` : `+${monthly.change}%`;
          const monthlyIcon = document.getElementById('change-monthly-icon');
          if (monthly.change < 0) {
              document.getElementById('monthly-revenue-change').classList.replace('text-green-500', 'text-red-500');
              document.getElementById('monthly-revenue-change').classList.replace('dark:text-green-400', 'dark:text-red-500');
              monthlyIcon.setAttribute("data-lucide", "arrow-down");
              monthlyIcon.classList.replace('text-green-500', 'text-red-500');
              monthlyIcon.classList.replace('dark:text-green-400', 'dark:text-red-500');
          } else {
              document.getElementById('monthly-revenue-change').classList.replace('text-red-500', 'text-green-500');
              document.getElementById('monthly-revenue-change').classList.replace('dark:text-red-500', 'dark:text-green-400');
              monthlyIcon.setAttribute("data-lucide", "arrow-up");
              monthlyIcon.classList.replace('text-red-500', 'text-green-500');
              monthlyIcon.classList.replace('dark:text-red-500', 'dark:text-green-400');
          }
  
          // ---- Target Revenue ----
          document.getElementById('target').textContent = formatPesoShort3(Number(res.target_revenue));
  
          // Refresh icons
          lucide.createIcons();
  
      } catch (error) {
          console.error("Error fetching dashboard metrics:", error);
      }
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
            fetchAnalyticsMetrics(e.target.value);
            drawAllForecasts(e.target.value);
            loadAccomodationType(e.target.options[e.target.selectedIndex].text);
      }else {
            fetchAnalyticsMetrics(e.target.value);
            drawAllForecasts(e.target.value);
            loadAccomodationType();
      }
}); 

// Initial load: ensure the default content is shown and charts are drawn
export function initPageAnalytics() {
      resetDropdown();
      fetchAnalyticsMetrics('all');
      loadAccomodationType();
      drawAllForecasts('all');
      drawAnalyticsCharts();
};
