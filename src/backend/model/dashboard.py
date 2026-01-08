from backend.forecast import Forecast
from backend.extensions import cache

class Dashboard:
      def __init__(self, db):
            self.db = db
            self.revenue_forecast = Forecast()

      def dashboard_metrics(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        WITH
                        -- Today's Check-ins and Guests
                        today_checkin AS (
                        SELECT
                              COUNT(booking_id) AS check_in,
                              COALESCE(SUM(total_guest), 0) AS guests
                        FROM bookings
                        WHERE check_in = CURRENT_DATE()
                        AND booking_type IN ('Check-in', 'Day Guest')
                        ),
                        yesterday_checkin AS (
                        SELECT COUNT(booking_id) AS check_in
                        FROM bookings
                        WHERE check_in = CURRENT_DATE() - INTERVAL 1 DAY
                        AND booking_type <> 'Cancelled'
                        ),
                        total_guest_in_house AS (
                        SELECT
                              COUNT(DISTINCT CASE WHEN DATE(check_in) <= CURRENT_DATE() 
                                                AND DATE(check_out) >= CURRENT_DATE() 
                                                THEN booking_id END) AS bookings,
                              COALESCE(SUM(CASE WHEN DATE(check_in) <= CURRENT_DATE() 
                                                AND DATE(check_out) >= CURRENT_DATE() 
                                                THEN total_guest END), 0) AS today,
                              COALESCE(SUM(CASE WHEN DATE(check_in) < CURRENT_DATE() 
                                                AND DATE(check_out) >= CURRENT_DATE() 
                                                THEN total_guest END), 0) AS prev_guests,
                              CASE
                                    WHEN COALESCE(SUM(CASE WHEN DATE(check_in) < CURRENT_DATE() 
                                                            AND DATE(check_out) >= CURRENT_DATE() 
                                                            THEN total_guest END), 0) = 0
                                    THEN 0
                                    ELSE LEAST(
                                    100,
                                    ROUND(
                                          (
                                                COALESCE(SUM(CASE WHEN DATE(check_in) <= CURRENT_DATE() 
                                                                  AND DATE(check_out) >= CURRENT_DATE() 
                                                                  THEN total_guest END), 0)
                                                -
                                                COALESCE(SUM(CASE WHEN DATE(check_in) < CURRENT_DATE() 
                                                                  AND DATE(check_out) >= CURRENT_DATE() 
                                                                  THEN total_guest END), 0)
                                          )
                                          /
                                          COALESCE(SUM(CASE WHEN DATE(check_in) < CURRENT_DATE() 
                                                            AND DATE(check_out) >= CURRENT_DATE() 
                                                            THEN total_guest END), 0)
                                          * 100
                                          , 2)
                                    )
                              END AS change_rate_percent
                        FROM bookings
                        WHERE status = 'Checked-in'
                        AND booking_type IN ('Check-in', 'Day Guest')
                        ),
                        revenue AS (
                        SELECT
                              COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() 
                                                AND payment NOT IN ('Pending') 
                                                THEN total_amount END), 0) AS current_revenue,
                              COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() - INTERVAL 1 DAY 
                                                AND payment NOT IN ('Pending') 
                                                THEN total_amount END), 0) AS yesterday_revenue,
                              CASE
                                    WHEN COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() - INTERVAL 1 DAY 
                                                      AND payment NOT IN ('Pending') 
                                                      THEN total_amount END), 0) = 0
                                    AND COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() 
                                                            AND payment NOT IN ('Pending') 
                                                            THEN total_amount END), 0) = 0
                                    THEN 0
                                    WHEN COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() - INTERVAL 1 DAY 
                                                      AND payment NOT IN ('Pending') 
                                                      THEN total_amount END), 0) = 0
                                    AND COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() 
                                                            AND payment NOT IN ('Pending') 
                                                            THEN total_amount END), 0) > 0
                                    THEN 100
                                    WHEN COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() - INTERVAL 1 DAY 
                                                      AND payment NOT IN ('Pending') 
                                                      THEN total_amount END), 0) > 0
                                    AND COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() 
                                                            AND payment NOT IN ('Pending') 
                                                            THEN total_amount END), 0) = 0
                                    THEN -100
                                    ELSE ROUND(
                                    (COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() 
                                                      AND payment NOT IN ('Pending') 
                                                      THEN total_amount END), 0)
                                    -
                                    COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() - INTERVAL 1 DAY 
                                                      AND payment NOT IN ('Pending') 
                                                      THEN total_amount END), 0)
                                    ) /
                                    COALESCE(SUM(CASE WHEN paid_date = CURRENT_DATE() - INTERVAL 1 DAY 
                                                      AND payment NOT IN ('Pending') 
                                                      THEN total_amount END), 0) * 100, 2
                                    )
                              END AS change_rate
                        FROM bookings
                        ),
                        occupancy AS (
                        SELECT
                              COALESCE(ROUND(SUM(total) / 45 * 100, 2), 0) AS occupancy,
                              COALESCE(SUM(total), 0) AS total_room
                        FROM accomodation_data a
                        JOIN bookings b
                        ON a.booking_id = b.booking_id
                        WHERE a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() 
                              AND b.status IN ('Checked-in', 'Day Guest')
                        )
                        SELECT
                        today_checkin.guests AS today_checkin_guests,
                        today_checkin.check_in AS today_checkin_bookings,
                        yesterday_checkin.check_in AS yesterday_checkin_bookings,
                        total_guest_in_house.today AS total_guest_in_house,
                        total_guest_in_house.bookings AS total_guest_bookings,
                        total_guest_in_house.change_rate_percent AS guest_change_rate,
                        revenue.current_revenue AS revenue_today,
                        revenue.change_rate AS revenue_change_percent,
                        occupancy.occupancy AS occupancy_percent,
                        45 - occupancy.total_room AS available_rooms
                        FROM today_checkin, yesterday_checkin, total_guest_in_house, revenue, occupancy;
                  ''')
                  data = cursor.fetchone()

                  return {
                        "today_checkin": {
                        "guests": data.get("today_checkin_guests"),
                        "check_in": data.get("today_checkin_bookings"),
                        "change": data.get("today_checkin_bookings") and data.get("yesterday_checkin_bookings")  # optional if needed
                        },
                        "total_guest_in_house": {
                        "today": data.get("total_guest_in_house"),
                        "bookings": data.get("total_guest_bookings"),
                        "change": data.get("guest_change_rate")
                        },
                        "revenue": {
                        "current_revenue": data.get("revenue_today"),
                        "change": data.get("revenue_change_percent")
                        },
                        "occupancy": {
                        "occupancy": data.get("occupancy_percent"),
                        "total_room": data.get("available_rooms")
                        }
                  }
      
      @cache.cached(timeout=300, key_prefix='dashboard_booking_stats')
      def dashboard_booking_stats(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # Booking type distribution
                        cursor.execute('''
                        WITH 
                        checkin AS (
                              SELECT COUNT(booking_id) AS total
                              FROM bookings
                              WHERE booking_type = 'Check-in'
                        ), 
                        day_guest AS (
                              SELECT COUNT(booking_id) AS total
                              FROM bookings
                              WHERE booking_type = 'Day Guest'
                        )
                        SELECT 
                              checkin.total AS checkin_total,
                              day_guest.total AS day_guest_total
                        FROM checkin, day_guest;
                        ''')
                        type_data = cursor.fetchone()

                        # Top 5 most booked areas
                        cursor.execute('''
                        SELECT 
                              area_name,
                              total_bookings,
                              ROUND((CAST(total_bookings AS DECIMAL(10,2)) / CAST(yearly_total AS DECIMAL(10,2))) * 100, 2) AS percentage
                        FROM (
                              SELECT 'premium' AS area_name, SUM(premium) AS total_bookings FROM accomodation_data
                              UNION ALL SELECT 'standard', SUM(standard) FROM accomodation_data
                              UNION ALL SELECT 'garden', SUM(garden) FROM accomodation_data
                              UNION ALL SELECT 'barkada', SUM(barkada) FROM accomodation_data
                              UNION ALL SELECT 'cabana', SUM(cabana) FROM accomodation_data
                              UNION ALL SELECT 'small', SUM(small) FROM accomodation_data
                              UNION ALL SELECT 'big', SUM(big) FROM accomodation_data
                              UNION ALL SELECT 'pavillion', SUM(pavillion) FROM accomodation_data
                              UNION ALL SELECT 'mariposa', SUM(mariposa) FROM accomodation_data
                              UNION ALL SELECT 'minicon', SUM(minicon) FROM accomodation_data
                        ) AS summary
                        CROSS JOIN (
                              SELECT 
                                    SUM(premium + standard + garden + barkada + cabana + small + big + pavillion + mariposa + minicon) AS yearly_total
                              FROM accomodation_data
                        ) AS total_table
                        ORDER BY total_bookings DESC
                        LIMIT 5;
                        ''')
                        top_areas = cursor.fetchall()

                        return {
                        'success': True,
                        'booking_type_distribution': type_data,
                        'top_booked_areas': top_areas
                        }

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Query failed: {e}'}

      # Bookings Overview
      def bookings_overview_cards_data(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''               
                        WITH
                        this_month AS (
                        SELECT
                              COUNT(booking_id) AS month_books,
                              COALESCE(SUM(total_guest), 0) AS month_guests
                        FROM bookings
                        WHERE date_book >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                              AND date_book <  DATE_ADD(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                              AND booking_type IN ('Check-in', 'Day Guest')
                              AND status <> 'Cancelled'
                        ),
                        this_year AS (
                        SELECT
                              COUNT(booking_id) AS year_books,
                              COALESCE(SUM(total_guest), 0) AS year_guests
                        FROM bookings
                        WHERE date_book >= DATE_FORMAT(CURRENT_DATE(), '%Y-01-01')
                              AND date_book <  DATE_ADD(DATE_FORMAT(CURRENT_DATE(), '%Y-01-01'), INTERVAL 1 YEAR)
                              AND booking_type IN ('Check-in', 'Day Guest')
                              AND status <> 'Cancelled'
                        ),
                        this_week AS (
                              SELECT
                                    COUNT(booking_id) AS week_books,
                                    COALESCE(SUM(total_guest), 0) AS week_guests
                              FROM bookings
                              WHERE date_book >= DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY)
                              AND date_book <  DATE_ADD(
                                    DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY),
                                    INTERVAL 7 DAY
                              )
                              AND booking_type IN ('Check-in', 'Day Guest')
                              AND status <> 'Cancelled'
                        ),
                        
                        today_checkin AS (
                              SELECT
                                    COUNT(booking_id) AS today_checkin_count,
                                    COALESCE(SUM(total_guest), 0) AS today_checkin_guests
                              FROM bookings
                              WHERE DATE(check_in) = CURRENT_DATE()
                              AND booking_type = 'Check-in'
                        ),
                        
                        today_checkout AS (
                        SELECT
                              SUM(CASE WHEN booking_type = 'Reservation' THEN 1 ELSE 0 END) AS reservation,
                              SUM(CASE WHEN booking_type = 'Day Guest' THEN 1 ELSE 0 END)     AS day_guest,
                              SUM(CASE WHEN booking_type = 'Check-in' THEN 1 ELSE 0 END)     AS overnight,
                              COALESCE(SUM(total_guest), 0) AS today_checkout_guests
                        FROM bookings
                        WHERE DATE(check_out) = CURRENT_DATE()
                              AND status = 'Checked-out'
                        ),
                              
                        today_day_guest AS (
                        SELECT
                              COUNT(booking_id) AS day_guest_count,
                              COALESCE(SUM(total_guest), 0) AS day_guest_guests
                        FROM bookings
                        WHERE DATE(check_in) = CURRENT_DATE()
                              AND booking_type = 'Day Guest'
                        ),
                        active_reservation AS (
                        SELECT
                              COUNT(booking_id) AS reservation_count,
                              COALESCE(SUM(total_guest), 0) AS reservation_guests
                        FROM bookings
                        WHERE DATE(check_in) >= CURRENT_DATE()
                              AND status = 'Reserved'
                        )
                        SELECT
                        this_month.month_books,
                        this_month.month_guests,

                        this_year.year_books,
                        this_year.year_guests,

                        this_week.week_books,
                        this_week.week_guests,

                        today_checkin.today_checkin_count,
                        today_checkin.today_checkin_guests,

                        today_checkout.reservation,
                        today_checkout.day_guest,
                        today_checkout.overnight,
                        today_checkout.today_checkout_guests,

                        today_day_guest.day_guest_count,
                        today_day_guest.day_guest_guests,

                        active_reservation.reservation_count,
                        active_reservation.reservation_guests
                        FROM
                        this_month,
                        this_year,
                        this_week,
                        today_checkin,
                        today_checkout,
                        today_day_guest,
                        active_reservation;

                  ''')
                  data = cursor.fetchone()

                  return {'data': data}

      def upcoming_count(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(f''' 
                              WITH upcoming_arrivals AS (
                                    SELECT COUNT(*) AS total 
                                    FROM bookings 
                                    WHERE check_in >= CURRENT_DATE() and check_in < CURRENT_DATE() + INTERVAL 2 DAY
                                    AND status IN ('Reserved')
                              ), 
                              upcoming_checkouts AS ( 
                                    SELECT COUNT(*) AS total 
                                    FROM bookings 
                                    WHERE check_out >= CURRENT_DATE()
                                    AND check_out < CURRENT_DATE() + INTERVAL 2 DAY 
                                    AND status NOT IN ('Cancelled', 'Reserved', 'Checked-out')
                              )
                              SELECT 
                                    (SELECT total FROM upcoming_checkouts) AS checkouts,
                                    (SELECT total FROM upcoming_arrivals) AS arrivals;
                        ''')
                        
                        data = cursor.fetchone()
                        return {'success': bool(data), 'data':data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def upcoming_bookings(self,  book_type, day):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # Determine the date
                        target_date = "CURRENT_DATE() + INTERVAL 1 DAY" if day == 'tomorrow' else "CURRENT_DATE()"

                        if book_type == 'checkout':
                              # Get upcoming check-outs
                              cursor.execute(f'''
                              SELECT date_book, check_in, check_out, name, booking_type, total_guest
                              FROM bookings
                              WHERE check_out = {target_date} AND status NOT IN ('Cancelled', 'Reserved', 'Checked-out');
                              ''')
                        else:
                              # Get upcoming arrivals
                              cursor.execute(f'''
                              SELECT date_book, check_in, check_out, name, booking_type, total_guest
                              FROM bookings
                              WHERE check_in = {target_date} AND status IN ('Reserved');
                              ''')

                        data = cursor.fetchall()

                        return {'success': bool(data), 'data':data}
            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Query failed: {e}'}

      def dashboard_trends(self):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  # --- Monthly bookings for the year ---
                  cursor.execute('''
                        WITH RECURSIVE all_months AS (
                              SELECT 1 AS month_num
                              UNION ALL
                              SELECT month_num + 1
                              FROM all_months
                              WHERE month_num < 12
                        ),
                        monthly_data AS (
                              SELECT 
                                    MONTH(check_in) AS month_num,
                                    COUNT(booking_id) AS booking_count
                              FROM bookings
                              WHERE check_in >= MAKEDATE(YEAR(CURDATE()),1) 
                              AND check_in <  MAKEDATE(YEAR(CURDATE())+1,1) and status <> 'Cancelled'
                              GROUP BY MONTH(check_in)
                        )
                        SELECT 
                              COALESCE(md.booking_count, 0) AS booking_count
                        FROM all_months m
                        LEFT JOIN monthly_data md ON m.month_num = md.month_num
                        ORDER BY m.month_num;
                  ''')
                  monthly_bookings = [row.get('booking_count') for row in cursor.fetchall()]

                  # --- Weekly revenue, guest, and check-in trends ---
                  cursor.execute('''
                        WITH RECURSIVE week_dates AS (
                              SELECT DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 5) % 7 DAY) AS day_date
                              UNION ALL
                              SELECT DATE_ADD(day_date, INTERVAL 1 DAY)
                              FROM week_dates
                              WHERE day_date < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 5) % 7 DAY), INTERVAL 6 DAY)
                        )
                        SELECT 
                              wd.day_date,
                              COALESCE(SUM(CASE WHEN b.status IN ('Checked-in', 'Day Guest', 'Checked-out') THEN 1 ELSE 0 END), 0) AS checkin_count,
                              COALESCE(SUM(CASE WHEN b.status IN ('Checked-in', 'Day Guest', 'Checked-out') THEN b.total_guest ELSE 0 END), 0) AS guest_count,
                              COALESCE(SUM(CASE WHEN b.status IN ('Checked-in', 'Day Guest', 'Checked-out') THEN b.total_amount ELSE 0 END), 0) AS revenue
                        FROM week_dates wd
                        LEFT JOIN bookings b
                        ON DATE(b.check_in) = wd.day_date
                        GROUP BY wd.day_date
                        ORDER BY wd.day_date;
                  ''')
                  weekly_trends = cursor.fetchall()

                  return {
                        'monthly_bookings': monthly_bookings,
                        'weekly_trends': weekly_trends
                  }

      def rebuild_dashboard_cache(self):
            cache.delete('dashboard_booking_stats')