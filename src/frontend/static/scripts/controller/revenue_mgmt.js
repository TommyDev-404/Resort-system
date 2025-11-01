
// ---------------------- HELPERS ---------------------
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

function createRow(date, promo_name, discount, area, end, status){
      const all_area = {
            'Premium': 'Premium Villa Room',
            'Standard': 'Standard Villa Room',
            'Family': 'Family Room',
            'Barkada': 'Barkada Room',
            'Garden': 'Garden View Room',
            'Cabana': 'Cabana Cottage',
            'Small': 'Small Cottage',
            'Big': 'Big Cottage',
            'Hall': 'Hall'
      }
      const formatted_area_name = area.split(',').map(a => all_area[a]);

      const row = `
            <tr class="hover:bg-blue-50 transition fade-in-up text-[17px]">
                  <td class="py-3 px-4 text-gray-700">${date}</td>
                  <td class="py-3 px-4 text-gray-700">${end}</td>
                  <td class="py-3 px-4 font-medium text-gray-800">${promo_name}</td>
                  <td class="py-3 px-4 text-gray-700">${discount}</td>
                  <td class="py-3 px-4 text-gray-700">${formatted_area_name}</td>
                  <td class="text-white rounded-lg text-sm font-bold"><span class="bg-green-500 py-2 px-4 rounded-lg">${status}</span></td>
            </tr>
      `;

      document.getElementById('promo-tbody').innerHTML += row;
}

function renderAddPromoModal(){
      const modal = `
            <div class="absolute top-0 left-0 w-full h-full bg-black/20 z-50 fade-in-up" id="promo-overlay">
                  <div class="relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card-bg py-2 pb-4 px-[20px] max-w-[800px] rounded-xl shadow-lg border border-gray-100">
                        <span id="close-promo-modal" class="text-[26px] flex justify-end cursor-pointer">&times;</span>
                        <h3 class="text-xl font-semibold mb-4 text-center">Promotions</h3>
                        <form id="promosForm">
                              <div class="space-y-4">
                                    <div>
                                          <label for="promo_name" class="block text-sm font-medium text-gray-700">Promotion Name</label>
                                          <input type="text" id="promo_name" name="promo_name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-blue focus:ring-primary-blue">
                                    </div>
                                    <div>
                                          <label for="promo_rate" class="block text-sm font-medium text-gray-700">Discount Rate (%)</label>
                                          <input type="number" id="promo_rate" name="promo_rate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-primary-blue focus:ring-primary-blue">
                                    </div>
                                    <div class="bg-gray-50 border border-gray-400 rounded-sm p-4">
                                          <h2 class="font-semibold text-[19px] mb-4">Area's to apply promotion: </h2>
                                          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Premium">Premium Villa Room</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Standard">Standard Villa Room</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Garden">Garden View Room</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Barkada">Barkada Room</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Family">Family Room</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Cabana">Cabana Cottage</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Small">Small Cottage</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Big">Big Cottage</label>
                                                <label class="border bg-white border-gray-400 p-2 rounded-lg flex gap-2 hover:bg-green-200"><input type="checkbox" name="areas_promo" value="Hall">Hall</label>
                                          </div>
                                    </div>
                                    <div class="flex flex-col text-sm">
                                          Start Promotion Date:
                                          <input type="date" name="date" required class="border border-gray-200 rounded-sm p-4 mb-4">
                                          End PromotionDate:
                                          <input type="date" name="end_date" required class="border border-gray-200 rounded-sm p-4">
                                    </div>
                                    <button type="submit" class="w-full bg-primary-blue text-white font-bold py-2 px-4 mt-4 rounded-lg shadow-md hover:bg-blue-700 transition" id="save-promo">Save Promotion</button>
                              </div>
                        </form>
                  </div>
            </div>
      `;

      document.getElementById('promoModalPortal').innerHTML += modal;
}

async function applyPromo(e) {
      e.preventDefault();
      const form = new FormData(e.target);

      let area_list = [];
      document.querySelectorAll('input[name="areas_promo"]:checked').forEach(check => { area_list.push(check.value) });
      form.append('area_list', area_list);

      const response = await fetch('/promo', {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Object.fromEntries(form.entries()))
      });
      const res = await response.json();

      if (res.success){
            successMessageCard(res.message);
            e.target.reset();
            document.querySelector('#promo-overlay').remove();
            getAllPromo();
      }else{
            failedMessageCard(res.message);
      }
}

async function getAllPromo() {
      const response = await fetch('/get-all-promo');
      const res = await response.json();
      
      document.querySelectorAll('#promo-tbody tr').forEach(row => row.remove());
      if (res.success){
            res.data.forEach(row => {
                  const start = new Date(row.date).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
                  const end = new Date(row.end_date).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
                  let discount = row.name.split('-');

                  createRow(start, discount[0], discount[1], row.area, end, row.status)
            });
      }else{
            const empty_row = `
                  <tr id="no-promo-row">
                        <td colspan="6" class="text-center text-gray-500 py-4">No promotions yet.</td>
                  </tr>
            `;
            
            document.getElementById('promo-tbody').innerHTML += empty_row;
      }
}

getAllPromo();

// submit
document.addEventListener('submit', (e) => {
      if(e.target.matches('#promosForm')) applyPromo(e);
});

// click
document.addEventListener('click', (e) => {
      if(e.target.matches('#add-promo')) renderAddPromoModal();
      if(e.target.matches('#close-promo-modal')) document.querySelector('#promo-overlay').remove();
});

export function initPageRevenueMgmt(){
      getAllPromo();
}