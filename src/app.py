import pymysql
from flask import Flask, render_template, session, request, jsonify, url_for, redirect
from backend.model import Database, Dashboard, Analytics, Reservation, Housekeeping, RatesAndAvailability, Accounting, Alerts, RevenueMgmt, Admin, Login

app = Flask(__name__, template_folder='frontend/template', static_folder='frontend/static')
app.secret_key = 'i_love_u'  # secret key

# prevent going back to homepage after logout or going direct on home page without authentication
@app.after_request
def add_header(response):
      response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
      response.headers["Pragma"] = "no-cache"
      response.headers["Expires"] = "0"
      return response

# Create DB object once here
db = Database(
      host="localhost",
      user="tommy",
      password="2006",
      database="resort_db",
      cursor=pymysql.cursors.DictCursor
)

admin = Admin(db)
analytics = Analytics(db)
dashboard = Dashboard(db, analytics.get_target_revenue().get('target'))
alert = Alerts(db)
reserve = Reservation(db)
house = Housekeeping(db)
avl = RatesAndAvailability(db)
acc = Accounting(db)
rev = RevenueMgmt(db)
login = Login(db)


# render templates
#------------------ LOGIN ------------------#
@app.route('/login', methods=['GET'])
def login_page():
      return render_template('login.html')

#------------------ RESORT MAIN PAGE ------------------#
@app.route('/resort-admin-page', methods=['GET'])
def system_page():
      if  not session.get('admin'):
            return redirect(url_for('login_page'))
      
      with db.connect() as conn:
            cursor = conn.cursor()

            # Expire outdated promos
            cursor.execute(""" UPDATE promos SET status = 'Expired' WHERE end_date < CURDATE() AND status = 'Active' """)

            # Restore room rates
            cursor.execute(""" 
                  UPDATE accomodation_spaces AS a
                  LEFT JOIN promos AS p
                  ON a.promo = p.name
                  SET a.rate = a.orig_rate
                  WHERE p.end_date < CURDATE()
                  AND LOWER(TRIM(a.promo)) != 'None';
            """)
            conn.commit()

      return render_template('index.html')

# api
#------------------ ALERTS ------------------#
@app.route('/occupancy-alert', methods=['GET'])
def occupancy_alert():
      return jsonify(alert.occupancy_alert())

@app.route('/housekeeping-alert', methods=['GET'])
def housekeeping_alert():
      return jsonify(alert.housekeeping_alert())


#------------------ LOGIN API ------------------#
@app.route('/login/auth', methods=['POST'])
def login_auth():
      return jsonify(login.login(**request.get_json()))

#------------------ FORGOT PASSWORD API ------------------#
@app.route('/forgot-password', methods=['POST'])
def forgot_pass():
      return jsonify(login.forgot_pass(request.get_json()))

@app.route('/forgot-password/code-verification', methods=['POST'])
def verify_code():
      return jsonify(login.check_code(request.get_json()))

#------------------ CHANGE PASSWORD API ------------------#
@app.route('/change-password', methods=['POST'])
def change_password():
      return jsonify(login.changePass(request.get_json()))


#------------------ DASHBOARD ------------------#
@app.route('/total-guest-in-house', methods=['GET'])
def total_guest_in_house():
      return jsonify(dashboard.get_total_guest_house())

@app.route('/today-guest', methods=['GET'])
def today_guest():
      return jsonify(dashboard.today_guest())

@app.route('/occupancy-forecast', methods=['GET'])
def occupancy_all():
      return jsonify(dashboard.forecast_occupancy())

@app.route('/today-checkin', methods=['GET'])
def checkin():
      return jsonify(dashboard.todays_checkin())

@app.route('/occupancy', methods=['GET'])
def occupancy():
      return jsonify(dashboard.occupancy())

@app.route('/revenue', methods=['GET'])
def revenue():
      return jsonify(dashboard.revenue_today())

@app.route('/heavy-guest-month', methods=['GET'])
def heavy_month():
      return jsonify(dashboard.heavy_guest_month())

@app.route('/most-booked-area', methods=['GET'])
def most_booked_area():
      return jsonify(dashboard.most_booked_area())


