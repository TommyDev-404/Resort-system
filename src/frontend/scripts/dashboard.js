
const sidebarItems = document.querySelectorAll('.sidebar-item');

// --- Event Listeners ---
sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            if (sectionId === "home-dashboard") {

            }
      });
});

function getNext90DaysLabels() {
      const labels = [];
      const today = new Date();
      for (let i = 0; i < 90; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            labels.push(futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      return labels;
}

function getOccupancyData(labels) {
      return labels.map((_, i) => {
      // Base load (60%) plus a seasonal wave (simulating an upcoming peak)
      let base = 60 + Math.sin(i / 30 * Math.PI) * 20; 
      // Simulate steady climb in Q1/Q2 (starts low, builds high)
      if (i > 45) {
            base += (i - 45) * 0.4;
      }
      // Random noise for day-to-day fluctuation
      let noise = (Math.random() - 0.5) * 4; 
      let finalValue = Math.round(base + noise);
      return Math.min(Math.max(finalValue, 50), 98); // Keep between 50% and 98%
      });
}

function drawOccupancyForecastChart() {
      const ctx = document.getElementById('occupancy-forecast-chart').getContext('2d');
      const labels = getNext90DaysLabels();
      const mockData = getOccupancyData(labels);
      console.log(mockData);
      
      // Create a gradient for the area fill
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(16, 86, 156, 0.4)'); // Primary Blue start
      gradient.addColorStop(1, 'rgba(16, 86, 156, 0.05)'); // Light transparent end

      new Chart(ctx, {
      type: 'line',
      data: {
            labels: labels,
            datasets: [{
                  label: 'Projected Occupancy (%)',
                  data: mockData,
                  borderColor: '#10569c', // Primary blue
                  borderWidth: 3,
                  backgroundColor: gradient, // Use gradient fill
                  tension: 0.4, // Smooth curve
                  fill: true,
                  pointRadius: 0
            }]
      },
      options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                  y: {
                  min: 50, // Start y-axis higher for better visualization of trends
                  max: 100,
                  title: { display: true, text: 'Occupancy %', color: '#555' },
                  grid: { color: '#eee' }
                  },
                  x: {
                  // Only show a few labels (e.g., every 15 days)
                  ticks: {
                        maxTicksLimit: 10,
                        autoSkip: true
                  },
                  grid: { display: false }
                  }
            },
            plugins: {
                  legend: { display: false },
                  tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                        label: function(context) {
                              return ' Projected: ' + context.parsed.y + '%';
                        }
                  }
                  }
            },
      }
      });
}

function drawHeavyMonthChart() {
      const ctx = document.getElementById('heavy-month-chart').getContext('2d');
      
      // Mock Data: Historical average guest count by month
      const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      values: [2500, 2800, 3100, 3500, 4200, 5800, 6500, 6100, 4800, 3700, 3000, 5200],
      };

      // Identify the peak month (July - index 6)
      const maxGuests = Math.max(...data.values);
      const backgroundColors = data.values.map(v => 
      v === maxGuests ? '#ffc107' : '#10569c' // Highlight peak month with secondary-gold
      );

      new Chart(ctx, {
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

async function getData(){
      // total guest in house
      const response = await fetch('/api/python/get-total-guest-house?method=total_guest_in_home_data', {method: "GET"});
      const res = await response.json();
      console.log(res)
      document.getElementById('total-guest-in-house').textContent = res.thisweek_data;
      document.getElementById('change-rate-guest').textContent = res.change > 0 ? `+${res.change}` : `${res.change}`;
      
      // total check in
      const response2 = await fetch('/api/python/get-checkins?method=forecast_check_ins&params=today', {method: "GET"});
      const res2 = await response2.json();
      document.getElementById('check-ins-data').textContent = res2.predicted_check_ins;
      document.getElementById('change-rate-checkin').textContent = Number(res2.change) > 0 ? `+${res2.change}` : '+0.0';


      // Current occupancy
      const response3 = await fetch('/api/python/get-current-occupancy?method=current_occupancy_data', {method: "GET"});
      const res3 = await response3.json();
      document.getElementById('occupancy-rate').textContent = `${res3.occupancy}%`;
      document.getElementById('total-room').textContent = res3.total_room;
      console.log(res3);

}


// Initial load: ensure the default content is shown and charts are drawn
export function dashboardData () {
      drawOccupancyForecastChart(); 
      drawHeavyMonthChart(); 
      getData();
};