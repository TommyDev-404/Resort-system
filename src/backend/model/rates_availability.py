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
                            COALESCE(s.total_rooms, 0) AS total_rooms,
                            COALESCE(s.rate, 0) AS rate,
                            COALESCE(s.orig_rate, 0) AS orig_rate,

                            /* TODAY AVAILABLE = TOTAL - (OCCUPIED + RESERVED + NEED CLEAN) */
                            COALESCE(
                                   s.total_rooms
                                   - (COALESCE(a.occupied,0) + COALESCE(a.need_clean,0) + COALESCE(a.reserve,0)),
                                   0
                            ) AS today_avail,

                            COALESCE(a.reserve, 0) AS reserve,
                            COALESCE(a.occupied, 0) AS occupied,
                            COALESCE(a.need_clean, 0) AS need_clean,

                            COALESCE(SUM(COALESCE(a.reserve,0)) OVER (), 0) AS total_reserved,
                            COALESCE(SUM(COALESCE(a.occupied,0)) OVER (), 0) AS total_occupied,
                            COALESCE(
                                   SUM(
                                   s.total_rooms
                                   - (COALESCE(a.occupied,0) + COALESCE(a.need_clean,0) + COALESCE(a.reserve,0))
                                   ) OVER (),
                                   0
                            ) AS total_today_avail,

                            p.name AS promo_name,
                            CASE WHEN p.area IS NOT NULL THEN 'under promotion' END AS area_condition

                            FROM (
                            /* ROOM COUNTS */
                            SELECT 'premium' AS room_type,
                                   COALESCE(SUM(CASE
                                          WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status = 'Checked-in'
                                          THEN premium ELSE 0 END), 0) AS occupied,

                                   COALESCE(SUM(CASE
                                          WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status = 'Reserved'
                                          THEN premium ELSE 0 END), 0) AS reserve,

                                   COALESCE(
                                          (SELECT SUM(name = 'Premium')
                                          FROM accomodation_spaces
                                          WHERE status = 'need-clean'),
                                          0
                                   ) AS need_clean
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'standard',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN standard ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN standard ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Standard')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'barkada',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN barkada ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN barkada ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Barkada')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'garden',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN garden ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN garden ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Garden')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'cabana',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN cabana ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN cabana ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Cabana')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'small',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN small ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN small ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Small')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'big',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN big ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN big ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Big')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'pavillion',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN pavillion ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN pavillion ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Pavillion')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'mariposa',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN mariposa ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN mariposa ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Mariposa')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id

                            UNION ALL
                            SELECT 'minicon',
                                   COALESCE(SUM(CASE WHEN a.check_in <= CURRENT_DATE()
                                          AND a.check_out >= CURRENT_DATE()
                                          AND b.status='Checked-in' THEN minicon ELSE 0 END),0),
                                   COALESCE(SUM(CASE WHEN a.check_in >= CURRENT_DATE()
                                          AND b.status='Reserved' THEN minicon ELSE 0 END),0),
                                   COALESCE((SELECT SUM(name='Minicon')
                                                 FROM accomodation_spaces
                                                 WHERE status='need-clean'),0)
                            FROM accomodation_data a
                            JOIN bookings b ON a.booking_id = b.booking_id
                            ) a

                            JOIN (
                            SELECT LOWER(name) AS name,
                                   COALESCE(COUNT(*),0) AS total_rooms,
                                   COALESCE(MAX(rate),0) AS rate,
                                   COALESCE(MAX(orig_rate),0) AS orig_rate
                            FROM accomodation_spaces
                            GROUP BY name
                            ) s ON s.name = a.room_type

                            LEFT JOIN promos p
                            ON FIND_IN_SET(s.name, p.area) > 0
                            AND p.status='Active'
                            AND CURRENT_DATE() BETWEEN p.date AND p.end_date

                            ORDER BY
                            CASE
                                   WHEN a.room_type IN ('premium','standard','garden','barkada') THEN 1
                                   WHEN a.room_type IN ('small','big','cabana') THEN 2
                                   WHEN a.room_type IN ('pavillion','mariposa','minicon') THEN 3
                                   ELSE 4
                            END,
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
