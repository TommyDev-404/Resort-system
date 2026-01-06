import pymysql
from datetime import date, timedelta
from flask import Flask, render_template, session, request, jsonify, url_for, redirect
from backend.model import Database, Dashboard, Analytics, Reservation, Housekeeping, RatesAndAvailability, Accounting, Alerts, RevenueMgmt, Admin, Login, Staff_Management, Storage
from backend.extensions import cache

app = Flask(__name__, template_folder='frontend/template', static_folder='frontend/static')
app.secret_key = 'i_love_u'  # secret key

# Set session lifetime
app.permanent_session_lifetime = timedelta(minutes=15)  # 15 minutes

# Configure cache
app.config['CACHE_TYPE'] = 'SimpleCache'
app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # 5 minutes
cache.init_app(app)

# Create DB object once here
db = Database( host="localhost", user="grandsight", password="123456", database="resort_db", port=3306, cursor=pymysql.cursors.DictCursor )

# create instances of classesdb = Database()
admin = Admin(db)
analytics = Analytics(db)
alert = Alerts(db)
avl = RatesAndAvailability(db)
acc = Accounting(db)
dashboard = Dashboard(db)
reserve = Reservation(db, alert, dashboard)
house = Housekeeping(db, alert)
rev = RevenueMgmt(db, alert, reserve)
staff = Staff_Management(db, house)
login = Login(db)

# prevent going back to homepage after logout or going direct on home page without authentication
@app.after_request
def add_header(response):
      response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
      response.headers["Pragma"] = "no-cache"
      response.headers["Expires"] = "0"
      return response

# render templates
#------------------ LOGIN ------------------#
@app.route('/')
def index():
      return redirect(url_for('login_page'))

@app.route('/login', methods=['GET'])
def login_page():
      return render_template('login.html')

#------------------ RESORT MAIN PAGE ------------------#
@app.route('/resort-admin-page', methods=['GET'])
def system_page():
      if  not session.get('admin'):
            return redirect(url_for('login_page'))
      
      # system automation functions
      alert.auto_checkout_guest()
      alert.occupancy_alert()
      alert.generate_alerts()
      alert.cron_jobs()

      return render_template('admin.html')

# api
#------------------ ALERTS ------------------#
@app.route('/occupancy-alert', methods=['GET'])
def occupancy_alert():
      return jsonify(alert.occupancy_alert())

@app.route('/housekeeping-alert', methods=['GET'])
def housekeeping_alert():
      return jsonify(alert.housekeeping_alert())

@app.route('/notification-count', methods=['GET'])
def notif_count():
      return jsonify(alert.notification_count())

@app.route('/bookings-alert', methods=['GET'])
def bookings_alert():
      return jsonify(alert.bookings_alert())


#------------------ LOGIN API ------------------#
@app.route('/login/auth', methods=['POST'])
def login_auth():
      data = request.get_json()
      result = login.login(**data)  # your login function
      if result['success']:
            session.permanent = True
            session['admin'] = True
      return jsonify(result)

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

@app.route('/bookings-overview-data', methods=['GET'])
def checkin():
      return jsonify(dashboard.bookings_overview_cards_data())

@app.route('/today-bookings', methods=['GET'])
def bookings():
      return jsonify(dashboard.today_bookings())

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

@app.route('/top-booked-area', methods=['GET'])
def top_booked_area():
      return jsonify(dashboard.top_most_booked_area())

@app.route('/upcoming-checkout', methods=['GET'])
def upcoming_checkout():
      return jsonify(dashboard.upcoming_checkouts(request.args.get('day')))

@app.route('/upcoming-arrival', methods=['GET'])
def upcoming_arrival():
      return jsonify(dashboard.upcoming_arrival(request.args.get('day')))

@app.route('/upcoming-count', methods=['GET'])
def upcoming_count():
      return jsonify(dashboard.upcoming_count())

@app.route('/occupied-room', methods=['GET'])
def occupied_room():
      return jsonify(dashboard.occupied_room())

@app.route('/monthly-bookings', methods=['GET'])
def monthly_bookings():
      return jsonify(dashboard.monthly_bookings_data())

@app.route('/booking-type-ditribution', methods=['GET'])
def booking_type_distro():
      return jsonify(dashboard.booking_type_distro())

@app.route('/revenue-guest-trend', methods=['GET'])
def revenue_guest_trend():
      return jsonify(dashboard.revenue_guest_trend_data())


#----------------- ANALYTICS ------------------#
@app.route('/occupancy-forecast', methods=['GET'])
def occupancy_all():
      return jsonify(analytics.forecast_occupancy())