#----------------- ANALYTICS ------------------#
@app.route('/mtd-occupancy-all', methods=['GET'])
def mtd_occupancy_all():
      return jsonify(analytics.get_occupancy())

@app.route('/mtd-occupancy-type', methods=['GET'])
def mtd_occupancy_type():
      return jsonify(analytics.get_occupancy(request.args.get('accomodation_type')))

@app.route('/mtd-adr-all', methods=['GET'])
def mtd_adr_all():
      return jsonify(analytics.get_adr())

@app.route('/mtd-adr-type', methods=['GET'])
def mtd_adr_type():
      return jsonify(analytics.get_adr(request.args.get('accomodation_type')))

@app.route('/mtd-revpar-all', methods=['GET'])
def mtd_revpar_all():
      return jsonify(analytics.get_revpar())

@app.route('/mtd-revpar-type', methods=['GET'])
def mtd_revpar_type():
      return jsonify(analytics.get_revpar(request.args.get('accomodation_type')))

@app.route('/checkin-forecast-all', methods=['GET'])
def occupancy_forecast():
      return jsonify(analytics.forecast_checkin())

@app.route('/checkin-forecast-type', methods=['GET'])
def occupancy_forecast_type():
      return jsonify(analytics.forecast_checkin(request.args.get('accomodation_type')))

@app.route('/revenue-forecast-all', methods=['GET'])
def revenue_forecast():
      return jsonify(analytics.forecasted_revenue())

@app.route('/revenue-forecast-type', methods=['GET'])
def revenue_forecast_type():
      return jsonify(analytics.forecasted_revenue(request.args.get('accomodation_type')))

@app.route('/target-revenue', methods=['GET'])
def target_revenue():
      return jsonify(analytics.get_target_revenue())


#--------------- ALL RESERVATION ------------------#
@app.route('/avl-spaces', methods=['GET'])
def avl_spaces():
      return jsonify(reserve.get_avl_spaces())

@app.route('/avl-rooms', methods=['GET'])
def avl_rooms():
      return jsonify(reserve.get_avl_room(request.args.get('room_name')))

@app.route('/avl-rooms-all', methods=['GET'])
def avl_rooms_all():
      return jsonify(reserve.get_avl_room_all())

@app.route('/totals', methods=['GET'])
def totals():
      return jsonify(reserve.totals(request.args.get('month'), request.args.get('year')))

@app.route('/add-booking', methods=['POST'])
def add_booking():
      return jsonify(reserve.add_booking(**request.get_json()))

@app.route('/recent-bookings', methods=['GET'])
def recent_bookings():
      return jsonify(reserve.recent_bookings(request.args.get('year'), request.args.get('month')))

@app.route('/category-bookings', methods=['GET'])
def category_bookings():
      return jsonify(reserve.booking_category(request.args.get('year'), request.args.get('month'), request.args.get('category')))

@app.route('/current-bookings', methods=['GET'])
def current_bookings():
      return jsonify(reserve.current_bookings())

@app.route('/today-checkouts', methods=['GET'])
def today_checkouts():
      return jsonify(reserve.todays_checkout())

@app.route('/total-checkins', methods=['GET'])
def total_checkin():
      return jsonify(reserve.total_checkin())

@app.route('/upcoming-arrivals', methods=['GET'])
def upcoming_arrivals():
      return jsonify(reserve.arrivals())

@app.route('/get-years', methods=['GET'])
def get_years():
      return jsonify(reserve.get_year_data())

@app.route('/mark-paid', methods=['POST'])
def mark_paid():
      return jsonify(reserve.mark_paid(request.args.get('payment'), request.args.get('id')))

@app.route('/mark-checkin/<int:id>', methods=['POST'])
def mark_checkin(id):
      return jsonify(reserve.mark_checkin(id))

@app.route('/mark-checkout', methods=['POST'])
def mark_checkout():
      return jsonify(reserve.mark_checkout(request.args.get('id'), request.args.get('accomodation')))

@app.route('/cancel-booking', methods=['POST'])
def cancel_booking():
      return jsonify(reserve.cancel_booking(request.args.get('id'), request.args.get('accomodation')))

@app.route('/view-details/<int:id>', methods=['GET'])
def view_details(id):
      return jsonify(reserve.view_details(id))

@app.route('/cancelled-bookings', methods=['GET'])
def cancelled():
      return jsonify(reserve.total_cancelled())

