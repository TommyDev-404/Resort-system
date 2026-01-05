from collections import Counter
from datetime import date
from backend.extensions import cache

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
    s.orig_rate,

    /* TODAY AVAILABLE = TOTAL - (OCCUPIED + RESERVED) */
    (s.total_rooms - (a.occupied + a.need_clean + a.reserve)) AS today_avail,

    a.reserve,
    a.occupied,
    a.need_clean,

    SUM(a.reserve) OVER () AS total_reserved,
    SUM(a.occupied) OVER () AS total_occupied,
    SUM(s.total_rooms - (a.occupied + a.need_clean + a.reserve)) OVER () AS total_today_avail,

    p.name AS promo_name,
    CASE WHEN p.area IS NOT NULL THEN 'under promotion' END AS area_condition

FROM (
    /* ROOM COUNTS */
    SELECT 'premium' AS room_type,
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN premium ELSE 0 END) AS occupied,
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN premium ELSE 0 END) AS reserve,
           (SELECT SUM(name = 'Premium') FROM accomodation_spaces WHERE status = 'need-clean') AS need_clean
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'standard',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN standard ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN standard ELSE 0 END),
           (SELECT SUM(name = 'Standard') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'barkada',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN barkada ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN barkada ELSE 0 END),
           (SELECT SUM(name = 'Barkada') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'garden',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN garden ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN garden ELSE 0 END),
           (SELECT SUM(name = 'Garden') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'cabana',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN cabana ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN cabana ELSE 0 END),
           (SELECT SUM(name = 'Cabana') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'small',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN small ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN small ELSE 0 END),
           (SELECT SUM(name = 'Small') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'big',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN big ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN big ELSE 0 END),
           (SELECT SUM(name = 'Big') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'pavillion',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN pavillion ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN pavillion ELSE 0 END),
           (SELECT SUM(name = 'Pavillion') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'mariposa',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN mariposa ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN mariposa ELSE 0 END),
           (SELECT SUM(name = 'Mariposa') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id

    UNION ALL
    SELECT 'minicon',
           SUM(CASE WHEN a.check_in <= CURRENT_DATE() AND a.check_out >= CURRENT_DATE() AND b.status='Checked-in' THEN minicon ELSE 0 END),
           SUM(CASE WHEN a.check_in >= CURRENT_DATE() AND b.status='Reserved' THEN minicon ELSE 0 END),
           (SELECT SUM(name = 'Minicon') FROM accomodation_spaces WHERE status = 'need-clean')
    FROM accomodation_data a
    JOIN bookings b ON a.booking_id = b.booking_id
) a
JOIN (
    SELECT LOWER(name) AS name,
           COUNT(*) AS total_rooms,
           MAX(rate) AS rate,
           MAX(orig_rate) AS orig_rate
    FROM accomodation_spaces
    GROUP BY name
) s ON s.name = a.room_type
LEFT JOIN promos p ON FIND_IN_SET(s.name, p.area) > 0
                  AND p.status='Active'
                  AND CURRENT_DATE() BETWEEN p.date AND p.end_date
ORDER BY
    CASE WHEN a.room_type IN ('premium','standard','garden','barkada') THEN 1
         WHEN a.room_type IN ('small','big','cabana') THEN 2
         WHEN a.room_type IN ('pavillion','mariposa','minicon') THEN 3
         ELSE 4 END,
    a.room_type;


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
                        cursor.execute(''' UPDATE  accomodation_spaces SET rate = %s, orig_rate = %s WHERE name = %s ''', (price, price, name))
                        con.commit()

                        return {'success' : bool(cursor.rowcount != 0), 'message': 'Price updated successfully!' if bool(cursor.rowcount != 0) else 'Failed to update.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
            cache.delete('rates_availability')