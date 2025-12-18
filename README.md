# ------------- DEPENDENCIES INSTALLATION --------------- #

pip install -r requirements.txt

# Tailwind css & Chart.js
npm install

# SQL  (local only)
mysql -u username -p < init.sql

# -------------  INSERT DATA IN DB -------------- #
# Go to this folder path backend/excel then will find there the loops.py, open it and run to insert the data in db


npx terser src/frontend/static/scripts/home-dashboard.js -o static/js/home-dashboard.min.js -c -m
npx terser src/frontend/static/scripts/accounting.js -o static/js/accounting.min.js -c -m
npx terser src/frontend/static/scripts/admin.js -o static/js/admin.min.js -c -m
npx terser src/frontend/static/scripts/admin.js -o static/js/all-reservations^Cin.js -c -m
npx terser src/frontend/static/scripts/all-reservations.js -o static/js/all-reservations.min.js -c -m
npx terser src/frontend/static/scripts/analytics.js -o static/js/analytics.min.js -c -m
npx terser src/frontend/static/scripts/housekeeping.js -o static/js/housekeeping.min.js -c -m
npx terser src/frontend/static/scripts/login.js -o static/js/login.min.js -c -m
npx terser src/frontend/static/scripts/rates_availability.js -o static/js/rates_availability.min.js -c -m
npx terser src/frontend/static/scripts/revenue_mgmt.js -o static/js/revenue_mgmt.min.js -c -m
npx terser src/frontend/static/scripts/script.js -o static/js/script.min.js -c -m
npx terser src/frontend/static/scripts/staff_mgmt.js -o static/js/staff_mgmt.min.js -c -m