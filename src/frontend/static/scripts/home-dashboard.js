import './chart.umd.js';

let occupancyChartPercentage = null;
let allNotifications = [];
let monthlyBookingsChart = null;
let bookingTypeChart = null;
let hrevenueChartD = null;

const observers = new MutationObserver(() => {

      if (typeof occupancyChartPercentage !== 'undefined' && occupancyChartPercentage) {
            occupancyChartPercentage.destroy();
      }

      if (typeof monthlyBookingsChart !== 'undefined' && monthlyBookingsChart) {
            monthlyBookingsChart.destroy();
      }

      if (typeof bookingTypeChart !== 'undefined' && bookingTypeChart) {
            bookingTypeChart.destroy();
      }

      if (typeof hrevenueChartD !== 'undefined' && hrevenueChartD) {
            hrevenueChartD.destroy();
      }

      drawOccupancyPercentage();
      drawDashboardTrends();
});

observers.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

// --------------------------- HELPER ------------------------
function drawOccupancyPercentage(occupancyValue) {
      // Center text plugin (for half doughnut)
      const centerTextPlugin = {
            id: 'centerText',
            afterDraw(chart) {
                  const { ctx, chartArea } = chart;
                  if (!chartArea) return;
            
                  const centerX = (chartArea.left + chartArea.right) / 2;
                  const centerY = chartArea.bottom - 12; // lower center for half arc

                  ctx.save();
                  // Base settings
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  // Draw the number bigger
                  ctx.font = 'bold 28px sans-serif';
                  ctx.fillStyle = '#3b82f6';
                  ctx.fillText(Math.round(occupancyValue), centerX, centerY);
                  // Draw the % smaller, slightly offset to the right
                  ctx.font = 'bold 16px sans-serif';
                  ctx.fillText('%', centerX + 15, centerY); // Adjust +30 for spacing
                  
                  ctx.restore();
                  
            }
      };

      if (occupancyChartPercentage) {
        occupancyChartPercentage.destroy();
      }
    
      const ctx = document.getElementById('occupancyChart').getContext('2d');
    
      const isDarkMode = document.documentElement.classList.contains('dark');
      const occupiedColor = isDarkMode ? '#22c55e' : '#16a34a'; // green
      const availableColor = isDarkMode ? 'rgba(255,255,255,0.15)' : '#e5e7eb';
    
      occupancyChartPercentage = new Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [occupancyValue, 100 - occupancyValue],
            backgroundColor: [occupiedColor, availableColor],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          rotation: -90,        // 🔥 start from left
          circumference: 180,   // 🔥 half circle
          cutout: '75%',
          radius: '95%',
          animation: {
            duration: 1200,
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

function formatPesoShort2(num) {
      if (num >= 1_000_000_000) return "₱" + (num / 1_000_000_000).toFixed(2).replace(/\.0$/, "") + "B";  
      if (num >= 1_000_000)     return "₱" + (num / 1_000_000).toFixed(2).replace(/\.0$/, "") + "M";  
      if (num >= 1_000)         return "₱" + (num / 1_000).toFixed(2).replace(/\.0$/, "") + "K";  
      return "₱" + num.toLocaleString("en-PH");
}

function loadingAnimation0(type){
      const load = `
            <div id="loading" class="absolute top-0 left-0 flex flex-col items-center justify-center h-[20vh] inset-0 bg-black/5 text-white space-y-2 backdrop-blur-[2px] z-10">
                  <div class="w-8 h-8 border-4 border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p class="text-[15px] font-medium animate-pulse text-black dark:text-white">Fetching data...</p>
            </div>
      `;      

      type === 'checkout' ? document.getElementById('upcoming-checkout-loading').innerHTML += load : document.getElementById('upcoming-arrival-loading').innerHTML += load ;
}

function showLoader(type) {
      loadingAnimation0(type); // adds #loading inside #loadingPortal
}

function hideLoader() {
      const loader = document.querySelector('#loading');
      if (loader) loader.remove();
}

function timeAgo(inputTime) {
      const date = new Date(inputTime);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);
      const absSec = Math.abs(diffSec); // convert into seconds

      if (Math.round(absSec / 60) < 60) return `${Math.round(absSec / 60)} seconds ago`;
      if (absSec < 3600) return `${Math.floor(absSec / 60)} minutes ago`;
      if (absSec < 86400) return `${Math.floor(absSec / 3600)} hours ago`;
      return `${Math.floor(absSec / 86400)} days ago`;
}

function viewAllNotifications(){
      const unique = [...new Set(allNotifications)];
      const generated_row = unique.join('\n');

      const modal = `
            <div id="notificationsModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[50]">
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95%] max-w-md p-6 relative fade-in-up">
                        <button id="closeNotifications" class="absolute top-4 right-4 text-2xl text-gray-600 dark:text-gray-300 hover:text-red-500">&times;</button>
            
                        <div class="flex gap-2 items-center justify-center mb-4">
                              <button id="notification" class="hover:bg-black/7 dark:hover:bg-white/10 rounded-lg transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-900 dark:text-white transition-colors duration-500" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 002-2H8a2 2 0 002 2z"/>
                                    </svg>
                              </button>
                              <h2 class="text-xl font-bold text-gray-800 dark:text-white">Notifications</h2>
                        </div>

                        <!-- Notifications List -->
                        <div class="max-h-80 overflow-y-auto border-t border-b border-gray-200 dark:border-gray-700 py-2 thin-scroll">
                              <ul id="notificationsList" class="space-y-2 text-gray-700 dark:text-gray-300">
                                    ${generated_row}
                              </ul>
                        </div>
                  </div>
            </div>
      `;

      document.getElementById('notificationPortal').innerHTML += modal;
      lucide.createIcons(); 
}

function updateMetric(valueId, rateId, iconId, value, change, bookId=null, bookVal=null, ) {
      document.getElementById(valueId).textContent = value;
      document.getElementById(rateId).textContent = change > 0 ? `+${change}%` : `${change}%`;
      
      if (bookId) document.getElementById(bookId).textContent = bookVal;
      const rateEl = document.getElementById(rateId);
      const iconEl = document.getElementById(iconId);

      // Reset classes
      rateEl.classList.remove('text-green-600', 'text-red-600','dark:text-green-500', 'dark:text-red-500');

      iconEl.classList.remove(
            'text-green-600', 'text-red-600',
            'dark:text-green-400', 'dark:text-red-400'
      );

      if (change < 0) {
            // LIGHT MODE
            rateEl.classList.add('text-red-600');
            iconEl.classList.add('text-red-600');

            // DARK MODE
            rateEl.classList.add('dark:text-red-500');
            iconEl.classList.add('dark:text-red-400');

            iconEl.setAttribute("data-lucide", "arrow-down");
      } else {
            // LIGHT MODE
            rateEl.classList.add('text-green-600');
            iconEl.classList.add('text-green-600');

            // DARK MODE
            rateEl.classList.add('dark:text-green-500');
            iconEl.classList.add('dark:text-green-400');

            iconEl.setAttribute("data-lucide", "arrow-up");
      }

      lucide.createIcons();
}

function resetDropdown(){
      document.getElementById('checkout-day').value = 'today';
      document.getElementById('checkin-day').value = 'today';
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

// Metric card
async function fetchDashboardMetrics() {
      try {
          const response = await fetch('/dashboard-metrics'); // endpoint for the merged query
          const res = await response.json();
  
          // Update Today's Check-ins
          updateMetric(
              'today-checkin-guest',
              'change-rate-checkin',
              'change-rate-checkin-icon',
              res.today_checkin.guests,
              Number(res.today_checkin.change),
              'today-checkin-bookings',
              res.today_checkin.check_in
          );
  
          // Update Total Guests In-House
          updateMetric(
              'total-guest-in-house',
              'change-rate-guest',
              'change-rate-guest-icon',
              res.total_guest_in_house.today,
              Number(res.total_guest_in_house.change),
              'guest-house-bookings',
              res.total_guest_in_house.bookings
          );
  
          // Update Today's Revenue
          updateMetric(
              'total-revenue',
              'change-rate-revenue',
              'target-revenue-icon',
              formatPesoShort2(Number(res.revenue.current_revenue)),
              Number(res.revenue.change)
          );
          
          // --- Update Occupancy Chart ---
          document.getElementById('total-avl-rooms').textContent = res.occupancy.total_room;
          drawOccupancyPercentage(res.occupancy.occupancy);
  
      } catch (error) {
          console.error("Error fetching dashboard metrics:", error);
      }
}

export async function notifications() {
      document.querySelectorAll('.notif-item').forEach(item => item.remove());
      document.querySelector('.view-notif-btn').classList.remove('hidden');
      
      let have_notifications = [];

      // occupancy alert
      const response1 = await fetch('/occupancy-alert', {method: "GET"});
      const res1 = await response1.json();
      
      // housekeeping alert
      const response2 = await fetch('/housekeeping-alert', {method: "GET"});
      const res2 = await response2.json();

      // housekeeping alert
      const response3 = await fetch('/bookings-alert', {method: "GET"});
      const res3 = await response3.json();

      if (res1.success){
            have_notifications.push(true);
            const data = res1.data;
            let time = timeAgo(data.date);
            let notification = data.name;

            const occupancy_notif = `
                  <div id="redirect-promo" class="notif-item px-4 py-3 flex items-start gap-3 dark:hover:bg-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-black/7 transition border-b border-gray-100 dark:border-transparent">
                        <i data-lucide="alert-triangle" class="w-5 h-5 text-rose-500 mt-0.5"></i>
                        <div class="flex flex-col flex-1"">
                              <p class="text-sm text-gray-800 dark:text-gray-100">${notification}</p>
                              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">${time}</span>
                        </div>
                  </div>
            `;

            allNotifications.push(occupancy_notif);
            document.getElementById('notif-modal').innerHTML += occupancy_notif;
            lucide.createIcons(); 
            document.getElementById('notifSound').play()
      }

      if (res2.success){
            have_notifications.push(true);
            res2.data.forEach(data => {
                  let time = timeAgo(data.date);
                  let notification = data.name;

                  const housekeeping_notif = `
                        <div id="housekeeping-notif" class="notif-item px-4 py-3 flex items-start bg-gray-50 dark:bg-gray-800 gap-3 dark:hover:bg-gray-700 hover:bg-black/7 transition border-b border-gray-100 dark:border-transparent">
                              <i data-lucide="house" class="w-5 h-5 text-blue-400 mt-0.5"></i>
                              <div class="flex flex-col flex-1"">
                                    <p class="text-sm text-gray-800 dark:text-gray-100">${notification+'. Clean now!'}</p>
                                    <span class="text-xs  text-gray-500 dark:text-gray-400 mt-1">${time}</span>
                              </div>
                        </div>
                  `;
                  
                  allNotifications.push(housekeeping_notif);
                  document.getElementById('notif-modal').innerHTML += housekeeping_notif;
                  lucide.createIcons(); 
            });
            document.getElementById('notifSound').play()
      }

      if (res3.success){
            have_notifications.push(true);
            res3.data.forEach(data => {
                  let time = timeAgo(data.date);
                  let notification = data.name;
                  let icon = null;
                  let icon_color = null;

                  if (data.classification === 'reservation-tommorow' | data.classification === 'check-in-reservation-today'){
                        icon = 'calendar';
                        icon_color = 'text-green-500';
                  }else if (data.classification == 'day-guest'){
                        icon = 'user';
                        icon_color = 'text-yellow-500'
                  }else{
                        icon = 'log-out';
                        icon_color = 'text-red-500'
                  }

                  const bookings_notif = `
                        <div id="bookings-notif" class="notif-item px-4 py-3 flex items-start bg-gray-50 dark:bg-gray-800 gap-3 dark:hover:bg-gray-700 hover:bg-black/7 transition border-b border-gray-100 dark:border-transparent">
                              <i data-lucide="${icon}" class="w-5 h-5 ${icon_color} mt-0.5 font-bold"></i>
                              <div class="flex flex-col flex-1"">
                                    <p class="text-sm text-gray-800 dark:text-gray-100">${notification}</p>
                                    <span class="text-xs  dark:text-gray-400 text-gray-500 mt-1">${time}</span>
                              </div>
                        </div>
                  `;
                  
                  allNotifications.push(bookings_notif);
                  document.getElementById('notif-modal').innerHTML += bookings_notif;
                  lucide.createIcons(); 
            });
            document.getElementById('notifSound').play()
      }
      
      if (have_notifications.length == 0){
            const empty_row = `
                  <div id="empty-notif" class="notif-item px-4 py-3 flex items-start gap-3 dark:hover:bg-gray-700 hover:bg-black/7 transition border-b border-gray-100 dark:border-transparent">
                        <div class="flex flex-col flex-1"">
                              <p class="text-sm text-gray-800 dark:text-gray-400 text-center">No notifications.</p>
                        </div>
                  </div>
            `;
            
            document.querySelector('.view-notif-btn').classList.add('hidden');
            document.getElementById('notif-modal').innerHTML += empty_row;
      }
      
      // notif count
      const response = await fetch('/notification-count', {method: "GET"});
      const res = await response.json();
      
      if (Number(res.count) != 0){
            document.getElementById('notification-count').classList.add('min-w-[1.25rem]',  'h-5',  'px-1');
            document.getElementById('notification-count').textContent = `${res.count}` ;
      }else{
            document.getElementById('notification-count').classList.remove('min-w-[1.25rem]',  'h-5',  'px-1');
            document.getElementById('notification-count').textContent = '';
      }

}

// Bookings Overview
async function bookingOverviewCardsData() {
      // total check in
      const response = await fetch('/bookings-overview-data', {method: "GET"});
      const res = await response.json();

      const data = res.data;
      document.getElementById('this-year').textContent = data.year_books;
      document.getElementById('this-year-guests').textContent = data.year_guests;
      
      document.getElementById('this-month').textContent = data.month_books;
      document.getElementById('this-month-guests').textContent = data.month_guests;
      
      document.getElementById('this-week').textContent = data.week_books;
      document.getElementById('this-week-guests').textContent = data.week_guests;

      document.getElementById('total-checkin').textContent = data.today_checkin_count;
      document.getElementById('total-checkin-guests').textContent = data.today_checkin_guests;

      document.getElementById('total-dayguest').textContent = data.day_guest_count;
      document.getElementById('total-dayguest-guests').textContent = data.day_guest_guests;
      
      document.getElementById('total-reservations').textContent = data.reservation_count;
      document.getElementById('total-reservations-guests').textContent = data.reservation_guests;

      document.getElementById('checkout-day-guest').textContent = data.day_guest;
      document.getElementById('checkout-overnight').textContent = data.overnight;
      document.getElementById('total-checkout-guests').textContent = data.today_checkout_guests;
}

async function upcomingData(type, day_type) {
      type === 'checkout' ?  document.getElementById('upcoming-checkout-table').querySelectorAll('tbody tr').forEach(row => row.remove()) : document.getElementById('upcoming-arrival-table').querySelectorAll('tbody tr').forEach(row => row.remove());

      const response = await fetch(`/upcoming-bookings?book_type=${type}&day=${day_type}`);
      const res = await response.json();

      if (res.success){
            hideLoader();
            res.data.forEach(guest => {
                  const check_out = new Date(guest.check_out).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  const check_in = new Date(guest.check_in).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                  const row = `
                        <tr class="text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 transition py-2">
                              <td class="px-3 py-2 text-center">
                                    <div class="overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${guest.name}
                                    </div>
                              </td> 
                              <td class="px-3 py-2 text-center">
                                    <div class="overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${guest.booking_type === 'Check-in' ? 'Room Stay' : guest.booking_type}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">
                                    <div class="overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${check_in}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center ">
                                    <div class="whitespace-nowrap">    
                                          ${check_out}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">${guest.total_guest}</td>
                        </tr>
                  `;
                  
                  type === 'checkout' ? document.getElementById('upcoming-checkout-table').innerHTML += row : document.getElementById('upcoming-arrival-table').innerHTML += row;
            });
      }else{
            hideLoader();
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up py-2">
                        <td colspan="6" class="text-center text-gray-800  dark:text-white py-2 ">${type === 'checkout' ? 'No scheduled check-outs yet' : 'No scheduled arrivals yet'}.</td>
                  </tr>
            `;
            
            type === 'checkout' ? document.getElementById('upcoming-checkout-table').innerHTML += empty_row : document.getElementById('upcoming-arrival-table').innerHTML += empty_row;
      }
}

async function drawBookingStats() {
      try {
          const response = await fetch('/dashboard-booking-stats'); // the new merged endpoint
          const res = await response.json();
  
          if (!res.success) return console.error("Failed to fetch dashboard booking stats");
  
          const isDark = document.documentElement.classList.contains('dark');
  
          // --- Draw Booking Type Distribution Pie Chart ---
          const ctx = document.getElementById('bookingTypeChart');
          if (bookingTypeChart) bookingTypeChart.destroy();
  
          bookingTypeChart = new Chart(ctx, {
              type: 'pie',
              data: {
                  labels: ["Overnight", "Day Guest"],
                  datasets: [{
                      data: [res.booking_type_distribution.checkin_total, res.booking_type_distribution.day_guest_total],
                      backgroundColor: ["#3b82f6", "#eab308"]
                  }]
              },
              options: {
                  responsive: true,
                  plugins: {
                      legend: {
                          labels: {
                              color: isDark ? "#e5e7eb" : "#1f2937",
                              font: { size: 12 }
                          }
                      },
                      tooltip: {
                          enabled: true,
                          backgroundColor: '#111827',
                          titleColor: '#FBBF24',
                          bodyColor: '#F9FAFB',
                          borderColor: isDark ? "#374151" : "#d1d5db",
                          borderWidth: 1,
                          padding: 15,
                          titleFont: { size: 20, weight: 'bold' },
                          bodyFont: { size: 18, weight: 'bold' },
                          callbacks: {
                              label: function(context) {
                                  const label = context.label || '';
                                  const value = context.parsed;
                                  return `${label}: ${value} Bookings`;
                              }
                          }
                      }
                  }
              }
          });
  
          // --- Draw Top Booked Areas ---
          const areaContainer = document.getElementById('top-booked-area');
          areaContainer.querySelectorAll('div').forEach(row => row.remove());
  
          res.top_booked_areas.forEach(area => {
              createMostBookedArea(area.area_name, area.percentage);
          });
  
      } catch (error) {
          console.error("Error fetching dashboard booking stats:", error);
      }
}

// Room Overview
async function summaryRoomOverview() {
      const response = await fetch('/housekeeping-metrics');
      const result = await response.json();
      document.getElementById('to-be-clean2').textContent = result.need_clean;
      document.getElementById('occupied2').textContent = result.occupied;
      document.getElementById('reserved2').textContent = result.reserved;
}

async function roomsData() {
      document.querySelectorAll('#rooms-data div').forEach(div => div.remove());

      const response = await fetch('/availables', {method: "GET"});
      const res = await response.json();

      const totalHallRooms =
            Number(res.data[7].total_rooms) +
            Number(res.data[8].total_rooms) +
            Number(res.data[9].total_rooms);

      const availableHallRooms =
            Number(res.data[7].today_avail) +
            Number(res.data[8].today_avail) +
            Number(res.data[9].today_avail);

      const reservedHallRooms =
            Number(res.data[7].reserve) +
            Number(res.data[8].reserve) +
            Number(res.data[9].reserve);
      
      const needCleanHalls =
            Number(res.data[7].need_clean) +
            Number(res.data[8].need_clean) +
            Number(res.data[9].need_clean);
            
      const occupiedHallRooms = 
            Number(res.data[7].occupied) +
            Number(res.data[8].occupied) +
            Number(res.data[9].occupied);
      ;

      const hallPercentage = (availableHallRooms / totalHallRooms) * 100;
      
      const rooms = `
            <div class="p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Barkada Room</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                        ${res.data[0].occupied}
                        <span class="text-xs font-medium text-red-600 dark:text-red-400">Occupied</span>
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[0].reserve} 
                        <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[0].need_clean} 
                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                  </p>

                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[0].today_avail}</span></p>
                  <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-red-500 h-2 rounded-full" style="width:${(Number(res.data[0].today_avail) / Number(res.data[0].total_rooms)*100)}%"></div>
                  </div>
            </div>
            
            <div class="p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Garden View Room</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                        ${res.data[1].occupied}
                        <span class="text-xs font-medium text-red-600 dark:text-red-400">Occupied</span>
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[1].reserve} 
                        <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[1].need_clean} 
                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                  </p>

                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[1].today_avail}</span></p>
                  <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width:${(Number(res.data[1].today_avail) / Number(res.data[1].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Premium Villa</p>
                  
                  <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                        ${res.data[2].occupied}
                        <span class="text-xs font-medium text-red-600 dark:text-red-400">Occupied</span>
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[2].reserve} 
                        <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[2].need_clean} 
                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                  </p>

                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[2].today_avail}</span></p>
                  <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-blue-500 h-2 rounded-full" style="width:${(Number(res.data[2].today_avail) / Number(res.data[2].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Standard Villa</p>
                  
                  <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                        ${res.data[3].occupied}
                        <span class="text-xs font-medium text-red-600 dark:text-gray-400">Occupied</span>
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[3].reserve} 
                        <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[3].need_clean} 
                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                  </p>

                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[3].today_avail}</span></p>
                  <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-purple-500 h-2 rounded-full" style="width:${(Number(res.data[3].today_avail) / Number(res.data[3].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Cabana Cottage</p>
                  
                  <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                        ${res.data[5].occupied}
                        <span class="text-xs font-medium text-red-600 dark:text-red-400">Occupied</span>
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[5].reserve} 
                        <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[5].need_clean} 
                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                  </p>

                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[5].today_avail}</span></p>
                  <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-teal-500 h-2 rounded-full" style="width:${(Number(res.data[5].today_avail) / Number(res.data[5].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Small Cottage</p>
                  
                  <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                        ${res.data[6].occupied}
                        <span class="text-xs font-medium text-red-600 dark:text-red-400">Occupied</span>
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[6].reserve} 
                        <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                        <span class="mx-1 text-gray-400">•</span>
                        ${res.data[6].need_clean} 
                        <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                  </p>

                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[6].today_avail}</span></p>
                  <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-indigo-500 h-2 rounded-full" style="width:${(Number(res.data[6].today_avail) / Number(res.data[6].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="grid grid-cols-2 col-span-3 gap-3">
                  <div class="col-span-1 p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700 ">
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Big Cottage</p>
                        
                        <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                              ${res.data[4].occupied}
                              <span class="text-xs font-medium text-red-600 dark:text-red-400">Occupied</span>
                              <span class="mx-1 text-gray-400">•</span>
                              ${res.data[4].reserve} 
                              <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                              <span class="mx-1 text-gray-400">•</span>
                              ${res.data[4].need_clean} 
                              <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                        </p>
      
                        <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[4].today_avail}</span></p>
                        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                              <div class="bg-orange-500 h-2 rounded-full" style="width:${(Number(res.data[4].today_avail) / Number(res.data[4].total_rooms)*100)}%"></div>
                        </div>
                  </div>
                  
                  <div class="col-span-1 p-5 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200 dark:border-gray-700">
                        <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Hall</p>

                                    
                              <p class="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-3">
                                    ${occupiedHallRooms}
                                    <span class="text-xs font-medium text-red-600 dark:text-red-400">Occupied</span>
                                    <span class="mx-1 text-gray-400">•</span>
                                    ${reservedHallRooms} 
                                    <span class="text-xs font-medium text-green-600 dark:text-green-400">Reserved</span> 
                                    <span class="mx-1 text-gray-400">•</span>
                                    ${needCleanHalls} 
                                    <span class="text-xs font-medium text-blue-600 dark:text-blue-400">Need-Clean</span> 
                              </p>

                        
                        <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">
                              Available:
                              <span class="font-semibold">${availableHallRooms}</span>
                        </p>
                        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2">
                              <div
                                    class="bg-pink-500 h-2 rounded-full transition-all"
                                    style="width:${hallPercentage.toFixed(1)}%">
                              </div>
                        </div>
                  </div>
            </div>
      `;

      document.getElementById('rooms-data').innerHTML += rooms;
}

async function drawDashboardTrends() {
      try {
          const response = await fetch('/dashboard-trends', { method: 'GET' });
          const res = await response.json();
  
          const isDark = document.documentElement.classList.contains('dark');
          const textColor = isDark ? '#e5e7eb' : '#374151';
          const gridColor = isDark ? '#4b5563' : '#e5e7eb';
  
          // --- Monthly Bookings Chart ---
          const monthlyCtx = document.getElementById('monthlyBookingsChart');
          if (monthlyBookingsChart) monthlyBookingsChart.destroy();
  
          monthlyBookingsChart = new Chart(monthlyCtx, {
              type: 'bar',
              data: {
                  labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                  datasets: [{
                      label: "Bookings",
                      data: res.monthly_bookings,
                      backgroundColor: "#3b82f6",
                      borderRadius: 6
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { labels: { color: textColor } },
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
                                  const value = context.parsed.y;
                                  return `${label}: ${value} Bookings`;
                              }
                          }
                      }
                  },
                  scales: {
                      y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                      x: { ticks: { color: textColor }, grid: { display: false } }
                  }
              }
          });
  
          // --- Revenue / Guests / Check-in Trend Chart ---
          const trendCtx = document.getElementById('revenueChart').getContext('2d');
          if (hrevenueChartD) hrevenueChartD.destroy();
  
          hrevenueChartD = new Chart(trendCtx, {
              type: 'line',
              data: {
                  labels: res.weekly_trends.map(d => new Date(d.day_date).toLocaleDateString('en-US', { weekday: 'short' })),
                  datasets: [
                      {
                          label: 'Revenue',
                          data: res.weekly_trends.map(d => d.revenue),
                          borderColor: 'rgba(59,130,246,1)',
                          backgroundColor: 'rgba(59,130,246,0.2)',
                          tension: 0.3
                      },
                      {
                          label: 'Guests',
                          data: res.weekly_trends.map(d => d.guest_count),
                          borderColor: 'rgba(16,185,129,1)', // emerald green
                          backgroundColor: 'rgba(16,185,129,0.2)',
                          tension: 0.3
                      },
                      {
                          label: 'Check-ins',
                          data: res.weekly_trends.map(d => d.checkin_count),
                          borderColor: 'rgba(234,179,8,1)', // amber
                          backgroundColor: 'rgba(234,179,8,0.2)',
                          tension: 0.3
                      }
                  ]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { labels: { color: textColor } },
                      tooltip: {
                          mode: 'nearest',
                          intersect: false,
                          backgroundColor: '#111827',
                          titleColor: '#FBBF24',
                          bodyColor: '#F9FAFB',
                          borderColor: '#374151',
                          borderWidth: 1,
                          padding: 20,
                          titleFont: { size: 28, weight: 'bold' },
                          bodyFont: { size: 26 },
                          callbacks: {
                              label: function(context) {
                                  const label = context.dataset.label || '';
                                  const value = context.parsed.y;
                                  if (label === 'Revenue') {
                                      return `${label}: ${value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}`;
                                  }
                                  return `${label}: ${value}`;
                              }
                          }
                      }
                  },
                  scales: {
                      y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                      x: { ticks: { color: textColor }, grid: { color: gridColor } }
                  }
              }
          });
  
      } catch (err) {
          console.error("Error fetching dashboard trends:", err);
      }
}

document.addEventListener('click', (e) => {
      if (e.target.matches('#closeAlert')) document.getElementById('alertToast').classList.add('hidden');
      if (e.target.matches('#closeAlertHousekeeping')) document.getElementById('alertHousekeeping').classList.add('hidden');
      if (e.target.closest('#viewAllNotifications')) (viewAllNotifications(),  document.querySelector('#notification-modal').classList.add('hidden'));
      if (e.target.matches('#closeNotifications')) document.getElementById('notificationsModal').remove();

      if (e.target.matches('#today')) filteredDashboard('today');
      if (e.target.matches('#yesterday')) filteredDashboard('yesterday');
      if (e.target.matches('#last_week')) filteredDashboard('last_week');
      if (e.target.matches('#last_month')) filteredDashboard('last_month');
});

// select tags  
document.addEventListener('change', (e) => {
      if (e.target.closest('#checkout-day'))  upcomingData('checkout', e.target.value);
      if (e.target.closest('#checkin-day'))  upcomingData('arrival', e.target.value);
});

// Initial load: ensure the default content is shown and charts are drawn
export async function initPageDashboard() {
      allNotifications.length = 0;
      resetDropdown();
      fetchDashboardMetrics();
      summaryRoomOverview();
      roomsData();
      upcomingData('checkout');
      upcomingData('arrival');
      bookingOverviewCardsData();
      drawDashboardTrends();
      drawBookingStats();
};