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
                        cursor.execute (''' SELECT * FROM notifications WHERE room_name = 'occupancy' ''')
                        data = cursor.fetchone()

                        db_date = data.get('date')
                        now = datetime.now(timezone.utc)
                        
                        if (db_date.date() != now.date() or data.get('name') == 'temporary'):
                              cursor.execute('''
                                    UPDATE notifications SET name = %s, date =%s WHERE room_name = 'occupancy'
                              ''', (f"Next week's forecasted occupancy is {round(avg_next_week, 2)}% (Target: 30%). Consider applying promotion!", now))
                              con.commit()
                        
                        cursor.execute (''' SELECT * FROM promos WHERE status = 'Active' ''')
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
                        SELECT * FROM notifications WHERE room_name <> 'occupancy'
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

                  cursor.execute (''' SELECT * FROM promos WHERE date <= CURRENT_DATE() AND end_date >= CURRENT_DATE() ''')
                  promo = cursor.fetchone()

                  if bool(promo) == False:
                        return {'count': data.get('count')}
                  else:
                        return {'count': int(data.get('count')) - 1}