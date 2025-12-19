import './chart.umd.js';

let occupancyChartPercentage = null;
let allNotifications = [];
let monthlyBookingsChart = null;
let bookingTypeChart = null;
let guestChart = null;
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
      
      if (typeof guestChart !== 'undefined' && guestChart) {
            guestChart.destroy();
      }

      if (typeof hrevenueChartD !== 'undefined' && hrevenueChartD) {
            hrevenueChartD.destroy();
      }


      drawOccupancyPercentage();
      drawMonthlyBookings();
      drawBookingTypeDistribution();
      drawGuestTrend();
      drawRevenueTrend();
});

observers.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

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

function formatPesoShort2(num) {
      if (num >= 1_000_000_000) return "₱" + (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";  
      if (num >= 1_000_000)     return "₱" + (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";  
      if (num >= 1_000)         return "₱" + (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";  
      return "₱" + num.toLocaleString("en-PH");
}

function loadingAnimation2(){
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

function updateMetric(valueId, rateId, iconId, value, change) {
      document.getElementById(valueId).textContent = value;
      document.getElementById(rateId).textContent = change > 0 ? `+${change}%` : `${change}%`;

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

// Metric card
async function todaysBookings() {
      const response = await fetch('/today-bookings');
      const res = await response.json();

      updateMetric(
            'bookings-data',
            'change-rate-bookings',
            'change-rate-bookings-icon',
            res.check_in,
            Number(res.change)
      );
}

async function totalGuestInHouse(label) {
      const response = await fetch(`/total-guest-in-house?label=${label}`);
      const res = await response.json();

      updateMetric(
            'total-guest-in-house',
            'change-rate-guest',
            'change-rate-guest-icon',
            res.today,
            Number(res.change)
      );
}

async function todayGuest() {
      const response = await fetch('/today-guest');
      const res = await response.json();

      updateMetric(
            'today-guest',
            'change-rate-today-guest',
            'change-rate-today-guest-icon',
            res.today_guest,
            Number(res.change)
      );
}

async function todayProjectedRevenue() {
      const response = await fetch('/revenue');
      const res = await response.json();

      updateMetric(
            'total-revenue',
            'change-rate-revenue',
            'target-revenue-icon',
            formatPesoShort2(Number(res.current_revenue)),
            Number(res.change)
      );
}

export async function notifications() {
      document.querySelectorAll('.notif-item').forEach(item => item.remove());
      document.querySelector('.view-notif-btn').classList.remove('hidden');
      
      // notif count
      const response = await fetch('/notification-count', {method: "GET"});
      const res = await response.json();
      
      if (Number(res.count) != 0){
            document.getElementById('notification-count').classList.add('px-1.5', 'py-0.5');
            document.getElementById('notification-count').textContent = `${res.count} +` ;
      }else{
            document.getElementById('notification-count').classList.remove('px-1.5', 'py-0.5');
            document.getElementById('notification-count').textContent = '';
      }

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

// Bookings Overview
async function bookingOverviewCardsData() {
      // total check in
      const response = await fetch('/bookings-overview-data', {method: "GET"});
      const res = await response.json();

      const data = res.data;
      document.getElementById('total-checkin').textContent = data.today_checkin_count;
      document.getElementById('total-checkin-guests').textContent = data.today_checkin_guests;

      document.getElementById('total-checkout').textContent = data.today_checkout_count;
      document.getElementById('total-checkout-guests').textContent = data.today_checkout_guests;

      document.getElementById('total-dayguest').textContent = data.day_guest_count;
      document.getElementById('total-dayguest-guests').textContent = data.day_guest_guests;
      
      document.getElementById('total-reservations').textContent = data.reservation_count;
      document.getElementById('total-reservations-guests').textContent = data.reservation_guests;
}

async function upcomingCheckouts() {
      const response = await fetch('/upcoming-checkout', {method: "GET"});
      const res = await response.json();
      
      document.getElementById('upcoming-checkout-table').querySelectorAll('tbody tr').forEach(row => row.remove());
      if (res.success){
            res.data.forEach(guest => {
                  const date = new Date(guest.check_out).toISOString().split('T')[0];
                  const formattedDate = new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                  });

                  const row = `
                        <tr class="text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 transition">
                              <td class="px-3 py-2 text-center">
                                    <div class="w-[150px] overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${guest.name}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">
                                    <div class="w-[340px] truncate whitespace-nowrap">    
                                          ${guest.accomodations.split(',').map(accs => accs.trim()).join(', ')}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center ">
                                    <div class="w-[100px] whitespace-nowrap">    
                                          ${formattedDate}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">${guest.total_guest}</td>
                        </tr>
                  `;

                  document.getElementById('upcoming-checkout-table').innerHTML += row;
            });
      }else{
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="8" class="text-center text-gray-800 py-2 dark:text-white">No data.</td>
                  </tr>
            `;
                  
            document.getElementById('upcoming-checkout-table').innerHTML += empty_row;
      }
}

async function upcomingArrivals() {
      const response = await fetch('/upcoming-arrival', {method: "GET"});
      const res = await response.json();

      document.getElementById('upcoming-arrival-table').querySelectorAll('tbody tr').forEach(row => row.remove());
      if (res.success){
            res.data.forEach(guest => {
                  const date = new Date(guest.check_in).toISOString().split('T')[0];
                  const formattedDate = new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                  });

                  const row = `
                        <tr class="text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-white/3 hover:bg-black/5 dark:hover:bg-white/5 transition">
                              <td class="px-3 py-2 text-center">
                                    <div class="w-[150px] overflow-x-auto thin-scroll whitespace-nowrap">    
                                          ${guest.name}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">
                                    <div class="w-[340px] truncate whitespace-nowrap">    
                                          ${guest.accomodations.split(',').map(accs => accs.trim()).join(', ')}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center ">
                                    <div class="w-[100px] whitespace-nowrap">    
                                          ${formattedDate}
                                    </div>
                              </td>
                              <td class="px-3 py-2 text-center">${guest.total_guest}</td>
                        </tr>
                  `;

                  document.getElementById('upcoming-arrival-table').innerHTML += row;
            });
      }else{
            const empty_row = `
                  <tr class="text-sm hover:bg-black/5 bg-gray-50 dark:bg-white/3 dark:hover:bg-white/5 transition-all text-gray-600 border-b border-gray-300 dark:border-gray-700 dark:text-white fade-in-up">
                        <td colspan="8" class="text-center text-gray-800  dark:text-white py-2 ">No data.</td>
                  </tr>
            `;
                  
            document.getElementById('upcoming-arrival-table').innerHTML += empty_row;
      }
}

// Room Overview
async function totalOccupied() {
      const response = await fetch('/occupied-room', {method: "GET"});
      const res = await response.json();

      document.getElementById('total-occupied').textContent = res.occupied;
}

async function roomsData() {
      document.querySelectorAll('#rooms-data div').forEach(div => div.remove());

      const response = await fetch('/availables', {method: "GET"});
      const res = await response.json();

      const rooms = `
            <div class="p-3 bg-blue-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Premium Villa</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[6].total_rooms - Number(res.data[6].today_avail)} <span class="text-xs font-medium text-gray-700 dark:text-gray-400">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[6].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-blue-500 h-2 rounded-full" style="width:${(Number(res.data[6].today_avail) / Number(res.data[6].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-3 bg-violet-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Standard Villa</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[8].total_rooms - Number(res.data[8].today_avail)} <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[8].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-purple-500 h-2 rounded-full" style="width:${(Number(res.data[8].today_avail) / Number(res.data[8].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-3 bg-teal-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Cabana Cottage</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[2].total_rooms - Number(res.data[2].today_avail)} <span class="text-xs font-medium text-gray-700 dark:text-gray-400">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[2].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-teal-500 h-2 rounded-full" style="width:${(Number(res.data[2].today_avail) / Number(res.data[2].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-3 bg-yellow-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Family Room</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[3].total_rooms - Number(res.data[3].today_avail)} <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[3].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-yellow-500 h-2 rounded-full" style="width:${(Number(res.data[3].today_avail) / Number(res.data[3].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-3 bg-green-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Garden View Room</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[4].total_rooms - Number(res.data[4].today_avail)} <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[4].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width:${(Number(res.data[4].today_avail) / Number(res.data[4].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-3 bg-orange-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Barkada Room</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[0].total_rooms - Number(res.data[0].today_avail)} <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[0].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-red-500 h-2 rounded-full" style="width:${(Number(res.data[0].today_avail) / Number(res.data[0].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-3 bg-indigo-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Small Cottage</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[7].total_rooms - Number(res.data[7].today_avail)} <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[7].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-indigo-500 h-2 rounded-full" style="width:${(Number(res.data[7].today_avail) / Number(res.data[7].total_rooms)*100)}%"></div>
                  </div>
            </div>

            <div class="p-3 bg-orange-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Big Cottage</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[1].total_rooms - Number(res.data[1].today_avail)} <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[1].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-orange-500 h-2 rounded-full" style="width:${(Number(res.data[1].today_avail) / Number(res.data[1].total_rooms)*100)}%"></div>
                  </div>
            </div>
            
            <div class="p-3 bg-pink-100 dark:bg-gray-800 rounded-lg shadow hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-400 dark:border-gray-700">
                  <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Hall</p>
                  <p class="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-3">${res.data[5].total_rooms - Number(res.data[5].today_avail)} <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Occupied</span></p>
                  <p class="text-xs text-gray-800 dark:text-gray-200 mt-1">Available: <span class="font-semibold">${res.data[5].today_avail}</span></p>
                  <div class="w-full bg-white dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div class="bg-pink-500 h-2 rounded-full" style="width:${(Number(res.data[5].today_avail) / Number(res.data[5].total_rooms)*100)}%"></div>
                  </div>
            </div>
      `;

      document.getElementById('rooms-data').innerHTML += rooms;
}

async function drawMonthlyBookings() {
      const response = await fetch('/monthly-bookings', { method: 'GET' });
      const res = await response.json();
      
      const ctx = document.getElementById('monthlyBookingsChart');

      const isDark = document.documentElement.classList.contains('dark');

      const textColor = isDark ? '#e5e7eb' : '#1f2937';       // light gray for dark mode
      const gridColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';

      if (monthlyBookingsChart) monthlyBookingsChart.destroy();

      monthlyBookingsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                  labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                  datasets: [{
                        label: "Bookings",
                        data: res.data.map(item => item.booking_count),
                        backgroundColor: "#3b82f6",
                        borderRadius: 6 // rounded bar corners
                  }]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false, // allow custom height
                  plugins: {
                        legend: {
                        labels: {
                              color: textColor
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
                                          const value = context.parsed.y;
                                          return `${label}: ${value} Bookings`;
                                    }
                              }
                        }
                  },
                  scales: {
                        y: {
                        beginAtZero: true,
                        ticks: {
                              color: textColor
                        },
                        grid: {
                              color: gridColor
                        }
                        },
                        x: {
                        ticks: {
                              color: textColor
                        },
                        grid: {
                              display: false
                        }
                        }
                  }
            }
      });
}

async function drawBookingTypeDistribution() {
      const response = await fetch('/booking-type-ditribution', { method: 'GET' });
      const res = await response.json();

      const ctx = document.getElementById('bookingTypeChart');
      const isDark = document.documentElement.classList.contains('dark');

      if (bookingTypeChart) bookingTypeChart.destroy();

      bookingTypeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                  labels: ["Check-In", "Day Guest", "Cancelled"],
                  datasets: [{
                        data: [res.data.checkin_total, res.data.day_guest_total, res.data.cancelled_total],
                        backgroundColor: ["#3b82f6", "#eab308", "#ef4444"]
                  }]
            },
            options: {
                  responsive: true,
                  plugins: {
                        legend: {
                        labels: {
                              color: isDark ? "#e5e7eb" : "#1f2937", // label color here
                              font: {
                                    size: 12,
                              }
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
      
}

async function drawGuestTrend() {
      const response = await fetch('/revenue-guest-trend', { method: 'GET' });
      const res = await response.json();
  
      const ctx = document.getElementById('guestChart').getContext('2d');
  
      // detect dark/light mode
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#e5e7eb' : '#374151';
      const gridColor = isDark ? '#4b5563' : '#e5e7eb';
      const tooltipColor = isDark ? '#ffffff' : '#000000';

      if (guestChart) guestChart.destroy();
  
      guestChart = new Chart(ctx, {
            type: 'line',
            data: {
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [
                        {
                        label: 'Guests',
                        data: res.data.map(d => d.guest_count),
                        borderColor: 'rgba(34,197,94,1)',
                        backgroundColor: 'rgba(34,197,94,0.2)',
                        tension: 0.3
                        }
                  ]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                        legend: {
                        labels: { color: textColor }
                        },
                        tooltip: {
                              mode: 'nearest',
                              intersect: false,
                              backgroundColor: '#111827',
                              titleColor: '#FBBF24',
                              bodyColor: '#F9FAFB',
                              borderColor: '#374151',
                              borderWidth: 1,
                              padding: 20,          // bigger box
                              titleFont: {
                                    size: 28,         // bigger title
                                    weight: 'bold'
                              },
                              bodyFont: {
                                  size: 26          // bigger body text
                              },
                              callbacks: {
                                    label: function(context) {
                                          const label = context.label || '';
                                          const value = context.parsed.y;
                                          return `${label}: ${value} Guests`;
                                    }
                              }
                        }
                  },
                  scales: {
                        y: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        suggestedMax: 50,
                        ticks: {
                              stepSize: 2,
                              color: textColor
                        },
                        grid: { color: gridColor }
                        },
                        x: {
                        ticks: {
                              color: textColor
                        },
                        grid: { color: gridColor }
                        }
                  }
            }
      });
}

async function drawRevenueTrend() {
      const response = await fetch('/revenue-guest-trend', { method: 'GET' });
      const res = await response.json();
  
      const ctx = document.getElementById('revenueChart').getContext('2d');
  
      // detect dark/light mode
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#e5e7eb' : '#374151';
      const gridColor = isDark ? '#4b5563' : '#e5e7eb';

      if (hrevenueChartD) hrevenueChartD.destroy();

      hrevenueChartD = new Chart(ctx, {
            type: 'line',
            data: {
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [
                        {
                        label: 'Revenue',
                        data: res.data.map(d => d.revenue),
                        borderColor: 'rgba(59,130,246,1)',
                        backgroundColor: 'rgba(59,130,246,0.2)',
                        tension: 0.3
                        }
                  ]
            },
            options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                        legend: {
                        labels: { color: textColor }
                  },
                  tooltip: {
                        mode: 'nearest',
                        intersect: false,
                        backgroundColor: '#111827',
                        titleColor: '#FBBF24',
                        bodyColor: '#F9FAFB',
                        borderColor: '#374151',
                        borderWidth: 1,
                        padding: 20,          // bigger box
                        titleFont: {
                              size: 28,         // bigger title
                              weight: 'bold'
                        },
                        bodyFont: {
                            size: 26          // bigger body text
                        },
                        callbacks: {
                              label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed.y;
                                    return `${label}: ${value.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })} `;
                              }
                        }
                  }
                  },
                  scales: {
                        y: {
                        beginAtZero: true,
                        ticks: {
                              color: textColor
                        },
                        grid: { color: gridColor }
                        },
                        x: {
                        ticks: {
                              color: textColor
                        },
                        grid: { color: gridColor }
                        }
                  }
            }
      });
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

/*
// Initial load: ensure the default content is shown and charts are drawn
export function initPageDashboard() {
      allNotifications.length = 0;
      mostBookedArea();
      todayGuest();
      totalGuestInHouse('today');
      totalOccupied();
      roomsData();
      upcomingArrivals();
      upcomingCheckouts();
      todaysBookings();
      todayProjectedRevenue();
      bookingOverviewCardsData();
      drawMonthlyBookings();
      drawOccupancyPercentage();
      drawBookingTypeDistribution();
      drawGuestTrend();
      drawRevenueTrend();
};
*/

export async function initPageDashboard() {
      allNotifications.length = 0;

      // Independent async calls in parallel
      const tasks = [
            mostBookedArea(),
            todayGuest(),
            totalGuestInHouse('today'),
            totalOccupied(),
            roomsData(),
            upcomingArrivals(),
            upcomingCheckouts(),
            todaysBookings(),
            todayProjectedRevenue(),
            bookingOverviewCardsData(),
            drawMonthlyBookings(),
            drawOccupancyPercentage(),
            drawBookingTypeDistribution(),
            drawGuestTrend(),
            drawRevenueTrend()
      ];

      await Promise.all(tasks);  // wait until all finish
};
