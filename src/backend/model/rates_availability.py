from collections import Counter
from datetime import date
from backend.extensions import cache

class RatesAndAvailability:
      def __init__(self, db):
            self.db = db
      
      @cache.cached(timeout=300, key_prefix='rates_availability')
      def availables(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT 
                                    LOWER(s.name) AS room_type,
                                    s.total_rooms,
                                    s.rate,
                                    s.orig_rate,
                                    a.today_avail,
                                    a.tomorrow_avail,
                                    p.name AS promo_name,
                                    CASE 
                                          WHEN p.area IS NOT NULL THEN 'under promotion'
                                    END AS area_condition
                              FROM (
                                    SELECT 'premium' AS room_type,
                                          4 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN premium ELSE 0 END
                                          ) AS today_avail,
                                          4 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN premium ELSE 0 END
                                          ) AS tomorrow_avail
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'standard',
                                          3 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status IN ('Checked-in')
                                                THEN standard ELSE 0 END
                                          ),
                                          3 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN standard ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'barkada',
                                          7 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN barkada ELSE 0 END
                                          ),
                                          7 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN barkada ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'garden',
                                          12 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN garden ELSE 0 END
                                          ),
                                          12 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN garden ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'cabana',
                                          8 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN cabana ELSE 0 END
                                          ),
                                          8 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN cabana ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'small',
                                          3 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN small ELSE 0 END
                                          ),
                                          3 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN small ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'big',
                                          5 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN big ELSE 0 END
                                          ),
                                          5 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN big ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'mariposa',
                                          1 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN mariposa ELSE 0 END
                                          ),
                                          1 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN mariposa ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'minicon',
                                          1 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN minicon ELSE 0 END
                                          ),
                                          1 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN minicon ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                                    UNION ALL
                                    SELECT 'pavillion',
                                          1 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE()
                                                AND a.check_out >= CURRENT_DATE()
                                                AND b.status = 'Checked-in'
                                                THEN pavillion ELSE 0 END
                                          ),
                                          1 - SUM(
                                                CASE 
                                                WHEN a.check_in <= CURRENT_DATE() + INTERVAL 1 DAY
                                                AND a.check_out >= CURRENT_DATE() + INTERVAL 1 DAY
                                                THEN pavillion ELSE 0 END
                                          )
                                    FROM accomodation_data a
                                    JOIN bookings b ON a.booking_id = b.booking_id
                              ) AS a

                              JOIN (
                              SELECT 
                                    LOWER(name) AS name,
                                    COUNT(*) AS total_rooms,
                                    MAX(rate) AS rate,
                                    MAX(orig_rate) AS orig_rate
                              FROM accomodation_spaces
                              GROUP BY name
                              ) AS s
                              ON a.room_type = s.name

                              LEFT JOIN promos p
                              ON FIND_IN_SET(s.name, p.area) > 0
                              AND p.status = 'Active' AND p.date <= CURRENT_DATE() AND p.end_date >= CURRENT_DATE()
                              ORDER BY a.room_type;
                        ''')

                        data = cursor.fetchall()
                  return {'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      @cache.cached(timeout=300, key_prefix='update_price')
      def update_price(self, price, name):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' UPDATE  accomodation_spaces SET rate = %s, orig_rate = %s WHERE name = %s ''', (price, price, name))
                        con.commit()

                        return {'success' : bool(cursor.rowcount != 0), 'message': 'Price updated successfully!' if bool(cursor.rowcount != 0) else 'Failed to update.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
