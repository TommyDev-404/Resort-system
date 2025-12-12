from backend.forecast import Forecast
from datetime import datetime, timedelta, date, timezone


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
                        cursor.execute (''' SELECT * FROM notifications WHERE alert_type = 'occupancy' ''')
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
                        SELECT * FROM notifications WHERE alert_type = 'housekeeping'
                  ''')
            data = cursor.fetchall()

            return {'success': bool(data), 'data': data} 

      def generate_alerts(self):
            alerts = [
                  {
                        'query': '''
                              SELECT
                                    COUNT(*) as count,
                                    COALESCE(SUM(total_guest), 0) as total_guest
                              FROM bookings
                              WHERE check_out = CURRENT_DATE() AND status = 'Checked-in' AND booking_type = 'Check-in';
                        ''',
                        'type': 'bookings',
                        'classification': 'checkout-today',
                        'template': "Checkout Reminder: {count} booking(s) with a total of {total_guest} guest(s) are scheduled to leave today. Please process their checkout accordingly."
                  },
                  {
                        'query': '''
                              SELECT
                                    COUNT(*) as count,
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
                                    COUNT(*) as count,
                                    COALESCE(SUM(total_guest), 0) as total_guest
                              FROM bookings
                              WHERE check_in = CURRENT_DATE() AND status = 'Reserved' AND booking_type = 'Reservation';
                        ''',
                        'type': 'bookings',
                        'classification': 'check-in-reservation-today',
                        'template': "Reservation Reminder: {count} reservation(s) with {total_guest} guest(s) are scheduled to check in today. Please prepare accordingly."
                  },
                  {
                        'query': '''
                              SELECT
                                    COUNT(*) as count,
                                    COALESCE(SUM(total_guest), 0) as total_guest
                              FROM bookings
                              WHERE check_in = CURRENT_DATE() + INTERVAL 1 DAY AND status = 'Reserved' AND booking_type = 'Reservation';
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
                              
                              cursor.execute(''' SELECT * FROM notifications WHERE classification = %s ''', (alert['classification'],))
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
                        SELECT * FROM notifications WHERE alert_type = 'bookings'
                  ''')
            data = cursor.fetchall()

            return {'success': bool(data), 'data': data} 

      def notification_count(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''   
                        SELECT COUNT(*) as count FROM notifications WHERE name != 'temporary'
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
                              WHEN MONTH(reset_date) != MONTH(CURRENT_DATE()) OR YEAR(reset_date) != YEAR(CURRENT_DATE())
                              THEN 0
                              ELSE monthly_salary
                              END,
                              reset_date = CURRENT_DATE()
                        WHERE 
                              WEEK(reset_date, 1) != WEEK(CURRENT_DATE(), 1)
                              OR MONTH(reset_date) != MONTH(CURRENT_DATE())
                              OR YEAR(reset_date) != YEAR(CURRENT_DATE());
                  ''')

                  conn.commit()

      def auto_checkout_guest(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''   
                        SELECT * from bookings where status = 'Checked-in' and check_out = CURRENT_DATE() - INTERVAL 1 DAY;
                  ''')
                  data = cursor.fetchone()

                  if data:
                        cursor.execute('''
                              UPDATE bookings
                              SET status = 'Checked-out'
                              WHERE check_out <= CURRENT_DATE() AND MONTH(check_out) = MONTH(CURRENT_DATE()) AND YEAR(check_out) = YEAR(CURRENT_DATE())
                              AND status = 'Checked-in';
                        ''')
                        con.commit()

                        accomodation = data.get('accomodations').split(',')      

                        cursor.execute(''' SELECT * FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()
                        check_out = data.get('check_out')

                        if check_out < date.today():
                              for area in accomodation:
                                    room_name = area.split(' ')[0].lower().strip()
                                    room_no = area.split()[-1].strip()
                                    if room_name not in ['cabana', 'small', 'big', 'hall']:
                                          cursor.execute('''
                                                UPDATE accomodation_spaces a
                                                SET status = 'avl'
                                                WHERE name = %s AND room = %s;
                                          ''', (room_name, room_no))
                                          con.commit()
                        else:      
                              for area in accomodation:
                                    room_name = area.split(' ')[0].lower().strip()
                                    room_no = area.split()[-1].strip()
                                    message = f"(System check-out): Housekeeping requested for {area}"

                                    if room_name not in ['cabana', 'small', 'big', 'hall']:
                                          cursor.execute(''' INSERT INTO notifications (name, date, room_name, room_no, alert_type, classification) VALUES (%s, NOW(), %s, %s, %s, %s)
                                          ''', (message, room_name, int(room_no), 'housekeeping', 'system-checkout'))
                                          
                                          cursor.execute('''
                                                UPDATE accomodation_spaces a
                                                SET status = 'need-clean'
                                                WHERE name = %s AND room = %s;
                                          ''', (room_name, room_no))
                                          con.commit()
                                    
      def auto_cancell_7d(self):
            with self.db.connect() as con:
                  cursor = con.cursor()  # <--- important

                  cursor.execute('''   
                        SELECT * FROM bookings 
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
