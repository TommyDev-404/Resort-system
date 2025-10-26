from collections import Counter
from datetime import date

class RatesAndAvailability:
      def __init__(self, db):
            self.db = db
      
      def availables(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT 
                                    LOWER(s.name) AS room_type,
                                    s.total_rooms,
                                    s.rate,
                                    a.today_avail,
                                    a.tomorrow_avail
                              FROM (
                              SELECT 'premium' AS room_type,
                                    4 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN premium ELSE 0 END) AS today_avail,
                                    4 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN premium ELSE 0 END) AS tomorrow_avail
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'standard',
                                    3 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN standard ELSE 0 END),
                                    3 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN standard ELSE 0 END)
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'barkada',
                                    7 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN barkada ELSE 0 END),
                                    7 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN garden ELSE 0 END)
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'family',
                                    7 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN family ELSE 0 END),
                                    7 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN family ELSE 0 END)
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'garden',
                                    7 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN garden ELSE 0 END),
                                    7 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN garden ELSE 0 END)
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'cabana',
                                    2 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN family ELSE 0 END),
                                    2 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN family ELSE 0 END)
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'small',
                                    8 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN family ELSE 0 END),
                                    8 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN family ELSE 0 END)
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'hall',
                                    1 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN family ELSE 0 END),
                                    1 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN family ELSE 0 END)
                              FROM accomodation_data
                              UNION ALL
                              SELECT 'big',
                                    8 - SUM(CASE WHEN check_in = CURRENT_DATE() THEN family ELSE 0 END),
                                    8 - SUM(CASE WHEN check_in = CURRENT_DATE() + INTERVAL 1 DAY THEN family ELSE 0 END)
                              FROM accomodation_data
                              ) AS a
                              JOIN (
                              SELECT 
                                    LOWER(name) AS name,
                                    COUNT(*) AS total_rooms,
                                    MAX(rate) AS rate
                              FROM accomodation_spaces
                              GROUP BY LOWER(name)
                              ) AS s
                              ON a.room_type = s.name
                              ORDER BY a.room_type;
                        ''')

                        data = cursor.fetchall()
                  return {'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            

      def update_price(self, price, name):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' UPDATE  accomodation_spaces SET rate = %s WHERE name = %s ''', (price, name))
                        con.commit()

                        return {'success' : bool(cursor.rowcount != 0), 'message': 'Price updated successfully!' if bool(cursor.rowcount != 0) else 'Failed to update.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
