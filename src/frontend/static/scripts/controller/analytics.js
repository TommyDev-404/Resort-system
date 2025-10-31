
let checkinChart = null;
let revenueChart = null;

// ---------------------- HELPERS -------------------------
async function drawCheckinForecastChart(result) {
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
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      });
      
      if (checkinChart) {
            checkinChart.destroy();
      }

      checkinChart = new Chart(ctx, {
            type: 'line',
            data: {
                  labels: displayLabels,
                  datasets: [
                  {
                        label: 'Historical Check-in: ',
                        data: historicalValues,
                        borderColor: '#1ed40eff',  // Blue
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                  },
                  {
                        label: 'Forecasted Check-in: ',
                        data: forecastValues,
                        borderColor: '#e42e0eff',  // Green
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
                        title: { display: true, text: 'Check-in %', color: '#555' },
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
                        titleFont: { size: 23, weight: 'bold' },
                        bodyFont: { size: 22 },
                        callbacks: {
                              label: function (context) {
                              // Show ISO date in tooltip
                              const isoDate = allDatesISO[context.dataIndex];
                              return `${context.dataset.label}: ${context.parsed.y ?? '-'}`;
                              }
                        }
                  }
                  },
            }
      });
}

async function drawRevenueChart(result) {
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
      
      if (revenueChart) {
            revenueChart.destroy();
      }

      revenueChart = new Chart(ctx, {
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
                    legend: { display: true },
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
                        title: { display: true, text: 'Revenue (₱)' } 
                    },
                    x: { ticks: { autoSkip: false } }
                }
            }
        });
        
}

async function forecastCheckin(type=null) {
      const url = type ? `/checkin-forecast-type?accomodation_type=${type}` : '/checkin-forecast-all';
      const response = await fetch(url);
      const result = await response.json();

      drawCheckinForecastChart(result);
}

async function forecastRevenue(type=null) {
      const url = type ? `/revenue-forecast-type?accomodation_type=${type}` : '/revenue-forecast-all';
      const response = await fetch(url);
      const result = await response.json();

      drawRevenueChart(result);
}

async function occupancyData(type=null) {
      const url = type ? `/mtd-occupancy-type?accomodation_type=${type}` : '/mtd-occupancy-all';
      const response = await fetch(url);
      const res = await response.json();

      document.getElementById('occupancy-percentage').textContent = `${res.current}%`;
      document.getElementById('occupancy-change').textContent = res.change < 0 ? `${res.change}%` : `+${res.change}%`;
}

async function adrData(type=null){  
      const url = type ? `/mtd-adr-type?accomodation_type=${type}` : '/mtd-adr-all';
      const response = await fetch(url);
      const res = await response.json();

      document.getElementById('adr').textContent = `₱${res.current}`;
      document.getElementById('adr-change').textContent = res.change < 0? `${res.change}%` : `+${res.change}%`;
}

async function revparData(type=null){
      const url = type ? `/mtd-revpar-type?accomodation_type=${type}` : '/mtd-revpar-all';
      const response = await fetch(url);
      const res = await response.json();

      document.getElementById('revpar').textContent = `₱${res.revpar}`;
      document.getElementById('revpar-change').textContent = res.change < 0 ? `${res.change}%` : `+${res.change}%`;    
}

async function targetRevenue(){
      const response = await fetch('/target-revenue');
      const res = await response.json();
      
      document.getElementById('target').textContent = `₱${res.target}`;
}

function loadAccomodationType(accomodation_type=null){
      document.querySelectorAll('#accomodation_type').forEach(year => {
            year.textContent = accomodation_type ? accomodation_type : 'All Resort Area';
      });
}

// Filter
document.getElementById('roomTypeFilter').addEventListener('change', async(e) => {
      if (e.target.value != 'all'){
            occupancyData(e.target.value);
            adrData(e.target.value);
            revparData(e.target.value);
            forecastCheckin(e.target.value);
            forecastRevenue(e.target.value);
            loadAccomodationType(e.target.options[e.target.selectedIndex].text);
      }else {
            occupancyData();
            adrData();
            revparData();
            forecastCheckin();
            forecastRevenue();
            loadAccomodationType();
      }
});

function resetDropdown(){
      document.getElementById('roomTypeFilter').value = 'all';
}


// Initial load: ensure the default content is shown and charts are drawn
export function initPageAnalytics() {
      resetDropdown();
      occupancyData();
      adrData();
      revparData();
      loadAccomodationType();
      forecastCheckin();
      forecastRevenue();
      targetRevenue();
};

initPageAnalytics();
