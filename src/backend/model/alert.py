from backend.forecast import Forecast
from datetime import datetime, timedelta


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

            if next_week_forecast:
                  avg_next_week = sum(item["value"] for item in next_week_forecast) / len(next_week_forecast)
                  
            if avg_next_week < 60:
                  return {'message': "Next week's forecasted occupancy is below 50%!", 'data': avg_next_week}
            else:
                  return {'message': None}

      def housekeeping_alert(self):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('''
                        SELECT 
                              COALESCE(COUNT(*), 0)AS total_need_clean
                        FROM accomodation_spaces
                        WHERE status = 'need-clean';
                  ''')
            data = cursor.fetchone()

            return {'message': f"There are {data.get('total_need_clean')} area's that require cleaning today. Please assign housekeeping staff immediately." if data.get('total_need_clean') != 0 else None}