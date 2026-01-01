from backend.forecast import Forecast
from datetime import date
from backend.extensions import cache

class Analytics:
      def __init__(self, db):
            self.db = db
            self.revenue_forecast = Forecast()
      
      def get_occupancy(self, accomodation_type=None):
            cache_key = f"occupancy_data_{accomodation_type}"
            cached = cache.get(cache_key)
            if cached:
                  return cached
            
            with self.db.connect() as con:
                  cursor = con.cursor()
                  if accomodation_type:
                        if accomodation_type == 'hall':
                              query = f'''                                                  
                                    WITH current_mtd AS (
                                          SELECT 
                                                ROUND(COALESCE(SUM(a.pavillion + a.mariposa + a.minicon), 0) / ({self.accomodation_count(accomodation_type)} * DAY(CURDATE())) * 100) AS occupancy
                                          FROM accomodation_data a 
                                          JOIN bookings b 
                                          ON a.booking_id = b.booking_id
                                          WHERE a.check_in <= CURDATE() AND a.check_out >= CURRENT_DATE() AND b.status IN ('Checked-in', 'Day Guest')
                                    ),
                                    previous_mtd AS (
                                          SELECT 
                                                ROUND(COALESCE(SUM(a.pavillion + a.mariposa + a.minicon), 0) / ({self.accomodation_count(accomodation_type)} * DAY(CURDATE())) * 100) AS occupancy
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
                        else:
                              query = f'''                                                  
                                    WITH current_mtd AS (
                                          SELECT 
                                                ROUND(COALESCE(SUM(a.{accomodation_type}), 0) / ({self.accomodation_count(accomodation_type.capitalize())} * DAY(CURDATE())) * 100) AS occupancy
                                          FROM accomodation_data a 
                                          JOIN bookings b 
                                          ON a.booking_id = b.booking_id
                                          WHERE a.check_in <= CURDATE() AND a.check_out >= CURRENT_DATE() AND b.status IN ('Checked-in', 'Day Guest')
                                    ),
                                    previous_mtd AS (
                                          SELECT 
                                                ROUND(COALESCE(SUM(a.{accomodation_type}), 0) / ({self.accomodation_count(accomodation_type.capitalize())} * DAY(CURDATE())) * 100) AS occupancy
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

                  result = {'current': data.get('current_mtd_occupancy') , 'prev': data.get('previous_mtd_occupancy'), 'change': data.get('change_rate') if data.get('current_mtd_occupancy') > 0 else '0'}
                  cache.set(cache_key, result, timeout=300)

                  key_index = cache.get("occupancy_keys") or set()
                  key_index.add(cache_key)
                  cache.set("occupancy_keys", key_index, timeout=None)  # never expire
                  return result

      def daily_revenue(self, accomodation_type=None):
            cache_key = f"daily_revenue_{accomodation_type}"
            cached = cache.get(cache_key)
            if cached:
                  return cached
            
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if accomodation_type:
                        if accomodation_type == 'hall':
                              query = f'''      
                                    WITH today AS (
                                    SELECT COALESCE(SUM(pavillion + mariposa + minicon), 0) AS total
                                    FROM area_revenue AS a
                                    JOIN bookings AS b
                                          ON a.booking_id = b.booking_id
                                    WHERE DATE(b.paid_date) = CURDATE()
                                          AND b.payment NOT IN ('Pending')
                                    ),
                                    yesterday AS (
                                    SELECT COALESCE(SUM(pavillion + mariposa + minicon), 0) AS total
                                    FROM area_revenue AS a
                                    JOIN bookings AS b
                                          ON a.booking_id = b.booking_id
                                    WHERE DATE(b.paid_date) = CURDATE() - INTERVAL 1 DAY
                                          AND b.payment NOT IN ('Pending')
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
                        else:
                              query = f'''      
                                    WITH today AS (
                                    SELECT COALESCE(SUM({accomodation_type}), 0) AS total
                                    FROM area_revenue AS a
                                    JOIN bookings AS b
                                          ON a.booking_id = b.booking_id
                                    WHERE DATE(b.paid_date) = CURDATE()
                                          AND b.payment NOT IN ('Pending')
                                    ),
                                    yesterday AS (
                                    SELECT COALESCE(SUM({accomodation_type}), 0) AS total
                                    FROM area_revenue AS a
                                    JOIN bookings AS b
                                          ON a.booking_id = b.booking_id
                                    WHERE DATE(b.paid_date) = CURDATE() - INTERVAL 1 DAY
                                          AND b.payment NOT IN ('Pending')
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

                  result = {'current': data.get('revenue_today'), 'change': data.get('change_rate_percent')}
                  cache.set(cache_key, result, timeout=300)

                  key_index = cache.get("revenue_keys") or set()
                  key_index.add(cache_key)
                  cache.set("revenue_keys", key_index, timeout=None)  # never expire

                  return result

      def monthly_revenue(self, accomodation_type=None):
            cache_key = f"monthly_revenue_{accomodation_type}"
            cached = cache.get(cache_key)
            if cached:
                  return cached
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if accomodation_type:
                        if accomodation_type == 'hall':
                              query = f'''            
                              SELECT COALESCE(SUM(a.pavillion + a.mariposa + a.minicon), 0) AS revenue
                              FROM area_revenue AS a
                              JOIN bookings AS b
                              ON a.booking_id = b.booking_id
                              WHERE MONTH(b.paid_date) = MONTH(CURDATE())
                              AND b.payment NOT IN ('Pending')
                        '''
                        else:
                              query = f"""
                                    SELECT COALESCE(SUM(a.{accomodation_type}), 0) AS revenue
                                    FROM area_revenue AS a
                                    JOIN bookings AS b
                                    ON a.booking_id = b.booking_id
                                    WHERE MONTH(b.paid_date) = MONTH(CURDATE())
                                    AND b.payment NOT IN ('Pending')
                              """
                        cursor.execute(query)
                  else:
                        query = f'''
                              SELECT COALESCE(SUM(total), 0) AS revenue
                              FROM area_revenue AS a
                              JOIN bookings AS b
                              ON a.booking_id = b.booking_id
                              WHERE MONTH(b.paid_date) = MONTH(CURDATE())
                              AND b.payment NOT IN ('Pending')
                        '''
                        cursor.execute(query)

                  data = cursor.fetchone()

                  target = self.get_target_revenue()
                  target_value = int(target.get('target'))
                  revenue_value = int(data.get('revenue'))

                  change_rate = round((revenue_value / target_value) * 100, 2)

                  result =  {'monthly': data.get('revenue'), 'change': change_rate}
                  cache.set(cache_key, result, timeout=300)

                  key_index = cache.get("monthly_revenue_keys") or set()
                  key_index.add(cache_key)
                  cache.set("monthly_revenue_keys", key_index, timeout=None)  # never expire

                  return result

      def forecast_checkin(self, type=None):
            cache_key = f"forecast_checkin_{type}"
            cached = cache.get(cache_key)
            if cached:
                  return cached
            
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if type:
                        if type == 'hall':
                              query = """
                                    SELECT 
                                          check_in AS ds,
                                          SUM(pavillion + mariposa + minicon) AS y
                                    FROM accomodation_data
                                    GROUP BY check_in
                                    ORDER BY check_in;
                              """
                        else:
                              query = f"""
                                    SELECT 
                                          check_in AS ds,
                                          SUM({type}) AS y
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

                  result = self.revenue_forecast.forecast_checkin(dates, values)
                  cache.set(cache_key, result, timeout=300)

                  key_index = cache.get("forecast_checkin_keys") or set()
                  key_index.add(cache_key)
                  cache.set("forecast_checkin_keys", key_index, timeout=None)  # never expire

                  return result

      def forecasted_revenue(self, accomodation_type=None):
            cache_key = f"forecasted_revenue_{accomodation_type}"
            cached = cache.get(cache_key)
            if cached:
                  return cached
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if accomodation_type:
                        if accomodation_type == 'hall':
                              query = f"""
                                    SELECT 
                                          check_in AS ds,
                                          SUM((pavillion + mariposa + minicon) * {self.accomodation_data(accomodation_type)}) AS y
                                    FROM accomodation_data
                                    GROUP BY check_in

                                    UNION ALL

                                    SELECT 
                                          check_in AS ds,
                                          SUM(total_guest * 200) AS y
                                    FROM bookings WHERE status != 'Cancelled'
                                    GROUP BY check_in;
                              """
                        else:
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

            result = self.revenue_forecast.forecast_revenue(dates, values)
            cache.set(cache_key, result, timeout=300)

            key_index = cache.get("forecast_revenue_keys") or set()
            key_index.add(cache_key)
            cache.set("forecast_revenue_keys", key_index, timeout=None)  # never expire

            return result
      
      @cache.cached(timeout=300, key_prefix='forecast_occupancy')
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
            cache_key = f"get_target_revenue_{accomodation_type}"
            cached = cache.get(cache_key)
            if cached:
                  return cached
            
            with self.db.connect() as con:
                  cursor = con.cursor()
                  
                  if accomodation_type != None:
                        area = {
                              'premium': 100000,
                              'standard': 90000,
                              'garden': 120000,
                              'barkada': 80000,
                              'family': 95000,
                              'cabana': 75000,
                              'big': 70000,
                              'small': 50000,
                              'hall': 80000
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
                                    
                        result = {'target': data.get('target_revenue')}
                        cache.set(cache_key, result, timeout=300)

                        key_index = cache.get("target_revenue_keys") or set()
                        key_index.add(cache_key)
                        cache.set("target_revenue_keys", key_index, timeout=None)  # never expire

                        return result

      def accomodation_data(self, query):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  if query == 'hall':
                        cursor.execute("""
                        SELECT COALESCE(SUM(rate), 0) AS rate
                        FROM accomodation_spaces
                        WHERE name IN ('pavillion', 'mariposa', 'minicon')
                        """)
                  else:
                        cursor.execute("""
                        SELECT rate
                        FROM accomodation_spaces
                        WHERE name = %s
                        """, (query,))
                  data = cursor.fetchone()
                  
                  return data.get('rate')

      def accomodation_count (self, area_name):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  
                  if area_name == 'hall':
                        cursor.execute('SELECT COUNT(id) AS count from accomodation_spaces where name in ("pavillion", "mariposa", "minicon")')
                  else:
                        cursor.execute('SELECT COUNT(id) AS count from accomodation_spaces where name = %s ', (area_name,))

                  data = cursor.fetchone()

                  return data.get('count')
      
      def rebuild_analytics_cache(self):
            self.get_occupancy()
            self.daily_revenue()
            self.monthly_revenue()
            self.forecast_checkin()
            self.forecasted_revenue()
            self.forecast_occupancy()
            self.get_target_revenue()
      
      def clear_analytics_cache(self):
            cache.delete('forecast_occupancy')
            key_index = cache.get("occupancy_keys") or set()
            for key in key_index:
                  cache.delete(key)

            key_index = cache.get("revenue_keys") or set()
            for key in key_index:
                  cache.delete(key)

            key_index = cache.get("monthly_revenue_keys") or set()
            for key in key_index:
                  cache.delete(key)

            key_index = cache.get("forecast_revenue_keys") or set()
            for key in key_index:
                  cache.delete(key)

            key_index = cache.get("forecast_checkin_keys") or set()
            for key in key_index:
                  cache.delete(key)

            key_index = cache.get("target_revenue_keys") or set()
            for key in key_index:
                  cache.delete(key)
            
            
            