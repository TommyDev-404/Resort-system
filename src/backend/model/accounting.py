from backend.forecast import Forecast
from datetime import date

class Accounting:
      def __init__(self, db):
            self.db = db
            self.revenue_forecast = Forecast()

      def get_payment_data(self, year):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT 
                                    CONCAT(MONTHNAME(check_in), ' ', YEAR(check_in)) AS month_year,
                                    COALESCE(SUM(CASE WHEN payment = 'Direct Payment' THEN total_amount ELSE 0 END), 0) AS direct,
                                    COALESCE(SUM(CASE WHEN payment = 'ZUZU (Online Payment)' THEN total_amount ELSE 0 END), 0) AS online
                              FROM bookings
                              WHERE YEAR(check_in) = %s
                              GROUP BY YEAR(check_in), MONTH(check_in)
                              ORDER BY YEAR(check_in), MONTH(check_in);
                        ''', (year))
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data' : data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def get_current_payment_data(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT 
                                    COALESCE(SUM(CASE WHEN payment = 'Direct Payment' THEN total_amount ELSE 0 END), 0) AS direct,
                                    COALESCE(SUM(CASE WHEN payment = 'Online Payment' THEN total_amount ELSE 0 END), 0) AS online,
                                    COALESCE(SUM(total_amount), 0) AS total_revenue
                              FROM bookings
                              WHERE DATE(check_in) = CURDATE();
                        ''')
                        data = cursor.fetchone()

                        return {'direct' : data.get('direct'), 'online': data.get('online'), 'total_revenue': data.get('total_revenue')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            