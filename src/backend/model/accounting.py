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
                        cursor.execute(f"""
                              SELECT
                                    MONTHNAME(STR_TO_DATE(CONCAT(m.month, '-01'), '%m-%d')) AS month_name,
                                    COALESCE(SUM(CASE WHEN b.payment = 'Direct Payment' THEN b.total_amount ELSE 0 END), 0) AS direct,
                                    COALESCE(SUM(CASE WHEN b.payment = 'ZUZU (Online Payment)' THEN b.total_amount ELSE 0 END), 0) AS online,
                                    COALESCE(SUM(b.total_amount), 0) AS total
                              FROM (
                                    SELECT 1 AS month UNION ALL
                                    SELECT 2 UNION ALL
                                    SELECT 3 UNION ALL
                                    SELECT 4 UNION ALL
                                    SELECT 5 UNION ALL
                                    SELECT 6 UNION ALL
                                    SELECT 7 UNION ALL
                                    SELECT 8 UNION ALL
                                    SELECT 9 UNION ALL
                                    SELECT 10 UNION ALL
                                    SELECT 11 UNION ALL
                                    SELECT 12
                              ) AS m
                              LEFT JOIN bookings b
                              ON MONTH(b.check_in) = m.month
                              AND YEAR(b.check_in) = '{year}'
                              AND b.status <> 'Cancelled'
                              AND b.payment <> 'Pending'
                              GROUP BY m.month
                              ORDER BY m.month;
                        """)
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
                                    COALESCE(SUM(CASE WHEN payment = 'ZUZU (Online Payment)' THEN total_amount ELSE 0 END), 0) AS online,
                                    COALESCE(SUM(total_amount), 0) AS total_revenue
                              FROM bookings
                              WHERE DATE(paid_date) = CURRENT_DATE() AND payment NOT IN ('Pending');
                        ''')
                        data = cursor.fetchone()

                        return {'direct' : data.get('direct'), 'online': data.get('online'), 'total_revenue': data.get('total_revenue')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            