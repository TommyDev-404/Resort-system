from backend.forecast import Forecast
from datetime import datetime, timedelta, date, timezone
from backend.extensions import cache

class Alerts:
      def __init__(self, db):
            self.db = db
            self.revenue_forecast = Forecast()
            
      def occupancy_alert(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        SELECT
                              check_in as ds,
                              ROUND(SUM(total) / (45) * 100, 2) AS y
                        FROM accomodation_data
                        GROUP BY check_in
                        ORDER BY check_in;
                  ''')
                  data = cursor.fetchall()

                  dates = [row.get('ds') for row in data]
                  values = [row.get('y') for row in data]

                  forecast = self.revenue_forecast.forecast_occupancy(dates, values)

                  forecasted = forecast.get("forecasted", {})
                  dates = forecasted.get("date", [])
                  values = forecasted.get("value", [])

                  # Define next week range
                  today = datetime.today().date()
                  next_week_start = today + timedelta(days=(7 - today.weekday()))  # next Monday
                  next_week_end = next_week_start + timedelta(days=6)              # next Sunday

                  # Filter forecasted data that falls within next week
                  next_week_forecast = [
                        {"date": d, "value": v}
                        for d, v in zip(dates, values)
                              if next_week_start <= datetime.strptime(d, "%Y-%m-%d").date() <= next_week_end
                  ]
                  avg_next_week = 0

                  if next_week_forecast:
                        avg_next_week = sum(item["value"] for item in next_week_forecast) / len(next_week_forecast)
                  
                  if avg_next_week < 60:
                        cursor.execute (''' SELECT date, name FROM notifications WHERE alert_type = 'occupancy' ''')
                        data = cursor.fetchone()

                        db_date = data.get('date')
                        now = datetime.now(timezone.utc)
                        
                        if (db_date.date() != now.date() or data.get('name') == 'temporary'):
                              cursor.execute('''
                                    UPDATE notifications SET name = %s, date =%s WHERE alert_type = 'occupancy'
                              ''', (f"Next week's forecasted occupancy is {round(avg_next_week, 2)}% (Target: 30%). Consider applying promotion!", now))
                              con.commit()
                        
                        cursor.execute (''' SELECT * FROM promos WHERE status IN ('Upcoming', 'Active') ''')
                        promo = cursor.fetchone()

                        if bool(promo) == False:
                              return {'success': bool(data), 'data': data}
                        else:
                              return {'success': False, 'message': 'Already applied promo!'}

                  else:
                        return {'message': None}

      def housekeeping_alert(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''   
                        SELECT name, date FROM notifications WHERE alert_type = 'housekeeping'
                  ''')
            data = cursor.fetchall()

            return {'success': bool(data), 'data': data} 

      def generate_alerts(self):
            alerts = [
                  {
                        'query': '''
                              SELECT
                                    COUNT(booking_id) as count,
                                    COALESCE(SUM(total_guest), 0) as total_guest
                              FROM bookings
                              WHERE check_out = CURRENT_DATE() AND status = 'Checked-in' and booking_type = 'Check-in';
                        ''',
                        'type': 'bookings',
                        'classification': 'checkout-today',
                        'template': "Room Stay - Checkout Reminder: {count} booking(s) with a total of {total_guest} guest(s) are scheduled to leave today. Please process their checkout accordingly."
                  },
                  {
                        'query': '''
                              SELECT
                                    COUNT(booking_id) as count,
                                    COALESCE(SUM(total_guest), 0) as total_guest
                              FROM bookings
                              WHERE check_out = CURRENT_DATE() AND status = 'Checked-in' AND booking_type = 'Day Guest';
                        ''',
                        'type': 'bookings',
                        'classification': 'day-guest',
                        'template': "Day Guest - Checkout Reminder: {count} day guest(s) booking(s) with {total_guest} guest(s) are scheduled to check out today. Kindly verify and process their checkout."
                  },
                  {
                        'query': '''
                              SELECT
                                    COUNT(booking_id) as count,
                                    COALESCE(SUM(total_guest), 0) as total_guest
                              FROM bookings
                              WHERE check_in = CURRENT_DATE() AND status = 'Reserved' ;
                        ''',
                        'type': 'bookings',
                        'classification': 'check-in-reservation-today',
                        'template': "Reservation Reminder: {count} reservation(s) with {total_guest} guest(s) are scheduled to check in today. Please prepare accordingly."
                  },
                  {
                        'query': '''
                              SELECT
                                    COUNT(booking_id) as count,
                                    COALESCE(SUM(total_guest), 0) as total_guest
                              FROM bookings
                              WHERE check_in = CURRENT_DATE() + INTERVAL 1 DAY AND status = 'Reserved';
                        ''',
                        'type': 'bookings',
                        'classification': 'reservation-tommorow',
                        'template': "Reservation Reminder: {count} reservation(s) with {total_guest} guest(s) are scheduled to check in tomorrow. Please prepare accordingly."
                  }
            ]

            with self.db.connect() as con:
                  cursor = con.cursor()
                  now = datetime.now(timezone.utc)

                  for alert in alerts:
                        cursor.execute(alert['query'])
                        data = cursor.fetchone()
                        count = int(data.get('count', 0))
                        total_guest = int(data.get('total_guest', 0))

                        if count > 0:
                              message = alert['template'].format(count=count, total_guest=total_guest)
                              
                              cursor.execute(''' SELECT id FROM notifications WHERE classification = %s ''', (alert['classification'],))
                              data = cursor.fetchall()

                              # first load
                              if bool(data) == False:
                                    cursor.execute(''' INSERT INTO notifications (name, date, room_name, room_no, alert_type, classification, counts, guests) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''', 
                                    (message, now, None, None, alert['type'], alert['classification'], count, total_guest))
                              else:
                                    cursor.execute('''
                                    UPDATE notifications
                                          SET 
                                          name = %s,
                                          counts = counts + %s,
                                          guests = guests + %s
                                    WHERE classification = %s  ''', 
                                    (message, count, total_guest, alert['classification']))
                        else:
                              cursor.execute(''' DELETE FROM notifications WHERE classification = %s''', (alert['classification']),)
                              
                  con.commit()

                  self.auto_cancell_7d()

      def bookings_alert(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''   
                        SELECT name, date, classification FROM notifications WHERE alert_type = 'bookings'
                  ''')
            data = cursor.fetchall()

            return {'success': bool(data), 'data': data} 

      def notification_count(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''   
                        SELECT COUNT(id) as count FROM notifications WHERE name != 'temporary'
                  ''')
                  data = cursor.fetchone()

                  cursor.execute ('''
                        SELECT 
                              upcoming_count,
                              active_count,
                              (upcoming_count + active_count) AS total_count
                        FROM (
                        SELECT
                              SUM(CASE WHEN date > CURRENT_DATE() AND status = 'Upcoming' THEN 1 ELSE 0 END) AS upcoming_count,
                              SUM(CASE WHEN date <= CURRENT_DATE() AND end_date >= CURRENT_DATE() AND status = 'Active' THEN 1 ELSE 0 END) AS active_count
                        FROM promos
                        ) AS counts;
                  ''')
                  promo = cursor.fetchone()
                  
                  if promo.get('total_count') != None:
                        if int(promo.get('total_count')) == 0:
                              return {'count': data.get('count')}
                        else:
                              return {'count': int(data.get('count')) - 1}
                  else:
                        return {'count': data.get('count')}
            
      def cron_jobs(self):
            with self.db.connect() as conn:
                  cursor = conn.cursor()
                  
                  self.auto_cancell_7d()

                  # Expire outdated promos
                  cursor.execute(""" UPDATE promos SET status = 'Expired' WHERE end_date <= CURDATE() AND status = 'Active' """)
                  
                  # Restore room rates after promo expired
                  cursor.execute(""" 
                        UPDATE accomodation_spaces AS a
                        LEFT JOIN promos AS p
                        ON a.promo = p.name
                        SET a.rate = a.orig_rate
                        WHERE p.end_date < CURDATE()
                        AND LOWER(TRIM(a.promo)) != 'None';
                  """)

                  # Apply Today Promo
                  today = date.today()

                  cursor.execute('''
                        SELECT id, name, discount, area
                        FROM promos
                        WHERE status = 'Upcoming' AND date = %s
                  ''', (today,))
                  promos = cursor.fetchall()

                  for promo in promos:
                        promo_id = promo.get('id')
                        name = promo.get('name')
                        discount = int(promo.get('discount')) / 100
                        areas = promo.get('area')\

                        for area in areas.split(','):  
                              cursor.execute('''
                                    UPDATE accomodation_spaces
                                    SET promo=%s, rate=rate*(1-%s)
                                    WHERE name=%s
                              ''', (name, discount, area.strip()))
                              conn.commit()
                        # Mark promo as active
                        cursor.execute('UPDATE promos SET status="Active" WHERE id=%s', (promo_id,))

                  #reset salary data every new week
                  cursor.execute(''' 
                        UPDATE staff_details
                        SET 
                              weekly_salary = 0,
                              monthly_salary = CASE
                                    WHEN reset_date < DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01') THEN 0
                                    ELSE monthly_salary
                              END,
                              reset_date = CURRENT_DATE()
                        WHERE reset_date < DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY);
                  ''')

                  conn.commit()

      def auto_checkout_guest(self):
            with self.db.connect() as con:
                  cursor = con.cursor()

                  # 1. Get guests whose checkout was YESTERDAY and still checked-in
                  cursor.execute('''
                        SELECT booking_id, accomodations, check_out
                        FROM bookings
                        WHERE status = 'Checked-in'
                        AND check_out = CURRENT_DATE() - INTERVAL 1 DAY;
                  ''')
                  bookings = cursor.fetchall()

                  if not bookings:
                        return  # nothing to process

                  # 2. Update booking status to Checked-out
                  booking_ids = [b['booking_id'] for b in bookings]
                  cursor.execute(f'''
                        UPDATE bookings
                        SET status = 'Checked-out'
                        WHERE booking_id IN ({','.join(['%s'] * len(booking_ids))});
                  ''', booking_ids)

                  # 3. Process each booking
                  for booking in bookings:
                        accomodations = booking['accomodations'].split(',')

                        for area in accomodations:
                              area = area.strip()
                              room_name = area.split()[0].lower()
                              room_no = area.split()[-1]

                        message = f"(System check-out): Housekeeping requested for {area}"

                        # Insert notification
                        cursor.execute('''
                              INSERT INTO notifications
                              (name, date, room_name, room_no, alert_type, classification)
                              VALUES (%s, NOW(), %s, %s, %s, %s);
                        ''', (message, room_name, int(room_no), 'housekeeping', 'system-checkout'))

                        # Set room as need-clean
                        cursor.execute('''
                              UPDATE accomodation_spaces
                              SET status = 'need-clean'
                              WHERE name = %s AND room = %s;
                        ''', (room_name, room_no))

                  con.commit()

      def auto_cancell_7d(self):
            with self.db.connect() as con:
                  cursor = con.cursor()  # <--- important

                  cursor.execute('''   
                        SELECT booking_id, accomodations FROM bookings 
                        WHERE status = 'Reserved' 
                        AND DATE(check_in) < DATE_SUB(CURDATE(), INTERVAL 7 DAY);
                  ''')
                  rows = cursor.fetchall()

                  for data in rows:
                        area = data.get('accomodations').split(',')
                        id = data.get('booking_id')

                        for a in area:
                              name = a.split()[0].strip()
                              room = a.split()[-1].strip()

                              cursor.execute('''   
                                    UPDATE accomodation_spaces
                                    SET status = 'avl'
                                    WHERE name = %s AND room = %s
                              ''', (name, room))
                              con.commit()
                        
                        cursor.execute(''' DELETE FROM area_revenue WHERE booking_id = %s ''', (id,))

                  cursor.execute('''   
                        UPDATE bookings
                        SET status = 'Cancelled', payment = CASE WHEN payment != 'Pending' THEN 'Refunded' ELSE 'None' END
                        WHERE status = 'Reserved'
                        AND DATE(check_in) < DATE_SUB(CURDATE(), INTERVAL 7 DAY);
                  ''')

                  con.commit()

      def rebuild_alert_cache(self):
            cache.delete('occupancy_alert')
            cache.delete('housekeeping_alert')
            cache.delete('bookings_alert')
