from backend.forecast import Forecast
from datetime import date, datetime
from backend.extensions import cache

class Accounting:
      def __init__(self, db):
            self.db = db
            self.revenue_forecast = Forecast()

      @cache.cached(timeout=300, key_prefix='payment_data_{year}')
      def get_payment_data(self, year):
            cache_key = f"payment_data_{year}"
            cached = cache.get(cache_key)
            if cached:
                  return cached

            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(f"""
                              SELECT
                                    ELT(
                                          m.month,
                                          'January','February','March','April','May','June',
                                          'July','August','September','October','November','December'
                                    ) AS month_name,
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

                        result = {'success': bool(data), 'data': data}
                        cache.set(cache_key, result, timeout=300)

                        key_index = cache.get("payment_data_keys") or set()
                        key_index.add(cache_key)
                        cache.set("payment_data_keys", key_index, timeout=None)  # never expire

                        return result
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      @cache.cached(timeout=300, key_prefix='current_payment_data')
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
            
      def rebuild_accounting_cache(self):
            self.get_payment_data(datetime.now().year)
            self.get_current_payment_data()

      def clear_accounting_cache(self):
            cache.delete('current_payment_data')
            
            key_index = cache.get('current_payment_data') or set()
            for k in key_index:
                  cache.delete(k)