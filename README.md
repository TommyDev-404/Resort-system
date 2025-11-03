# ------------- DEPENDENCIES INSTALLATION --------------- #

# Python (Flask)
pip install -r flask_dependencies.txt

# Tailwind css & Chart.js
npm install

# SQL 
mysql -u username -p < init.sql

# -------------  INSERT DATA IN DB -------------- #
# Go to this folder path backend/excel then will find there the loops.py, open it and run to insert the data in db