@app.route('/mtd-occupancy-all', methods=['GET'])
def mtd_occupancy_all():
      return jsonify(analytics.get_occupancy())

@app.route('/mtd-occupancy-type', methods=['GET'])
def mtd_occupancy_type():
      return jsonify(analytics.get_occupancy(request.args.get('accomodation_type')))

@app.route('/daily-revenue-all', methods=['GET'])
def daily_revenue_all():
      return jsonify(analytics.daily_revenue())

@app.route('/daily-revenue-type', methods=['GET'])
def daily_revenue_type():
      return jsonify(analytics.daily_revenue(request.args.get('accomodation_type')))

@app.route('/monthly-revenue-all', methods=['GET'])
def monthly_all():
      return jsonify(analytics.monthly_revenue())

@app.route('/monthly-revenue-type', methods=['GET'])
def monthly_revenuetype():
      return jsonify(analytics.monthly_revenue(request.args.get('accomodation_type')))

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

@app.route('/target-revenue-type', methods=['GET'])
def target_revenue_type():
      return jsonify(analytics.get_target_revenue(request.args.get('accomodation_type')))



#--------------- ALL RESERVATION ------------------#
@app.route('/avl-spaces', methods=['GET'])
def avl_spaces():
      return jsonify(reserve.get_avl_spaces())

@app.route('/summary-cards-data', methods=['GET'])
def summary_cards_data():
      return jsonify(reserve.summaryCardsData())

@app.route('/avl-rooms', methods=['GET'])
def avl_rooms_all():
      return jsonify(reserve.get_avl_room())

@app.route('/totals', methods=['GET'])
def totals():
      return jsonify(reserve.totals(request.args.get('year'), request.args.get('month'), request.args.get('day')))

@app.route('/totals-month', methods=['GET'])
def totals_month():
      return jsonify(reserve.totals(request.args.get('year'), request.args.get('month')))

@app.route('/add-booking', methods=['POST'])
def add_booking():
      return jsonify(reserve.add_booking(**request.get_json()))

@app.route('/recent-bookings', methods=['GET'])
def recent_bookings():
      return jsonify(reserve.recent_bookings(request.args.get('year'), request.args.get('month'), request.args.get('day')))

@app.route('/recent-bookings-month', methods=['GET'])
def recent_bookings_month():
      return jsonify(reserve.recent_bookings(request.args.get('year'), request.args.get('month')))

@app.route('/category-bookings', methods=['GET'])
def category_bookings():
      return jsonify(reserve.booking_category(request.args.get('category'), request.args.get('year'), request.args.get('month'), request.args.get('day')))

@app.route('/category-bookings-month', methods=['GET'])
def category_bookings_month():
      return jsonify(reserve.booking_category(request.args.get('category'), request.args.get('year'), request.args.get('month')))

@app.route('/get-years', methods=['GET'])
def get_years():
      return jsonify(reserve.get_year_data())

@app.route('/mark-paid', methods=['POST'])
def mark_paid():
      return jsonify(reserve.mark_paid(request.args.get('payment'), request.args.get('id'), request.args.get('date')))

@app.route('/mark-checkin', methods=['POST'])
def mark_checkin():
      return jsonify(reserve.mark_checkin(request.args.get('id'), request.args.get('accomodation')))

@app.route('/mark-checkout', methods=['POST'])
def mark_checkout():
      return jsonify(reserve.mark_checkout(request.args.get('id'), request.args.get('accomodation')))

@app.route('/cancel-booking', methods=['POST'])
def cancel_booking():
      return jsonify(reserve.cancel_booking(request.args.get('id'), request.args.get('accomodation')))

@app.route('/view-details/<int:id>', methods=['GET'])
def view_details(id):
      return jsonify(reserve.view_details(id))

@app.route('/get-reservation-date', methods=['GET'])
def reservation_date():
      return jsonify(reserve.get_reservation_date(request.args.get('id')))

@app.route('/update-reservation-date', methods=['POST'])
def update_reservation_date():
      return jsonify(reserve.update_reservation_date(**request.get_json()))

@app.route('/get-data-to-update', methods=['GET'])
def get_data_to_update():
      return jsonify(reserve.get_data_to_update(request.args.get('id')))

@app.route('/search-guest', methods=['GET'])
def search_guest():
      return jsonify(reserve.search_guest(request.args.get('name'),  request.args.get('category'), request.args.get('year'), request.args.get('month'), request.args.get('day')))

@app.route('/search-guest-month', methods=['GET'])
def search_guest_month():
      return jsonify(reserve.search_guest(request.args.get('name'),  request.args.get('category'), request.args.get('year'), request.args.get('month')))

