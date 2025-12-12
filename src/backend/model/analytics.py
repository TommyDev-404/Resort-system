from backend.forecast import Forecast
from datetime import date

class Analytics:
      def __init__(self, db):
            self.db = db
            self.revenue_forecast = Forecast()
      
      #---------------- HELPERS ----------------#
      def _response(self, success, message=None, data=None, **kwargs):
            return {'success': success, 'message': message, 'data': data, **kwargs}

      def get_occupancy(self, accomodation_type=None):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  if accomodation_type:
                        query = f'''                                                  
                              WITH current_mtd AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type}), 0) / ({self.accomodation_count(accomodation_type.capitalize())} * DAY(CURDATE())) * 100) AS occupancy
                                    FROM accomodation_data a 
                                    JOIN bookings b 
                                    ON a.booking_id = b.booking_id
                                    WHERE a.check_in <= CURDATE() AND a.check_out >= CURRENT_DATE() AND b.status IN ('Checked-in', 'Day Guest')
                              ),
                              previous_mtd AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type}), 0) / ({self.accomodation_count(accomodation_type.capitalize())} * DAY(CURDATE())) * 100) AS occupancy
                                    FROM accomodation_data a
                                    JOIN bookings b 
                                    ON a.booking_id = b.booking_id
                                    WHERE a.check_in <= CURDATE() - INTERVAL 1 DAY AND a.check_out = CURRENT_DATE() - INTERVAL 1 DAY AND b.status IN ('Checked-in', 'Day Guest')
                              )
                              SELECT
                                    current_mtd.occupancy AS current_mtd_occupancy,
                                    previous_mtd.occupancy AS previous_mtd_occupancy,
                                    CASE
                                          WHEN COALESCE(previous_mtd.occupancy, 0) = 0 THEN 
                                                CASE 
                                                WHEN current_mtd.occupancy > 0 THEN 100
                                                ELSE 0
                                                END
                                          ELSE ROUND((current_mtd.occupancy - previous_mtd.occupancy) / previous_mtd.occupancy * 100, 2)
                              END AS change_rate
                              FROM current_mtd, previous_mtd
                        '''

                        cursor.execute(query)
                  else:
                        cursor.execute('''
                              WITH 
                              current_mtd AS (
                                    SELECT
                                          COALESCE(ROUND(SUM(total) / 54 * 100, 2), 0) AS occupancy
                                    FROM accomodation_data a
                                    JOIN bookings b
                                    ON a.booking_id = b.booking_id
                                    WHERE a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() and b.status IN ('Checked-in', 'Day Guest')
                              ),
                              previous_mtd AS (
                                    SELECT
                                          COALESCE(ROUND(SUM(total) / 54 * 100, 2), 0) AS occupancy
                                    FROM accomodation_data a
                                    JOIN bookings b
                                    ON a.booking_id = b.booking_id
                                    WHERE a.check_in <= CURRENT_DATE() - INTERVAL 1 DAY AND a.check_out = CURRENT_DATE() - INTERVAL 1 DAY and b.status IN ('Checked-in', 'Day Guest')
                              )
                              SELECT 
                                    current_mtd.occupancy AS current_mtd_occupancy,
                                    COALESCE(previous_mtd.occupancy, 0) AS previous_mtd_occupancy,
                                    CASE
                                          WHEN COALESCE(previous_mtd.occupancy, 0) = 0 THEN 100
                                          ELSE ROUND((current_mtd.occupancy - previous_mtd.occupancy) / previous_mtd.occupancy * 100)
                                    END AS change_rate
                              FROM current_mtd, previous_mtd;
                        ''')

                  data = cursor.fetchone()
            
                  return {'current': data.get('current_mtd_occupancy') , 'prev': data.get('previous_mtd_occupancy'), 'change': data.get('change_rate') if data.get('current_mtd_occupancy') > 0 else '0'}

      def daily_revenue(self, accomodation_type=None):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if accomodation_type:
                        query = f'''      
                              WITH today AS (
                              SELECT COALESCE(SUM({accomodation_type.lower()}), 0) AS total
                              FROM area_revenue AS a
                              JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                              WHERE DATE(b.paid_date) = CURDATE()
                                    AND b.payment <> 'Pending'
                              ),
                              yesterday AS (
                              SELECT COALESCE(SUM({accomodation_type.lower()}), 0) AS total
                              FROM area_revenue AS a
                              JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                              WHERE DATE(b.paid_date) = CURDATE() - INTERVAL 1 DAY
                                    AND b.payment <> 'Pending'
                              )
                              SELECT 
                              today.total AS revenue_today,
                              yesterday.total AS prev_revenue,
                              CASE
                                    WHEN yesterday.total = 0 THEN 
                                          CASE 
                                          WHEN today.total > 0 THEN 100
                                          WHEN yesterday.total > 0 AND today.total = 0 THEN -100
                                          WHEN yesterday.total = 0 AND today.total = 0 THEN 0
                                          ELSE 0
                                          END
                                    ELSE ROUND((today.total - yesterday.total) / yesterday.total * 100)
                              END AS change_rate_percent
                              FROM today, yesterday;
                        '''
                        cursor.execute(query)
                  else:
                        query = f'''                                                  
                              WITH today AS (
                              SELECT COALESCE(SUM(a.total), 0) AS total
                              FROM area_revenue AS a
                              JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                              WHERE DATE(b.paid_date) = CURDATE()
                                    AND b.payment <> 'Pending'
                              ),
                              yesterday AS (
                              SELECT COALESCE(SUM(a.total), 0) AS total
                              FROM area_revenue AS a
                              JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                              WHERE DATE(b.paid_date) = CURDATE() - INTERVAL 1 DAY
                                    AND b.payment <> 'Pending'
                              )
                              SELECT 
                              today.total AS revenue_today,
                              yesterday.total AS prev_revenue,
                              CASE
                                    WHEN yesterday.total = 0 THEN 
                                          CASE 
                                          WHEN today.total > 0 THEN 100
                                          WHEN yesterday.total > 0 AND today.total = 0 THEN -100
                                          WHEN yesterday.total = 0 AND today.total = 0 THEN 0
                                          ELSE 0
                                          END
                                    ELSE ROUND((today.total - yesterday.total) / yesterday.total * 100)
                              END AS change_rate_percent
                              FROM today, yesterday;
                        '''
                        cursor.execute(query)
                  data = cursor.fetchone()

                  return {'current': data.get('revenue_today'), 'change': data.get('change_rate_percent')}

      def monthly_revenue(self, accomodation_type=None):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if accomodation_type:
                        query = f'''            
                              SELECT COALESCE(SUM({accomodation_type.lower()}), 0) AS revenue
                              FROM area_revenue AS a
                              JOIN bookings AS b
                              ON a.booking_id = b.booking_id
                              WHERE MONTH(b.paid_date) = MONTH(CURDATE())
                              AND b.payment <> 'Pending'
                        '''
                        cursor.execute(query)
                  else:
                        query = f'''
                              SELECT COALESCE(SUM(total), 0) AS revenue
                              FROM area_revenue AS a
                              JOIN bookings AS b
                              ON a.booking_id = b.booking_id
                              WHERE MONTH(b.paid_date) = MONTH(CURDATE())
                              AND b.payment <> 'Pending'
                        '''
                        cursor.execute(query)

                  data = cursor.fetchone()

                  target = self.get_target_revenue()
                  target_value = int(target.get('target'))
                  revenue_value = int(data.get('revenue'))

                  change_rate = round((revenue_value / target_value) * 100, 2)

                  return {'monthly': data.get('revenue'), 'change': change_rate}

      def forecast_checkin(self, type=None):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if type:
                        query = f"""
                              SELECT 
                                    check_in AS ds,
                                    sum({type})AS y
                              FROM accomodation_data
                              GROUP BY check_in
                              ORDER BY check_in;
                        """

                        cursor.execute(query)
                  else:
                        cursor.execute('''
                              SELECT 
                                    check_in AS ds,
                                    sum(total) AS y
                              FROM accomodation_data
                              GROUP BY check_in
                              ORDER BY check_in
                        ''')

                  data = cursor.fetchall()

                  dates = [row.get('ds') for row in data]
                  values = [row.get('y') for row in data]

                  return self.revenue_forecast.forecast_checkin(dates, values)

      def forecasted_revenue(self, accomodation_type=None):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if accomodation_type:
                        query = f"""
                              SELECT 
                                    check_in AS ds,
                                    SUM({accomodation_type} * {self.accomodation_data(accomodation_type.capitalize())}) AS y
                              FROM accomodation_data
                              GROUP BY check_in

                              UNION ALL

                              SELECT 
                                    check_in AS ds,
                                    SUM(total_guest * 200) AS y
                              FROM bookings WHERE status != 'Cancelled'
                              GROUP BY check_in;
                        """

                        cursor.execute(query)
                  else:      
                        cursor.execute('''
                              SELECT check_in as ds, sum(total_amount) as y from bookings  WHERE status !='Cancelled' GROUP by check_in;
                        ''')
            data = cursor.fetchall()
      
            dates = [row.get('ds') for row in data]
            values = [row.get('y') for row in data]

            return self.revenue_forecast.forecast_revenue(dates, values)
      
      def forecast_occupancy(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        SELECT
                              a.check_in AS ds,
                              ROUND((SUM(a.total) / 54) * 100, 2) AS y
                        FROM accomodation_data a
                        JOIN bookings b 
                        ON a.booking_id = b.booking_id
                        WHERE b.status IN ('Checked-in', 'Checked-out', 'Day Guest') 
                        GROUP BY a.check_in
                        ORDER BY a.check_in;
                  ''')
            data = cursor.fetchall()

            dates = [row.get('ds') for row in data]
            values = [row.get('y') for row in data]

            return self.revenue_forecast.forecast_occupancy(dates, values)
      
      def  get_target_revenue(self, accomodation_type=None):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  
                  if accomodation_type != None:
                        area = {
                              'premium': 190000,
                              'standard': 200250,
                              'garden': 170680,
                              'barkada': 159050,
                              'family': 150000,
                              'cabana': 129890,
                              'big': 130450,
                              'small': 86000,
                              'hall': 30500
                        }

                        return {'target': area[accomodation_type.lower().strip()]}
                  else:
                        cursor.execute('''
                              WITH 
                              monthly_data AS (
                              SELECT 
                                    YEAR(check_in) AS year,
                                    MONTH(check_in) AS month,
                                    SUM(total_amount) - SUM(total_guest * 200) AS monthly_revenue
                              FROM bookings
                              WHERE status NOT IN ('Cancelled')
                              GROUP BY YEAR(check_in), MONTH(check_in)
                              ),
                              target AS (
                              SELECT ROUND(AVG(monthly_revenue), 2) AS target_revenue
                              FROM monthly_data
                              )
                              SELECT 
                              target.target_revenue
                              FROM  target;
                        ''')     

                        data = cursor.fetchone()
                        
                        return {'target': data.get('target_revenue')}
                              
      def accomodation_data(self, query):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('SELECT rate from accomodation_spaces where name = %s ', (query,))
                  data = cursor.fetchone()

                  return data.get('rate')

      def accomodation_count (self, area_name):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('SELECT COUNT(*) AS count from accomodation_spaces where name = %s ', (area_name,))
                  data = cursor.fetchone()

                  return data.get('count')