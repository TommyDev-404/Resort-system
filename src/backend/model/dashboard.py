from backend.forecast import Forecast

class Dashboard:
      def __init__(self, db, target):
            self.db = db
            self.revenue_forecast = Forecast()
            self.analytics = target
      
      #---------------- HELPERS ----------------#
      def _response(self, success, message=None, data=None, **kwargs):
            return {'success': success, 'message': message, 'data': data, **kwargs}
      
      def get_total_guest_house(self):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  cursor.execute('''
                        WITH 
                        today_total AS (
                              SELECT COALESCE(SUM(total_guest), 0) AS total_guest_in_house
                              FROM bookings 
                              WHERE check_in <= CURRENT_DATE()
                              AND check_out >= CURRENT_DATE()
                              AND status = 'Checked-in' AND booking_type = 'Check-in'
                        ),
                        yesterday_total AS (
                              SELECT COALESCE(SUM(total_guest), 0) AS total_guest_in_house
                              FROM bookings 
                              WHERE check_in = CURRENT_DATE() - INTERVAL 1 DAY
                              AND check_out >= CURRENT_DATE() - INTERVAL 1 DAY
                              AND status = 'Checked-in' AND booking_type = 'Check-in'
                        )
                        SELECT 
                        (SELECT total_guest_in_house FROM today_total) AS latest_total_guest,
                        (SELECT total_guest_in_house FROM yesterday_total) AS total_guest_in_house_yesterday,
                        CASE 
                              WHEN (SELECT total_guest_in_house FROM today_total) = 0 
                                    AND (SELECT total_guest_in_house FROM yesterday_total) = 0 
                                    THEN 0
                              WHEN (SELECT total_guest_in_house FROM yesterday_total) = 0 
                                    THEN 100
                              ELSE LEAST(
                                          100, 
                                          ROUND(
                                          (
                                                (SELECT total_guest_in_house FROM today_total) -
                                                (SELECT total_guest_in_house FROM yesterday_total)
                                          ) / (SELECT total_guest_in_house FROM yesterday_total) * 100
                                          , 2)
                                    )
                        END AS change_rate_percent;
                  ''')
                  data = cursor.fetchone()
                  print(data)
                  return {'today': data.get('latest_total_guest') , 'change': data.get('change_rate_percent')}

      def today_guest(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        WITH 
                        today AS (
                              SELECT COALESCE(SUM(total_guest), 0) AS guests
                              FROM bookings
                              WHERE DATE(check_in) = CURDATE() AND status IN ('Checked-in', 'Day Guest')
                        ),
                        yesterday AS (
                              SELECT COALESCE(SUM(total_guest), 0) AS guests
                              FROM bookings
                              WHERE DATE(check_in) = CURDATE() - INTERVAL 1 DAY AND status IN ('Checked-in', 'Day Guest', 'Checked-out')
                        )
                        SELECT 
                              today.guests AS today_guest,
                              yesterday.guests AS y_guest,
                              CASE 
                                    WHEN yesterday.guests = 0 AND today.guests = 0 THEN 0
                                    WHEN yesterday.guests = 0 AND today.guests > 0 THEN 100
                                    ELSE LEAST(100, ROUND(((today.guests - yesterday.guests) / yesterday.guests) * 100, 2))
                              END AS change_rate
                        FROM today, yesterday;
                  ''')                                            
                  data = cursor.fetchone()

                  return {'today_guest': data.get('today_guest'), 'change': data.get('change_rate')}

      def today_bookings(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''                                                  
                        WITH 
                              today AS (
                                    SELECT COUNT(*) AS today_checkin
                                    FROM bookings
                                    WHERE DATE(check_in) = CURRENT_DATE()
                                    AND status IN ('Checked-in', 'Day Guest')
                              ),
                              yesterday AS (
                                    SELECT COUNT(*) AS yesterday_checkin
                                    FROM bookings
                                    WHERE DATE(check_in) = (CURRENT_DATE() - INTERVAL 1 DAY)
                                    AND status NOT IN ('Cancelled', 'Reserved')
                              )
                        SELECT 
                              today.today_checkin as today_data,
                              yesterday.yesterday_checkin as yesterday_data,
                        CASE
                              WHEN yesterday.yesterday_checkin = 0 THEN 
                                    CASE WHEN today.today_checkin > 0 THEN 100 ELSE 0 END
                              ELSE LEAST(100, ROUND((today.today_checkin - yesterday.yesterday_checkin) / yesterday.yesterday_checkin * 100, 2))
                        END AS change_rate_percent
                        FROM today, yesterday;
                  ''')
                  data = cursor.fetchone()

                  return {'check_in': data.get('today_data'), 'change': data.get('change_rate_percent')}

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
      
      def revenue_today(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' 
                        WITH 
                        today AS (
                              SELECT 
                                    COALESCE(SUM(total_amount), 0) AS today_revenue
                              FROM bookings
                              WHERE check_in = CURDATE()
                              AND booking_type IN ('Check-in', 'Day Guest')
                              AND payment != 'Pending'
                        ),
                        yesterday AS (
                              SELECT
                                    COALESCE(SUM(total_amount), 0) AS yesterday_revenue
                              FROM bookings
                              WHERE status NOT IN ('Cancelled', 'Reserved')
                              AND payment != 'Pending'
                              AND check_in = CURDATE() - INTERVAL 1 DAY 
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
            
      def most_booked_area(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        SELECT
                              SUM(premium) AS pr, 
                              SUM(standard) AS st, 
                              SUM(family) AS fm, 
                              SUM(barkada) AS bd, 
                              SUM(garden) AS gr, 
                              SUM(cabana) AS cb, 
                              SUM(small) AS sm, 
                              SUM(big) AS big, 
                              SUM(hall) AS hall
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

      def top_most_booked_area(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT 
                                    area_name,
                                    total_bookings,
                                    ROUND((total_bookings / yearly_total) * 100, 2) AS percentage
                              FROM (
                                    SELECT 'premium' AS area_name, SUM(premium) AS total_bookings FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'standard', SUM(standard) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'garden', SUM(garden) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'barkada', SUM(barkada) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'family', SUM(family) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'cabana', SUM(cabana) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'small', SUM(small) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'big', SUM(big) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                                    UNION ALL
                                    SELECT 'hall', SUM(hall) FROM accomodation_data WHERE YEAR(check_in) = YEAR(CURDATE())
                              ) AS summary
                              CROSS JOIN (
                                    SELECT SUM(premium + standard + garden + barkada + family + cabana + small + big + hall) AS yearly_total
                                    FROM accomodation_data
                                    WHERE YEAR(check_in) = YEAR(CURDATE())
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
      def bookings_overview_cards_data(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''               
                        WITH today_checkin AS (
                              SELECT 
                                    COUNT(*) AS today_checkin_count,
                                    COALESCE(SUM(total_guest), 0) AS today_checkin_guests
                              FROM bookings
                              WHERE DATE(check_in) = CURRENT_DATE()
                              AND booking_type = 'Check-in' AND status = 'Checked-in'
                        ),

                        today_checkout AS (
                              SELECT 
                                    COUNT(*) AS today_checkout_count,
                                    COALESCE(SUM(total_guest), 0) AS today_checkout_guests
                              FROM bookings
                              WHERE DATE(check_out) = CURRENT_DATE()
                              AND status = 'Checked-out'
                        ),

                        day_guest AS (
                              SELECT 
                                    COUNT(*) AS day_guest_count,
                                    COALESCE(SUM(total_guest), 0) AS day_guest_guests
                              FROM bookings
                              WHERE DATE(check_in) = CURRENT_DATE()
                              AND booking_type = 'Day Guest' AND status = 'Checked-in'
                        ),

                        reservation AS (
                              SELECT 
                                    COUNT(*) AS reservation_count,
                                    COALESCE(SUM(total_guest), 0) AS reservation_guests
                              FROM bookings
                              WHERE DATE(check_in) >= CURRENT_DATE() 
                              AND booking_type = 'Reservation' AND status = 'Reserved'
                        )

                        SELECT 
                              today_checkin.today_checkin_count,
                              today_checkin.today_checkin_guests,
                              
                              today_checkout.today_checkout_count,
                              today_checkout.today_checkout_guests,
                              
                              day_guest.day_guest_count,
                              day_guest.day_guest_guests,
                              
                              reservation.reservation_count,
                              reservation.reservation_guests
                        FROM 
                        today_checkin,
                        today_checkout,
                        day_guest,
                        reservation;
                  ''')
                  data = cursor.fetchone()

                  return {'data': data}

      def upcoming_checkouts(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT * FROM bookings WHERE check_out = CURRENT_DATE() + INTERVAL 1 DAY AND status NOT IN ('Cancelled', 'Reserved');
                        ''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data':data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def upcoming_arrival(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT * FROM bookings WHERE check_in >= CURRENT_DATE() AND status = 'Reserved' 
                        ''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data':data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      # Room Overview
      def occupied_room(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' 
                        SELECT
                              COALESCE(SUM(total), 0) AS total_occupied
                        FROM accomodation_data a
                        JOIN bookings b 
                        ON a.booking_id = b.booking_id
                        WHERE a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status = 'Checked-in';
                  ''')
            data = cursor.fetchone()

            return {'occupied': int(data.get('total_occupied'))}
      
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
                                    COUNT(*) AS booking_count
                              FROM bookings
                              WHERE YEAR(check_in) = YEAR(CURRENT_DATE())
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
      
      def booking_type_distro(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' 
                        with 
                        checkin as (
                              SELECT COUNT(*) as total from bookings where year(check_in) = year(CURRENT_DATE()) AND status = 'Checked-out'
                        ), day_guest as (
                              SELECT COUNT(*) as total from bookings where year(check_in) = year(CURRENT_DATE()) AND status = 'Day Guest'
                        ), cancelled as (
                              SELECT COUNT(*) as total from bookings where year(check_in) = year(CURRENT_DATE()) AND status = 'Cancelled'
                        ) 
                        SELECT 
                              checkin.total as checkin_total,
                              day_guest.total as day_guest_total,
                              cancelled.total as cancelled_total
                        FROM 
                        checkin, day_guest, cancelled
                  ''')
            data = cursor.fetchone()

            return {'data': data}

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


      