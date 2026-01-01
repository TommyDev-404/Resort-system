from backend.forecast import Forecast
from backend.extensions import cache

class Dashboard:
      def __init__(self, db, target):
            self.db = db
            self.revenue_forecast = Forecast()
            self.analytics = target
      
      @cache.cached(timeout=300, key_prefix='total_guest_house')
      def get_total_guest_house(self):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  cursor.execute('''
                        SELECT
                        -- Total bookings in-house today
                        COUNT(DISTINCT CASE WHEN DATE(check_in) <= CURRENT_DATE() 
                        AND DATE(check_out) >= CURRENT_DATE() 
                        THEN booking_id END) AS today_bookings,
                        
                        -- Total guests in-house today
                        COALESCE(SUM(CASE WHEN DATE(check_in) <= CURRENT_DATE() 
                        AND DATE(check_out) >= CURRENT_DATE() 
                        THEN total_guest END), 0) AS today_guests,

                        -- Previous in-house guests (exclude new arrivals today)
                        COALESCE(SUM(CASE WHEN DATE(check_in) < CURRENT_DATE() 
                        AND DATE(check_out) >= CURRENT_DATE() 
                        THEN total_guest END), 0) AS prev_guests,

                        -- Change rate = (current - previous) / previous * 100, capped at 100%
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
                        AND booking_type IN ('Check-in', 'Day Guest');

                  ''')
                  data = cursor.fetchone()

                  return {'today': data.get('today_guests') , 'bookings': data.get('today_bookings'), 'change': data.get('change_rate_percent')}

      @cache.cached(timeout=300, key_prefix='today_bookings')
      def today_bookings(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''                                                  
                        WITH 
                        today AS (
                              SELECT COUNT(booking_id) AS today_checkin
                              FROM bookings
                              WHERE check_in = CURRENT_DATE()
                              AND booking_type IN ('Check-in', 'Day Guest')
                        ),
                        yesterday AS (
                              SELECT COUNT(booking_id) AS yesterday_checkin
                              FROM bookings
                              WHERE check_in = (CURRENT_DATE() - INTERVAL 1 DAY)
                              AND booking_type <> 'Cancelled'
                        ), guest AS (
                              SELECT COALESCE(SUM(total_guest), 0) AS guests
                              FROM bookings
                              WHERE check_in = CURDATE() AND booking_type IN ('Check-in', 'Day Guest') 
                        )
                        SELECT 
                        today.today_checkin AS today_data,
                        guest.guests as today_guest,
                        yesterday.yesterday_checkin AS yesterday_data,
                        CASE
                              WHEN yesterday.yesterday_checkin = 0 THEN 
                                    CASE WHEN today.today_checkin > 0 THEN 100 ELSE 0 END
                              ELSE LEAST(100, ROUND((today.today_checkin - yesterday.yesterday_checkin) / yesterday.yesterday_checkin * 100, 2))
                        END AS change_rate_percent
                        FROM today, yesterday, guest;
                  ''')
                  data = cursor.fetchone()

                  return {'check_in': data.get('today_data'), 'guests': data.get('today_guest'), 'change': data.get('change_rate_percent')}

      @cache.cached(timeout=300, key_prefix='occupancy')
      def occupancy(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' 
                        SELECT
                              CURRENT_DATE() AS ds,
                              COALESCE(ROUND(SUM(total) / 54 * 100, 2), 0) AS y,
                              COALESCE(SUM(total), 0) AS total_room
                        FROM accomodation_data a
                        JOIN bookings b
                        ON a.booking_id = b.booking_id
                        WHERE a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE()  and b.status IN ('Checked-in', 'Day Guest');
                  ''')
            data = cursor.fetchone()

            return {'occupancy': data.get('y'), 'total_room': 54 - int(data.get('total_room'))}
      
      @cache.cached(timeout=300, key_prefix='revenue_today')
      def revenue_today(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' 
                        WITH 
                        today AS (
                              SELECT 
                                    COALESCE(SUM(total_amount), 0) AS today_revenue
                              FROM bookings
                              WHERE paid_date = CURRENT_DATE() 
                              AND payment NOT IN ('Pending')
                        ),
                        yesterday AS (
                              SELECT
                                    COALESCE(SUM(total_amount), 0) AS yesterday_revenue
                              FROM bookings
                              WHERE payment NOT IN ('Pending')
                              AND paid_date = CURRENT_DATE() - INTERVAL 1 DAY 
                        )
                        SELECT 
                        today.today_revenue,
                        yesterday.yesterday_revenue,
                        CASE
                              WHEN yesterday.yesterday_revenue = 0 AND today.today_revenue = 0 THEN 0        -- both zero
                              WHEN yesterday.yesterday_revenue = 0 AND today.today_revenue > 0 THEN 100      -- new revenue appears
                              WHEN yesterday.yesterday_revenue > 0 AND today.today_revenue = 0 THEN -100      -- drop to zero
                              ELSE ROUND(
                                    (today.today_revenue - yesterday.yesterday_revenue) 
                                    / yesterday.yesterday_revenue * 100, 2
                              )
                        END AS achievement_percent
                        FROM today, yesterday;
                  ''')
                  data = cursor.fetchone()

                  return {'current_revenue': data.get('today_revenue'), 'change': data.get('achievement_percent')}

      @cache.cached(timeout=300, key_prefix='heavy_guest_month')
      def heavy_guest_month(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        SELECT 
                              MONTH(check_in) AS month,
                              SUM(total_guest) AS total_guest
                        FROM bookings
                        GROUP BY MONTH(check_in)
                        ORDER BY MONTH(check_in);
                  ''')
                  data = cursor.fetchall()

                  month = []
                  value = []

                  for d in data:
                        month.append(d.get('month'))
                        value.append(int(d.get('total_guest')))

                  return {'month': month, 'value': value}
      
      @cache.cached(timeout=300, key_prefix='most_booked_area')
      def most_booked_area(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        SELECT
                              SUM(premium) AS pr, 
                              SUM(standard) AS st, 
                              SUM(barkada) AS bd, 
                              SUM(garden) AS gr, 
                              SUM(cabana) AS cb, 
                              SUM(small) AS sm, 
                              SUM(big) AS big, 
                              SUM(pavillion + mariposa + minicon) AS hall
                        FROM accomodation_data
                  ''')
                  data = cursor.fetchone()

                  return {
                        'premium': data.get('pr'),
                        'standard': data.get('st'),
                        'garden': data.get('gr'),
                        'family': data.get('fm'),
                        'barkada': data.get('bd'), 
                        'cabana': data.get('cb'),
                        'small': data.get('sm'),
                        'big': data.get('bg'),
                        'hall': data.get('hall')
                        }

      @cache.cached(timeout=300, key_prefix='top_most_booked_area')
      def top_most_booked_area(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT 
                              area_name,
                              total_bookings,
                              ROUND((CAST(total_bookings AS DECIMAL(10,2)) / CAST(yearly_total AS DECIMAL(10,2))) * 100, 2) AS percentage
                              FROM (
                              SELECT 'premium' AS area_name, SUM(premium) AS total_bookings
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'standard', SUM(standard)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'garden', SUM(garden)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'barkada', SUM(barkada)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'cabana', SUM(cabana)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'small', SUM(small)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'big', SUM(big)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'pavillion', SUM(pavillion)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'mariposa', SUM(mariposa)
                              FROM accomodation_data

                              UNION ALL
                              SELECT 'minicon', SUM(minicon)
                              FROM accomodation_data
                              ) AS summary
                              CROSS JOIN (
                              SELECT 
                                    SUM(premium + standard + garden + barkada + cabana + small + big + pavillion + mariposa + minicon) AS yearly_total
                              FROM accomodation_data
                              ) AS total_table
                              ORDER BY total_bookings DESC
                              LIMIT 5;
                        ''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data':data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      # Bookings Overview
      @cache.cached(timeout=300, key_prefix='bookings_overview_cards_data')
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

      @cache.cached(timeout=300, key_prefix='upcoming_checkouts')
      def upcoming_checkouts(self, day):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(f''' 
                              SELECT check_in, check_out, name, booking_type, total_guest FROM bookings WHERE check_out = {'CURRENT_DATE() + INTERVAL 1 DAY' if day == 'tomorrow' else 'CURRENT_DATE()'} AND status NOT IN ('Cancelled', 'Reserved', 'Checked-out');
                        ''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data':data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      @cache.cached(timeout=300, key_prefix='upcoming_arrivals')
      def upcoming_arrival(self, day):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(f''' 
                              SELECT check_out, check_in, name, booking_type, total_guest FROM bookings WHERE check_in = {'CURRENT_DATE() + INTERVAL 1 DAY' if day == 'tomorrow' else 'CURRENT_DATE()'} AND status IN ('Reserved') 
                        ''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data':data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      @cache.cached(timeout=300, key_prefix='upcoming_count')
      def upcoming_count(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(f''' 
                              WITH upcoming_arrivals AS (
                                    SELECT COUNT(*) AS total 
                                    FROM bookings 
                                    WHERE check_in >= CURRENT_DATE() 
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

      # Room Overview
      @cache.cached(timeout=300, key_prefix='occupied_room')
      def occupied_room(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' 
                        SELECT
                              COALESCE(SUM(total), 0) AS total_occupied
                        FROM accomodation_data a
                        JOIN bookings b 
                        ON a.booking_id = b.booking_id
                        WHERE a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status IN ('Checked-in');
                  ''')
            data = cursor.fetchone()

            return {'occupied': int(data.get('total_occupied'))}
      
      @cache.cached(timeout=300, key_prefix='monthly_bookings_data')
      def monthly_bookings_data(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
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
                              AND check_in <  MAKEDATE(YEAR(CURDATE())+1,1)
                              GROUP BY MONTH(check_in)
                        )
                        SELECT 
                              COALESCE(md.booking_count, 0) AS booking_count
                        FROM all_months m
                        LEFT JOIN monthly_data md ON m.month_num = md.month_num
                        ORDER BY m.month_num;
                        ''')
                  
                  data = cursor.fetchall()

                  return {'data': data}
      
      @cache.cached(timeout=300, key_prefix='booking_type_distro')
      def booking_type_distro(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
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
                        FROM 
                        checkin, day_guest;

                  ''')
            data = cursor.fetchone()

            return {'data': data}

      @cache.cached(timeout=300, key_prefix='revenue_guest_trend_data')
      def revenue_guest_trend_data(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
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

                  data = cursor.fetchall()

                  return {'data' : data}

      def dashboard_cache_rebuild(self):
            # Bookings Overview
            self.bookings_overview_cards_data()
            self.upcoming_checkouts('today')
            self.upcoming_checkouts('tomorrow')
            self.upcoming_arrival('today')
            self.upcoming_arrival('tomorrow')
            self.upcoming_count()

            # Room Overview
            self.occupied_room()

            # Dashboard Charts
            self.monthly_bookings_data()
            self.booking_type_distro()
            self.revenue_guest_trend_data()
      
      def clear_dashboard_cache(self):
            # Bookings Overview
            cache.delete('bookings_overview_cards_data')
            cache.delete('upcoming_checkouts')
            cache.delete('upcoming_arrivals')
            cache.delete('upcoming_count')

            # Room Overview
            cache.delete('occupied_room')

            # Dashboard Charts
            cache.delete('monthly_bookings_data')
            cache.delete('booking_type_distro')
            cache.delete('revenue_guest_trend_data')
