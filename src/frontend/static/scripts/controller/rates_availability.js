
// ----------------- HELPERS ----------------- //
function successMessageCard(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="success-message">
                  <div class="bg-white w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                        <i class="ti ti-circle-check text-6xl font-light text-green-500"></i>
                        <h2 class="text-lg text-gray-600" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-message">Okay</button>
                  </div>
            </div>
      `;

      document.getElementById('messagePortal').innerHTML += msg;
}

function failedMessageCard(message){
      const msg = `
            <div class="fixed inset-0 bg-black/20 flex justify-center items-center fade-in-up z-50" id="failed-message">
                  <div class="bg-white w-[23%] h-auto shadow-md rounded-sm flex flex-col p-6 text-center gap-4">
                        <i class="ti ti-circle-x text-6xl font-light text-red-500"></i>
                        <h2 class="text-lg text-gray-600" id="message">${message}</h2>
                        <button class="bg-blue-500 p-1 text-white rounded-lg mt-6 hover:bg-blue-600" id="close-failed-message">Okay</button>
                  </div>
            </div>
      `;

      document.getElementById('messagePortal').innerHTML += msg;
}

function openUpdateAreaModal(e) {
      console.log(e);
      const row = e.target.closest('tr'); // get the row
      const cells = row.querySelectorAll('td'); // get all td in that row

      const modal = `
            <div id="update-area-modal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 fade-in-up">
                  <div class="bg-card-bg w-full max-w-[500px] rounded-2xl shadow-2xl px-6 py-2 relative border border-gray-200">
                        <span id="close-area-update-modal" class="absolute top-3 right-4 text-gray-500 text-[25px] cursor-pointer">&times;</span>
                        <h3 class="text-2xl font-bold text-primary-blue mb-5 text-center flex items-center justify-center gap-2 mt-4"><i class="fas fa-user-tag text-primary-blue"></i>Update Price</h3>
                        <form id="updateAreaForm">
                              <div class="w-full mb-6 flex flex-col gap-2">
                                    <input type="hidden" name="area-name-update" value="${cells[0].textContent}">
                                    <input type="number" name="update-price" placeholder="Price (₱)" required class="w-full p-2 border rounded" value="${cells[3].textContent.slice(1)}">
                                    <button type="submit" class="px-5 py-2 mt-8 bg-primary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition"><i class="fas fa-paper-plane mr-1"></i> Update</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('ratesAvailabilityPortal').innerHTML += modal;
}

async function renderTable() {
      // Fetch data from backend
      let rows = [];
      try {
            const response = await fetch('/availables');
            const res = await response.json();
            res.data.forEach(data => {
                  rows.push(data);
            });
      } catch (err) {
          console.error("Failed to fetch data:", err);
      }

      // Columns for the table
      let columns = ["Area Type", "Area Count", "Max Occ.", "Rate ($)", "Today's Avail.", "Tomorrow's Avail.", "Action"];
  
      // Render header
      const headerHtml = columns.map(col => `<th class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">${col}</th>`).join('');
      document.getElementById('table-header').innerHTML = `<tr>${headerHtml}</tr>`;

      // Render body
      const bodyHtml = rows.map(row => {
            const { name, capacity } = areaTypeInfo(row.room_type);
            return `<tr class="fade-in-up">
                  <td class="px-6 py-4 font-semibold">${name}</td>
                  <td class="px-3 py-4 text-center">${row.total_rooms}</td>
                  <td class="px-3 py-4 text-center font-bold text-lg text-primary-blue">${capacity}</td>
                  <td class="px-3 py-4 text-center text-green-600">₱${row.rate}</td>
                  <td class="px-3 py-4 text-center"><span class="font-bold text-lg text-red-500">${row.today_avail}</span></td>
                  <td class="px-3 py-4 text-center"><span class="font-bold text-lg text-green-500">${row.tomorrow_avail}</span></td>
                  <td class="px-3 py-4 flex gap-2 justify-center"><button class="update-btn text-sm text-white bg-teal-500 py-2 px-4 rounded-sm  flex gap-2" id="${row.room_type}"><i class="ti ti-edit text-lg"></i>Update</button></td>
            </tr>`;
      }).join('');

      document.getElementById('table2-body').innerHTML = bodyHtml;
}

function areaTypeInfo(area){
      const room_name = {
            'premium': 'Premium Villa Room',
            'standard': 'Standard Villa Room',
            'barkada': 'Barkada Room',
            'family': 'Family Room',
            'garden': 'Garden View Room',
            'cabana': 'Cabana Cottage',
            'small': 'Small Cottage',
            'big': 'Big Cottage',
            'hall' : "Hall"
      };

      const capacity = {
            'premium': '12',
            'standard': '10',
            'barkada': '8',
            'family': '10',
            'garden': '4',
            'cabana': '30',
            'small': '20',
            'big': '50',
            'hall' : "100"
      };

      return {'name': room_name[area], 'capacity': capacity[area]}
}

async function updatePrice(e){
      e.preventDefault();
      const form = new FormData(e.target);
      const price = form.get('update-price');
      const name = form.get('area-name-update').split(' ');

      const response = await fetch(`/update-price?price=${price}&name=${name[0]}`, { method: 'POST', headers: {'Content-Type': 'application/json'}});
      const result = await response.json();

      if (result.success){
            successMessageCard(result.message);
            e.target.reset();
            document.getElementById('update-area-modal').remove();
            renderTable();
      }else {
            failedMessageCard(result.message);
      }
}

// --------------  EVENT LISTENERS --------------- //
document.addEventListener('click', (e) => {
      const btn = e.target.closest('.update-btn'); // ensures we get the button even if child is clicked
      console.log(btn);
      if (btn) {
          const areaId = btn.id;
          openUpdateAreaModal(e); // pass the ID to the modal
      }
  
      // Close modal
      if (e.target.matches('#close-area-update-modal')) {
          document.getElementById('update-area-modal').remove();
      }
  });

  
document.addEventListener('submit', (e) =>{
      if (e.target.matches('#updateAreaForm')) updatePrice(e);
});      

renderTable();

// Load default category
export function initPageRatesAndAvailability(){
      renderTable();
}
