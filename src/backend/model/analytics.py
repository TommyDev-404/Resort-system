from backend.forecast import Forecast
from datetime import date
from backend.extensions import cache

class Analytics:
      def __init__(self, db):
            self.db = db
            self.revenue_forecast = Forecast()
      
      def analytics_metrics(self, accomodation_type):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  # --------- Occupancy (Current & Previous MTD) ---------
                  if accomodation_type.strip() != 'all':
                        cols = "pavillion + mariposa + minicon" if accomodation_type == "hall" else accomodation_type
                        total_count = self.accomodation_count(accomodation_type if accomodation_type == "hall" else accomodation_type.capitalize())
                  else:
                        cols = "total"
                        total_count = 54  # default total rooms

                  occupancy_query = f"""
                        WITH current_mtd AS (
                              SELECT ROUND(COALESCE(SUM(a.{cols}),0) / ({total_count} * DAY(CURDATE())) * 100,2) AS occupancy
                              FROM accomodation_data a
                              JOIN bookings b ON a.booking_id = b.booking_id
                              WHERE a.check_in <= CURDATE() AND a.check_out >= CURDATE() AND b.status IN ('Checked-in','Day Guest')
                        ),
                        previous_mtd AS (
                              SELECT ROUND(COALESCE(SUM(a.{cols}),0) / ({total_count} * DAY(CURDATE())) * 100,2) AS occupancy
                              FROM accomodation_data a
                              JOIN bookings b ON a.booking_id = b.booking_id
                              WHERE a.check_in <= CURDATE() - INTERVAL 1 DAY AND a.check_out = CURDATE() - INTERVAL 1 DAY AND b.status IN ('Checked-in','Day Guest')
                        )
                        SELECT 
                              current_mtd.occupancy AS current_occupancy,
                              previous_mtd.occupancy AS previous_occupancy,
                              CASE
                              WHEN COALESCE(previous_mtd.occupancy,0)=0 THEN CASE WHEN current_mtd.occupancy>0 THEN 100 ELSE 0 END
                              ELSE ROUND((current_mtd.occupancy - previous_mtd.occupancy)/previous_mtd.occupancy*100,2)
                              END AS change_rate
                        FROM current_mtd, previous_mtd;
                  """
                  cursor.execute(occupancy_query)
                  occ_data = cursor.fetchone()

                  # --------- Daily Revenue ---------
                  daily_cols = "pavillion + mariposa + minicon" if accomodation_type == "hall" else accomodation_type if accomodation_type.strip() != 'all' else "total"
                  daily_revenue_query = f"""
                        WITH today AS (
                              SELECT COALESCE(SUM(a.{daily_cols}),0) AS total
                              FROM area_revenue a
                              JOIN bookings b ON a.booking_id = b.booking_id
                              WHERE DATE(b.paid_date) = CURDATE() AND b.payment NOT IN ('Pending')
                        ),
                        yesterday AS (
                              SELECT COALESCE(SUM(a.{daily_cols}),0) AS total
                              FROM area_revenue a
                              JOIN bookings b ON a.booking_id = b.booking_id
                              WHERE DATE(b.paid_date) = CURDATE() - INTERVAL 1 DAY AND b.payment NOT IN ('Pending')
                        )
                        SELECT 
                              today.total AS revenue_today,
                              yesterday.total AS prev_revenue,
                              CASE
                              WHEN yesterday.total=0 THEN CASE WHEN today.total>0 THEN 100 ELSE 0 END
                              ELSE ROUND((today.total - yesterday.total)/yesterday.total*100)
                              END AS change_rate
                        FROM today, yesterday;
                  """
                  cursor.execute(daily_revenue_query)
                  daily_data = cursor.fetchone()

                  # --------- Monthly Revenue ---------
                  monthly_cols = "pavillion + mariposa + minicon" if accomodation_type == "hall" else accomodation_type if accomodation_type.strip() != 'all' else "total"
                  monthly_revenue_query = f"""
                        SELECT COALESCE(SUM(a.{monthly_cols}),0) AS revenue
                        FROM area_revenue a
                        JOIN bookings b ON a.booking_id = b.booking_id
                        WHERE MONTH(b.paid_date) = MONTH(CURDATE()) AND b.payment NOT IN ('Pending');
                  """
                  cursor.execute(monthly_revenue_query)
                  monthly_data = cursor.fetchone()

                  # --------- Target Revenue ---------
                  if accomodation_type != all:
                        area_targets = {
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
                        target_value = area_targets.get(accomodation_type.lower(), 0)
                  else:
                        cursor.execute("""
                              WITH monthly_data AS (
                              SELECT YEAR(check_in) AS year, MONTH(check_in) AS month,
                                    SUM(total_amount) - SUM(total_guest*200) AS monthly_revenue
                              FROM bookings
                              WHERE status NOT IN ('Cancelled')
                              GROUP BY YEAR(check_in), MONTH(check_in)
                              )
                              SELECT ROUND(AVG(monthly_revenue),2) AS target_revenue FROM monthly_data;
                        """)
                        target_value = cursor.fetchone().get('target_revenue')

                  monthly_change_rate = round((int(monthly_data.get('revenue')) / int(target_value)) * 100, 2) if target_value else 0

                  return {
                        'occupancy': {
                        'current': occ_data.get('current_occupancy'),
                        'previous': occ_data.get('previous_occupancy'),
                        'change': occ_data.get('change_rate')
                        },
                        'daily_revenue': {
                        'current': daily_data.get('revenue_today'),
                        'change': daily_data.get('change_rate')
                        },
                        'monthly_revenue': {
                        'current': monthly_data.get('revenue'),
                        'change': monthly_change_rate
                        },
                        'target_revenue': target_value
                  }

      def forecast_checkin(self, type=None):
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
                  return result

      def forecasted_revenue(self, accomodation_type=None):
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
            return result
      
      def forecast_checkin_revenue(self, accomodation_type):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  # --- Forecast Check-ins ---
                  if accomodation_type != 'all':
                        if accomodation_type == 'hall':
                              checkin_query = """
                                    SELECT check_in AS ds,
                                          SUM(pavillion + mariposa + minicon) AS y
                                    FROM accomodation_data
                                    GROUP BY check_in
                                    ORDER BY check_in;
                              """
                        else:
                              checkin_query = f"""
                                    SELECT check_in AS ds,
                                          SUM({accomodation_type}) AS y
                                    FROM accomodation_data
                                    GROUP BY check_in
                                    ORDER BY check_in;
                              """
                  else:
                        checkin_query = """
                        SELECT check_in AS ds,
                              SUM(total) AS y
                        FROM accomodation_data
                        GROUP BY check_in
                        ORDER BY check_in;
                        """
                  cursor.execute(checkin_query)
                  checkin_data = cursor.fetchall()
                  checkin_dates = [row.get('ds') for row in checkin_data]
                  checkin_values = [row.get('y') for row in checkin_data]
                  forecast_checkin = self.revenue_forecast.forecast_checkin(checkin_dates, checkin_values)

                  # --- Forecast Revenue ---
                  if accomodation_type != 'all':
                        if accomodation_type == 'hall':
                              revenue_query = f"""
                                    SELECT check_in AS ds,
                                          SUM((pavillion + mariposa + minicon) * {self.accomodation_data(accomodation_type)}) AS y
                                    FROM accomodation_data
                                    GROUP BY check_in

                                    UNION ALL

                                    SELECT check_in AS ds,
                                          SUM(total_guest * 200) AS y
                                    FROM bookings
                                    WHERE status != 'Cancelled'
                                    GROUP BY check_in;
                              """
                        else:
                              revenue_query = f"""
                                    SELECT check_in AS ds,
                                          SUM({accomodation_type} * {self.accomodation_data(accomodation_type.capitalize())}) AS y
                                    FROM accomodation_data
                                    GROUP BY check_in

                                    UNION ALL

                                    SELECT check_in AS ds,
                                          SUM(total_guest * 200) AS y
                                    FROM bookings
                                    WHERE status != 'Cancelled'
                                    GROUP BY check_in;
                              """
                  else:
                        revenue_query = """
                        SELECT check_in AS ds,
                              SUM(total_amount) AS y
                        FROM bookings
                        WHERE status != 'Cancelled'
                        GROUP BY check_in;
                        """
                  cursor.execute(revenue_query)
                  revenue_data = cursor.fetchall()
                  revenue_dates = [row.get('ds') for row in revenue_data]
                  revenue_values = [row.get('y') for row in revenue_data]
                  forecast_revenue = self.revenue_forecast.forecast_revenue(revenue_dates, revenue_values)

                  # Return both together
                  return {
                        'forecast_checkin': forecast_checkin,
                        'forecast_revenue': forecast_revenue
                  }

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

      @cache.cached(timeout=300, key_prefix='analytics_stats')
      def analytics_stats(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # -------------------------------
                        # 1️⃣ Forecast occupancy
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
                        occupancy_data = cursor.fetchall()
                        occupancy_dates = [row.get('ds') for row in occupancy_data]
                        occupancy_values = [row.get('y') for row in occupancy_data]

                        occupancy_forecast = self.revenue_forecast.forecast_occupancy(
                        occupancy_dates, occupancy_values
                        )

                        # -------------------------------
                        # 2️⃣ Heavy guest per month
                        cursor.execute('''
                        SELECT 
                              MONTH(check_in) AS month,
                              SUM(total_guest) AS total_guest
                        FROM bookings
                        GROUP BY MONTH(check_in)
                        ORDER BY MONTH(check_in);
                        ''')
                        heavy_data = cursor.fetchall()
                        heavy_month = [d.get('month') for d in heavy_data]
                        heavy_values = [int(d.get('total_guest')) for d in heavy_data]

                        heavy_guest = {'month': heavy_month, 'value': heavy_values}

                        # -------------------------------
                        # 3️⃣ Most booked area
                        cursor.execute('''
                        SELECT
                              SUM(premium) AS pr, 
                              SUM(standard) AS st, 
                              SUM(barkada) AS bd, 
                              SUM(garden) AS gr, 
                              SUM(cabana) AS cb, 
                              SUM(small) AS sm, 
                              SUM(big) AS bg, 
                              SUM(pavillion + mariposa + minicon) AS hall
                        FROM accomodation_data
                        ''')
                        area_data = cursor.fetchone()

                        most_booked = {
                        'premium': area_data.get('pr'),
                        'standard': area_data.get('st'),
                        'garden': area_data.get('gr'),
                        'barkada': area_data.get('bd'),
                        'cabana': area_data.get('cb'),
                        'small': area_data.get('sm'),
                        'big': area_data.get('bg'),
                        'hall': area_data.get('hall')
                        }

                  # -------------------------------
                  # Prepare combined response
                  return {
                        'success': True,
                        'occupancy_forecast': occupancy_forecast,
                        'heavy_guest_month': heavy_guest,
                        'most_booked_area': most_booked
                  }


            except Exception as e:
                  return ({'success': False, 'message': f'Query failed: {e}'})

      def rebuild_analytics_cache(self):
            cache.delete('analytics_stats')