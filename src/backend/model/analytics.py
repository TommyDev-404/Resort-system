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
            count = self.accomodation_data('count')

            with self.db.connect() as con:
                  cursor = con.cursor()
                  if accomodation_type:
                        query = f'''                                                  
                              WITH current_mtd AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type}), 0) / ({count.get(accomodation_type)} * DAY(CURDATE())) * 100, 2) AS occupancy
                                    FROM accomodation_data
                                    WHERE MONTH(check_in) = MONTH(CURDATE()) 
                                          AND YEAR(check_in) = YEAR(CURDATE())
                              ),
                              previous_mtd AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type}), 0) / ({count.get(accomodation_type)} * DAY(CURDATE())) * 100, 2) AS occupancy
                                    FROM accomodation_data
                                    WHERE MONTH(check_in) = MONTH(CURDATE()) - 1
                                          AND YEAR(check_in) = YEAR(CURDATE())
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
                                    SELECT ROUND(COALESCE(SUM(total), 0)  / (45 * DAY(CURDATE())) * 100, 2) AS occupancy
                                    FROM accomodation_data
                                    WHERE MONTH(check_in) = MONTH(CURDATE())
                                    AND YEAR(check_in) = YEAR(CURDATE())
                              ),
                              previous_mtd AS (
                                    SELECT ROUND(COALESCE(SUM(total),0) / (45 * DAY(CURDATE())) * 100, 2) AS occupancy
                                    FROM accomodation_data
                                    WHERE MONTH(check_in) = MONTH(CURDATE()) - 1
                                    AND YEAR(check_in) = YEAR(CURDATE())
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

      def get_adr(self, accomodation_type=None):
            rate = self.accomodation_data('rate')

            with self.db.connect() as con:
                  cursor = con.cursor()
                  if accomodation_type:
                        query = f'''                          
                              WITH current_mtd AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type}* {rate.get(accomodation_type)}) / NULLIF(SUM({accomodation_type}),0), 0)) AS adr
                                    FROM accomodation_data AS a
                                    JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                                    WHERE MONTH(a.check_in) = MONTH(CURDATE())
                                    AND YEAR(a.check_in) = YEAR(CURDATE())
                                    AND b.payment <> 'Pending'
                              ),
                              previous_mtd AS (
                                    SELECT 
                                          ROUND(COALESCE(SUM({accomodation_type} * {rate.get(accomodation_type)}) / NULLIF(SUM({accomodation_type}),0), 0)) AS adr
                                    FROM accomodation_data AS a
                                    JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                                    WHERE MONTH(a.check_in) = MONTH(CURDATE())
                                    AND YEAR(a.check_in) = YEAR(CURDATE())
                                    AND b.payment <> 'Pending'
                              )
                              SELECT 
                              current_mtd.adr AS current_mtd_adr,
                              previous_mtd.adr AS previous_mtd_adr,
                              CASE
                                    WHEN previous_mtd.adr = 0 THEN 
                                          CASE 
                                          WHEN current_mtd.adr > 0 THEN 100
                                          ELSE 0
                                          END
                                    ELSE ROUND((current_mtd.adr - previous_mtd.adr) / previous_mtd.adr * 100)
                              END AS change_rate_percent
                              FROM current_mtd, previous_mtd;
                        '''

                        cursor.execute(query)
                  else:
                        cursor.execute('''                                                  
                              WITH current_mtd AS (
                                    SELECT 
                                    ROUND(
                                          COALESCE(
                                                (
                                                SUM(a.premium  * 10000) +
                                                SUM(a.standard * 8000) +
                                                SUM(a.garden   * 3500) +
                                                SUM(a.barkada  * 6500) +
                                                SUM(a.family   * 5000) +
                                                SUM(a.cabana   * 1000) +
                                                SUM(a.small    * 500) +
                                                SUM(a.big      * 1000) +
                                                SUM(a.hall     * 3000)
                                                ) / NULLIF(SUM(a.total), 0), 
                                          0)) AS adr_all
                                    FROM accomodation_data AS a
                                    JOIN bookings AS b 
                                    ON a.booking_id = b.booking_id
                                    WHERE 
                                    MONTH(a.check_in) = MONTH(CURDATE())
                                    AND YEAR(a.check_in) = YEAR(CURDATE())
                                    AND b.payment <> 'Pending'
                              ),
                              previous_mtd AS (
                                    SELECT 
                                          ROUND(
                                                COALESCE(
                                                (SUM(premium  * 10000) +
                                                SUM(standard * 8000) +
                                                SUM(garden   * 3500) +
                                                SUM(barkada  * 6500) +
                                                SUM(family   * 5000) +
                                                SUM(cabana   * 1000) +
                                                SUM(small    * 500) +
                                                SUM(big      * 1000) +
                                                SUM(hall     * 3000)
                                                ) / NULLIF(SUM(total),0), 0
                                          )) AS adr_all
                                    FROM accomodation_data AS a
                                    JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                                    WHERE MONTH(a.check_in) = MONTH(CURDATE()) - 1
                                    AND YEAR(a.check_in) = YEAR(CURDATE()) 
                                    AND b.payment <> 'Pending'
                              )
                              SELECT
                              current_mtd.adr_all AS current_mtd_adr,
                              previous_mtd.adr_all AS previous_mtd_adr,
                              CASE
                                    WHEN previous_mtd.adr_all = 0 THEN
                                          CASE
                                          WHEN current_mtd.adr_all > 0 THEN 100
                                          ELSE 0
                                          END
                                    ELSE ROUND((current_mtd.adr_all - previous_mtd.adr_all) / previous_mtd.adr_all * 100)
                              END AS change_rate_percent
                              FROM current_mtd, previous_mtd;
                        ''')
                  data = cursor.fetchone()

                  return {'current': data.get('current_mtd_adr'), 'prev': data.get('previous_mtd_adr'), 'change': data.get('change_rate_percent')}

      def get_revpar(self, accomodation_type=None):

            if accomodation_type:
                  adr_current = int(self.get_adr(accomodation_type).get('current'))
                  occupancy_current = int(self.get_occupancy(accomodation_type).get('current')) / 100

                  adr_prev = int(self.get_adr(accomodation_type).get('prev'))
                  occupancy_prev = int(self.get_occupancy(accomodation_type).get('prev')) / 100
                  
                  revpar_current = adr_current * occupancy_current
                  revpar_prev = adr_prev * occupancy_prev
                  
                  change = ((revpar_current - revpar_prev) / revpar_prev) * 100 if revpar_prev != 0 else 100
            else:
                  adr_current = int(self.get_adr().get('current'))
                  occupancy_current = int(self.get_occupancy().get('current')) / 100

                  adr_prev = int(self.get_adr().get('prev'))
                  occupancy_prev = int(self.get_occupancy().get('prev')) / 100

                  revpar_current = adr_current * occupancy_current
                  revpar_prev = adr_prev * occupancy_prev

                  change = ((revpar_current - revpar_prev) / revpar_prev) * 100 if revpar_prev != 0 else 100

            return {'revpar': round(revpar_current, 2), 'change': round(change, 2) if revpar_current != 0 else 0}

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
                                    total AS y
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
                        rate = self.accomodation_data('rate')

                        query = f"""
                              SELECT 
                                    check_in AS ds,
                                    SUM({accomodation_type} * {rate.get(accomodation_type)}) AS y
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
            rate_map = {
                  "premium": 10000, "standard": 8000, "garden": 3500,
                  "barkada": 6500, "family": 5000, "cabana": 1000,
                  "small": 500, "big": 1000, "hall": 3000
            }

            place_count =  {
                  "premium": 4, "standard": 3, "garden": 12,
                  "barkada": 7, "family": 4, "cabana": 4,
                  "small": 8, "big": 8, "hall": 1
            }

            return rate_map if query == 'rate' else place_count