@app.route('/get-reservation-date', methods=['GET'])
def reservation_date():
      return jsonify(reserve.get_reservation_date(request.args.get('id')))

@app.route('/update-reservation-date', methods=['POST'])
def update_reservation_date():
      return jsonify(reserve.update_reservation_date(**request.get_json()))

@app.route('/get-data-to-update', methods=['GET'])
def get_data_to_update():
      return jsonify(reserve.get_data_to_update(request.args.get('id')))


#--------------- HOUSEKEEPING ------------------#
@app.route('/summary-data', methods=['GET'])
def summary_data():
      return jsonify(house.total_data())

@app.route('/area-data', methods=['GET'])
def area_data():
      return jsonify(house.get_area_data(request.args.get('accomodation')))

@app.route('/total-area-data', methods=['GET'])
def total_area_data():
      return jsonify(house.total_area_data())

@app.route('/assign-cleaner', methods=['POST'])
def assign_cleaner():
      return jsonify(house.assign_cleaner(**request.get_json()))

@app.route('/reassign-cleaner', methods=['POST'])
def reassign_cleaner():
      return jsonify(house.reassign_cleaner(request.args.get('name'), request.args.get('role'), request.args.get('date'), request.args.get('room_no'), request.args.get('area_name')))

@app.route('/update-area-condition', methods=['POST'])
def update_area_condition():
      return jsonify(house.update_room_condition(request.args.get('room_no'), request.args.get('area_name')))


#--------------- RATES AND AVAILABILITY ------------------#
@app.route('/availables', methods=['GET'])
def availables():
      return jsonify(avl.availables())

@app.route('/update-price', methods=['POST'])
def update_price():
      return jsonify(avl.update_price(request.args.get('price'), request.args.get('name')))


#--------------- RATES AND AVAILABILITY ------------------#
@app.route('/accounting-data', methods=['GET'])
def accounting_data():
      return jsonify(acc.get_current_payment_data())

@app.route('/load-revenue', methods=['GET'])
def load_data():
      return jsonify(acc.get_payment_data(request.args.get('year')))


#--------------- REVENUE MANAGEMENT ------------------#
@app.route('/promo', methods=['POST'])
def promo():
      data = request.get_json()
      promo_name = data.get('promo_name')
      discount_rate = data.get('promo_rate')
      selected_rooms = data.get('area_list')  # array
      start = data.get('date')
      end = data.get('end_date')

      print(promo_name, discount_rate, selected_rooms, start, end)

      return jsonify(rev.apply_promo(start, promo_name, end, discount_rate, selected_rooms))

@app.route('/get-all-promo', methods=['GET'])
def get_all_promo():
      return jsonify(rev.get_promo_data())


#--------------- ADMIN PROFILE ------------------#
@app.route('/change-password', methods=['POST'])
def change_pass():
      return jsonify(admin.changePass(**request.get_json()))

@app.route('/change-password-final', methods=['POST'])
def change_passv2():
      return jsonify(admin.changePassv2(request.args.get('code')))

@app.route('/edit-info', methods=['POST'])
def edit_info():
      return jsonify(admin.edit_info(request.args.get('info'), request.args.get('type'), request.args.get('id')))

@app.route('/get-admin-profile', methods=['GET'])
def admin_profile():
      return jsonify(admin.get_admin_profile())


#--------------- LOGOUT ------------------#
@app.route('/logout', methods=['POST'])
def logout():
      session.clear()
      return redirect(url_for('login_page'))



if __name__ == '__main__':
      app.run(debug=True)


"""
CREATE TABLE bookings (
      booking_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      total_guest INT NOT NULL,
      booking_type ENUM('Reservation', 'Walk-in', 'Day Guest') NOT NULL,
      status ENUM('Reserved', 'Checked-in', 'Checked-out', 'Completed', 'Cancelled', 'No-show') DEFAULT 'Reserved',
      payment_type ENUM('Direct', 'Online') NOT NULL,
      payment_status ENUM('Pending', 'Paid', 'Refunded') DEFAULT 'Pending',
      accomodations JSON,  -- store selected room types or IDs
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      total_amount DECIMAL(10,2) DEFAULT 0.00
);
"""