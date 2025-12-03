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
                                    WHERE MONTH(a.check_in) = MONTH(CURDATE()) 
                                    AND YEAR(a.check_in) = YEAR(CURDATE()) AND b.status IN ('Checked-in', 'Day Guest')
                              ),
                              previous_mtd AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type}), 0) / ({self.accomodation_count(accomodation_type.capitalize())} * DAY(CURDATE())) * 100) AS occupancy
                                    FROM accomodation_data a
                                    JOIN bookings b 
                                    ON a.booking_id = b.booking_id
                                    WHERE MONTH(a.check_in) = MONTH(CURDATE()) - 1
                                    AND YEAR(a.check_in) = YEAR(CURDATE()) AND b.status IN ('Checked-in', 'Day Guest')
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
                                    SELECT ROUND(COALESCE(SUM(total), 0)  / (54 * DAY(CURDATE())) * 100) AS occupancy
                                    FROM accomodation_data a
                                    JOIN bookings b 
                                    ON a.booking_id = b.booking_id
                                    WHERE MONTH(a.check_in) = MONTH(CURDATE())
                                    AND YEAR(a.check_in) = YEAR(CURDATE()) AND b.status IN ('Checked-in', 'Day Guest')
      
                              ),
                              previous_mtd AS (
                                    SELECT ROUND(COALESCE(SUM(total),0) / (54 * DAY(CURDATE())) * 100) AS occupancy
                                    FROM accomodation_data a
                                    JOIN bookings b 
                                    ON a.booking_id = b.booking_id
                                    WHERE MONTH(a.check_in) = MONTH(CURDATE()) - 1
                                    AND YEAR(a.check_in) = YEAR(CURDATE()) AND b.status IN ('Checked-in', 'Day Guest')
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
                              WITH daily AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type}* {self.accomodation_data(accomodation_type.capitalize())}) / NULLIF(SUM({accomodation_type}),0), 0)) AS revenue
                                    FROM accomodation_data AS a
                                    JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                                    WHERE date(a.check_in) = CURDATE()
                                    AND b.payment <> 'Pending' AND b.status IN ('Checked-in', 'Day Guest')
                              ),
                              previous AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type} * {self.accomodation_data(accomodation_type.capitalize())}) / NULLIF(SUM({accomodation_type}),0), 0)) AS revenue
                                    FROM accomodation_data AS a
                                    JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                                    WHERE date(a.check_in) = CURDATE() - INTERVAL 1 DAY
                                    AND b.payment <> 'Pending' AND b.status IN ('Checked-in', 'Day Guest')
                              )
                              SELECT 
                              daily.revenue AS revenue_today,
                              previous.revenue AS prev_revenue,
                              CASE
                                    WHEN previous.revenue = 0 THEN 
                                          CASE 
                                                WHEN daily.revenue > 0 THEN 100
                                                ELSE 0
                                          END
                                    ELSE ROUND((daily.revenue - previous.revenue) / previous.revenue * 100)
                              END AS change_rate_percent
                              FROM daily, previous;
                        '''
                        cursor.execute(query)
                  else:
                        query = f'''                                                  
                              WITH today_rev AS (
                              SELECT 
                                    COALESCE(
                                          SUM(premium  * {self.accomodation_data('Premium')}) +
                                          SUM(standard * {self.accomodation_data('Standard')}) +
                                          SUM(garden   * {self.accomodation_data('Garden')}) +
                                          SUM(barkada  * {self.accomodation_data('Barkada')}) +
                                          SUM(family   * {self.accomodation_data('Family')}) +
                                          SUM(cabana   * {self.accomodation_data('Cabana')}) +
                                          SUM(small    * {self.accomodation_data('Small')}) +
                                          SUM(big      * {self.accomodation_data('Big')}) +
                                          SUM(hall     * {self.accomodation_data('Hall')})
                                    , 0) AS revenue_today
                              FROM accomodation_data a
                              JOIN bookings b ON a.booking_id = b.booking_id
                              WHERE DATE(a.check_in) = CURDATE()
                              AND b.payment <> 'Pending' AND b.status IN ('Checked-in', 'Day Guest')
                              ),

                              yesterday_rev AS (
                              SELECT 
                                    COALESCE(
                                          SUM(premium  * {self.accomodation_data('Premium')}) +
                                          SUM(standard * {self.accomodation_data('Standard')}) +
                                          SUM(garden   * {self.accomodation_data('Garden')}) +
                                          SUM(barkada  * {self.accomodation_data('Barkada')}) +
                                          SUM(family   * {self.accomodation_data('Family')}) +
                                          SUM(cabana   * {self.accomodation_data('Cabana')}) +
                                          SUM(small    * {self.accomodation_data('Small')}) +
                                          SUM(big      * {self.accomodation_data('Big')}) +
                                          SUM(hall     * {self.accomodation_data('Hall')})
                                    , 0) AS revenue_yesterday
                              FROM accomodation_data a
                              JOIN bookings b ON a.booking_id = b.booking_id
                              WHERE DATE(a.check_in) = CURDATE() - INTERVAL 1 DAY
                              AND b.payment <> 'Pending' AND b.status IN ('Checked-in', 'Day Guest')
                              )

                              SELECT
                              today_rev.revenue_today as revenue_today,
                              yesterday_rev.revenue_yesterday as prev_revenue,
                              CASE 
                                    WHEN yesterday_rev.revenue_yesterday = 0 THEN 
                                          CASE WHEN today_rev.revenue_today > 0 THEN 100 ELSE 0 END
                                    ELSE 
                                          ROUND(
                                          (today_rev.revenue_today - yesterday_rev.revenue_yesterday)
                                          / yesterday_rev.revenue_yesterday * 100
                                          )
                              END AS change_rate_percent
                              FROM today_rev, yesterday_rev;

                        '''
                        cursor.execute(query)
                  data = cursor.fetchone()

                  return {'current': data.get('revenue_today'), 'change': data.get('change_rate_percent')}

      def monthly_revenue(self, accomodation_type=None):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  if accomodation_type:
                        query = f'''                          
                              SELECT 
                                    ROUND(COALESCE(SUM({accomodation_type}* {self.accomodation_data(accomodation_type.capitalize())}) / NULLIF(SUM({accomodation_type}),0), 0)) AS revenue
                              FROM accomodation_data AS a
                              JOIN bookings AS b
                              ON a.booking_id = b.booking_id
                              WHERE MONTH(a.check_in) = MONTH(CURDATE())
                              AND b.payment <> 'Pending' AND b.status IN ('Checked-in', 'Day Guest')
                        '''
                        cursor.execute(query)
                  else:
                        query = f'''
                              SELECT 
                                    COALESCE(
                                          SUM(premium  * {self.accomodation_data('Premium')}) +
                                          SUM(standard * {self.accomodation_data('Standard')}) +
                                          SUM(garden   * {self.accomodation_data('Garden')}) +
                                          SUM(barkada  * {self.accomodation_data('Barkada')}) +
                                          SUM(family   * {self.accomodation_data('Family')}) +
                                          SUM(cabana   * {self.accomodation_data('Cabana')}) +
                                          SUM(small    * {self.accomodation_data('Small')}) +
                                          SUM(big      * {self.accomodation_data('Big')}) +
                                          SUM(hall     * {self.accomodation_data('Hall')})
                                    , 0) AS revenue
                              FROM accomodation_data a
                              JOIN bookings b ON a.booking_id = b.booking_id
                              WHERE MONTH(a.check_in) = MONTH(CURDATE())
                              AND YEAR(a.check_in) = YEAR(CURDATE())
                              AND b.payment <> 'Pending' AND b.status IN ('Checked-in', 'Day Guest')
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
      
      def  get_target_revenue(self):
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
                        SELECT ROUND(AVG(monthly_revenue), 2) AS target_revenue
                        FROM monthly_data
                        ),
                        current_month AS (
                        SELECT 
                              ROUND(SUM(total_amount), 2) AS current_revenue
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