@app.route('/search-guest-year', methods=['GET'])
def search_guest_year():
      return jsonify(reserve.search_guest(request.args.get('name'),  request.args.get('category'), request.args.get('year')))


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

@app.route('/staff-cleaners', methods=['GET'])
def staff_cleaners():
      return jsonify(house.staff_cleaners())

@app.route('/room-cleaning-history', methods=['GET'])
def room_cleaning_history():
      return jsonify(house.room_assigned_history(request.args.get('room_name')))

@app.route('/cleaning-history', methods=['GET'])
def cleaning_history():
      return jsonify(house.cleaning_history(request.args.get('month'), request.args.get('day')))


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

      return jsonify(rev.apply_promo(start, promo_name, end, discount_rate, selected_rooms))

@app.route('/update-promo', methods=['POST'])
def update_promo():
      data = request.get_json()
      id = data.get('id')
      promo_name = data.get('promo_name')
      discount_rate = data.get('promo_rate')
      selected_rooms = data.get('area_list')  # array
      start = data.get('date')
      end = data.get('end_date')
      prev_area = data.get('prev_area')

      return jsonify(rev.update_promo(id, start, promo_name, end, discount_rate, selected_rooms, prev_area))

@app.route('/get-all-promo', methods=['GET'])
def get_all_promo():
      return jsonify(rev.get_promo_data())

@app.route('/get-promo', methods=['GET'])
def get_promo():
      return jsonify(rev.get_promo_data(request.args.get('id')))

@app.route('/remove-promo', methods=['DELETE'])
def remove_promo():
      return jsonify(rev.remove_promo(request.args.get('id'), request.args.get('area_promos')))

@app.route('/get-promo-area-data', methods=['GET'])
def get_promo_area():
      return jsonify(rev.get_promo_area(request.args.get('id')))


#--------------- STAFF MANAGEMENT ------------------#
@app.route('/add-staff', methods=['POST'])
def add_staff():
      return jsonify(staff.add_staff(**request.get_json()))

@app.route('/update-staff-info', methods=['POST'])
def update_staff():
      return jsonify(staff.update_staff(**request.get_json()))

@app.route('/view-staff-info', methods=['GET'])
def view_staff_info():
      return jsonify(staff.view_staff_info(request.args.get('id')))

@app.route('/remove-staff-attendance', methods=['DELETE'])
def remove_staff_attendance():
      return jsonify(staff.remove_staff_attendance(request.args.get('id'), request.args.get('status'),  request.args.get('date')))

@app.route('/remove-staff', methods=['DELETE'])
def remove_staff():
      return jsonify(staff.remove_staff(request.args.get('id')))

@app.route('/all-staff', methods=['GET'])
def all_staff():
      return jsonify(staff.all_staff())

@app.route('/search-staff', methods=['GET'])
def search_staff():
      return jsonify(staff.search_staff(request.args.get('staff_name')))

@app.route('/staff-list', methods=['GET'])
def all_staff_list():
      return jsonify(staff.staff_list(request.args.get('day'), request.args.get('month')))

@app.route('/all-staff-attendance', methods=['GET'])
def all_staff_attendance():
      return jsonify(staff.all_staff_attendance(request.args.get('day'), request.args.get('month')))

@app.route('/all-present-staff', methods=['GET'])
def all_present_staff():
      return jsonify(staff.all_present_staff(request.args.get('day'), request.args.get('month')))

@app.route('/individual-staff-attendance', methods=['GET'])
def individual_staff_attendance():
      return jsonify(staff.individual_staff_attendance(request.args.get('id')))

@app.route('/add-staff-attendance', methods=['POST'])
def add_staff_attendance():
      return jsonify(staff.add_staff_attendance(request.get_json()))

@app.route('/update-staff-attendance', methods=['POST'])
def update_staff_attendance():
      return jsonify(staff.update_staff_attendance(request.get_json()))

@app.route('/summary-cards', methods=['GET'])
def summary_cards():
      return jsonify(staff.staff_summary_cards(request.args.get('month'), request.args.get('day')))

@app.route('/thisweek-onleave-data', methods=['GET'])
def on_leave():
      return jsonify(staff.this_week_onleave())

@app.route('/sort-attendance-data', methods=['GET'])
def sort_attendance():
      return jsonify(staff.all_staff_attendance(request.args.get('day'), request.args.get('month')))


#--------------- ADMIN PROFILE ------------------#
@app.route('/change-passwordv2', methods=['POST'])
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

