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
                              AND check_out > CURRENT_DATE() And status = 'Checked-in'
                        ),
                        last_week_sunday AS (
                              SELECT DATE_SUB(CURRENT_DATE(), INTERVAL (WEEKDAY(CURRENT_DATE()) + 1) DAY) AS sunday_date
                        ),
                        last_week_total AS (
                              SELECT COALESCE(SUM(total_guest), 0) AS total_guest_in_house
                              FROM bookings 
                              WHERE check_in <= (SELECT sunday_date FROM last_week_sunday)
                              AND check_out > (SELECT sunday_date FROM last_week_sunday) And status = 'Checked-out'
                        )
                        SELECT 
                              (SELECT total_guest_in_house FROM today_total) AS latest_total_guest,
                              (SELECT total_guest_in_house FROM last_week_total) AS total_guest_in_house_last_week,
                              CASE 
                              WHEN (SELECT total_guest_in_house FROM today_total) = 0 
                                    AND (SELECT total_guest_in_house FROM last_week_total) = 0 THEN 0
                              WHEN (SELECT total_guest_in_house FROM last_week_total) = 0 THEN 100
                              ELSE ROUND(
                                    (
                                          ((SELECT total_guest_in_house FROM today_total) -
                                          (SELECT total_guest_in_house FROM last_week_total)) /
                                          (SELECT total_guest_in_house FROM last_week_total)
                                    ) * 100, 2)
                        END AS change_rate_percent
                  ''')
                  data = cursor.fetchone()

                  return {'today': data.get('latest_total_guest') , 'change': data.get('change_rate_percent')}
            
      def today_guest(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        WITH 
                        today AS (
                        SELECT COALESCE(SUM(total_guest), 0) AS guests
                        FROM bookings
                        WHERE DATE(check_in) = CURDATE()
                        ),
                        yesterday AS (
                        SELECT COALESCE(SUM(total_guest), 0) AS guests
                        FROM bookings
                        WHERE DATE(check_in) = CURDATE() - INTERVAL 1 DAY
                        )
                        SELECT 
                        today.guests AS today_guest,
                        CASE 
                              WHEN yesterday.guests = 0 THEN 100
                              ELSE ROUND(((today.guests - yesterday.guests) / yesterday.guests) * 100, 2)
                        END AS change_rate
                        FROM today, yesterday;      
                  ''')                                            
                  data = cursor.fetchone()

                  return {'today_guest': data.get('today_guest'), 'change': data.get('change_rate')}

      def todays_checkin(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''                                                  
                        WITH 
                              today AS (
                                    SELECT COUNT(*) AS today_checkin
                                    FROM bookings
                                    WHERE DATE(check_in) = CURRENT_DATE()
                                    AND status = 'Checked-in'
                              ),
                              yesterday AS (
                                    SELECT COUNT(*) AS yesterday_checkin
                                    FROM bookings
                                    WHERE DATE(check_in) = (CURRENT_DATE() - INTERVAL 1 DAY)
                                    AND status NOT IN ('Cancelled')
                              )
                        SELECT 
                              today.today_checkin as today_data,
                              yesterday.yesterday_checkin as yesterday_data,
                        CASE
                              WHEN yesterday.yesterday_checkin = 0 THEN 
                                    CASE WHEN today.today_checkin > 0 THEN 100 ELSE 0 END
                              ELSE ROUND(
                                    (today.today_checkin - yesterday.yesterday_checkin) / yesterday.yesterday_checkin * 100, 
                                    2
                              )
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
                        FROM accomodation_data
                        WHERE check_in = CURRENT_DATE();
                  ''')
            data = cursor.fetchone()

            return {'occupancy': data.get('y'), 'total_room': 54 - int(data.get('total_room'))}
      
      def revenue_today(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' 
                        WITH 
                        monthly_data AS (
                        SELECT 
                              YEAR(check_in) AS year,
                              MONTH(check_in) AS month,
                              SUM(total_amount) AS monthly_revenue
                        FROM bookings
                        WHERE status NOT IN ('Cancelled')
                        GROUP BY YEAR(check_in), MONTH(check_in)
                        ),
                        target AS (
                        SELECT ROUND(COALESCE(AVG(monthly_revenue), 0), 2) AS target_revenue
                        FROM monthly_data
                        ),
                        current_month AS (
                        SELECT ROUND(COALESCE(SUM(total_amount), 0), 2) AS current_revenue
                        FROM bookings
                        WHERE status NOT IN ('Cancelled')
                              AND YEAR(check_in) = YEAR(CURDATE())
                              AND MONTH(check_in) = MONTH(CURDATE())
                        )
                        SELECT 
                        current_month.current_revenue,
                        target.target_revenue,
                        CASE 
                              WHEN target.target_revenue = 0 THEN 0
                              ELSE ROUND((current_month.current_revenue / target.target_revenue) * 100, 2)
                        END AS achievement_percent
                        FROM current_month, target;

                  ''')
                  data = cursor.fetchone()

                  return {'current_revenue': data.get('current_revenue'), 'change': data.get('achievement_percent')}

      def forecast_occupancy(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        SELECT
                              check_in as ds,
                              ROUND((SUM(total) / 54) * 100, 2) AS y
                        FROM accomodation_data
                        GROUP BY check_in
                        ORDER BY check_in;
                  ''')
            data = cursor.fetchall()

            dates = [row.get('ds') for row in data]
            values = [row.get('y') for row in data]

            return self.revenue_forecast.forecast_occupancy(dates, values)
      
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


