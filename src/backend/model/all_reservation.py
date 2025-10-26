from collections import Counter
from datetime import date

class Reservation:
      def __init__(self, db):
            self.db = db
      
      def get_avl_spaces(self, accomodation_type=None):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              WITH 
                                    pr AS (
                                    SELECT COUNT(name) AS pr FROM accomodation_spaces WHERE name = 'Premium' AND status = 'avl'
                                    ),
                                    st AS (
                                    SELECT COUNT(name) AS st FROM accomodation_spaces WHERE name = 'Standard' AND status = 'avl'
                                    ),
                                    gr AS (
                                    SELECT COUNT(name) AS gr FROM accomodation_spaces WHERE name = 'Garden' AND status = 'avl'
                                    ),
                                    fm AS (
                                    SELECT COUNT(name) AS fm FROM accomodation_spaces WHERE name = 'Family' AND status = 'avl'
                                    ),
                                    bd AS (
                                    SELECT COUNT(name) AS bd FROM accomodation_spaces WHERE name = 'Barkada' AND status = 'avl'
                                    ),
                                    cb AS (
                                    SELECT COUNT(name) AS cb FROM accomodation_spaces WHERE name = 'Cabana' AND status = 'avl'
                                    ),
                                    sm AS (
                                    SELECT COUNT(name) AS sm FROM accomodation_spaces WHERE name = 'Small' AND status = 'avl'
                                    ),
                                    bg AS (
                                    SELECT COUNT(name) AS bg FROM accomodation_spaces WHERE name = 'Big' AND status = 'avl'
                                    ),
                                    hall AS (
                                    SELECT COUNT(name) AS hall FROM accomodation_spaces WHERE name = 'Hall' AND status = 'avl'
                                    )
                              SELECT 
                                    pr.pr, 
                                    st.st, 
                                    gr.gr, 
                                    fm.fm, 
                                    bd.bd, 
                                    cb.cb, 
                                    sm.sm, 
                                    bg.bg, 
                                    hall.hall
                              FROM pr, st, gr, fm, bd, cb, sm, bg, hall
                        ''')

                  data = cursor.fetchone()
                  return {'premium': data.get('pr'), 'standard': data.get('st'), 'garden': data.get('gr'), 'family': data.get('fm'), 
                              'barkada': data.get('bd'), 'cabana': data.get('cb'), 'small': data.get('sm'), 'big': data.get('bg'), 'hall': data.get('hall')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def get_avl_room(self, room_name):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT room as avl_room from accomodation_spaces where status = "avl" AND name = %s ''', (room_name, ))
                        data = cursor.fetchall()

                        list = []
                        for d in data:
                              print(d)
                              list.append(d.get('avl_room'))

                        return {'rooms' : list}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def add_booking(self, name, total_guest, inquiry_type, payment, accomodations, checkin, checkout):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                  
                        parts = accomodations.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]
                        counts = Counter(rooms)

                        result_list = []

                        status = None
                        if inquiry_type == 'Reservation': status = 'Reserved'
                        if inquiry_type == 'Walk-in': status = 'Checked-in'
                        if inquiry_type == 'Day Guest': status = 'Day Guest'
                        
                        room_rate = {
                              'premium' : 1000, 
                              'standard' : 8000,
                              'barkada' : 6500,
                              'garden' : 3500,
                              'family' : 4000,
                              'small' : 500,
                              'big' : 1000,
                              'cabana' : 1000,
                              'hall' : 3000
                        }

                        guest_revenue = int(total_guest) * 200
                        amount = guest_revenue

                        for room in rooms:
                              amount += room_rate.get(room)
                        
                        cursor.execute(''' INSERT INTO bookings (name, check_in, check_out, accomodations, total_guest, booking_type, payment, status, total_amount) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s) 
                        ''', (name, checkin, checkout, accomodations, total_guest, inquiry_type, payment, status, amount))
                        
                        if cursor.rowcount != 0: result_list.append(True)

                        cursor.execute(''' INSERT INTO accomodation_data(check_in, check_out, premium, standard, garden, barkada, family, cabana, small, big, hall, total) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ''', 
                        (      
                              checkin, 
                              checkout, 
                              counts.get('premium') if counts.get('premium') else 0, 
                              counts.get('standard') if counts.get('standard') else 0, 
                              counts.get('garden') if counts.get('garden') else 0, 
                              counts.get('barkada') if counts.get('barkada') else 0,
                              counts.get('family') if counts.get('family') else 0, 
                              counts.get('cabana') if counts.get('cabana') else 0, 
                              counts.get('small') if counts.get('small') else 0, 
                              counts.get('big') if counts.get('big') else 0, 
                              counts.get('hall') if counts.get('hall') else 0,
                              len(rooms)
                        ))
                        
                        if cursor.rowcount != 0: result_list.append(True)

                        for room, number in set(zip(rooms, room_no)):
                              cursor.execute('''UPDATE accomodation_spaces SET status = "occupied" WHERE name=%s AND room=%s''', (room.capitalize(), number))

                        con.commit()

                        success = True
                        for result in range(len(result_list)):
                              if result_list[result] == False: success = False
                        
                        return {'success': success, 'message': 'Added successfully!' if success else "Failed to add!"}
                  
            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Error: {str(e)}'}

      def recent_bookings(self, year, month):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT 
                                    booking_id,
                                    name, 
                                    check_in, 
                                    check_out, 
                                    accomodations, 
                                    status, 
                                    payment,
                                    DATE(check_out) - DATE(check_in) AS stay_gap
                              FROM bookings
                              WHERE YEAR(check_in) = %s
                              AND MONTH(check_in) = %s;
                        ''', (year, month))
                        data = cursor.fetchall()
                        new_data = []

                        for d in data:
                              formatted_checkin  = d.get('check_in').strftime("%b %-d")  
                              formatted_checkout  = d.get('check_out').strftime("%b %-d")  

                              new_data.append({'id': d.get('booking_id'), 'name': d.get('name'), 'checkin': formatted_checkin, 'checkout': formatted_checkout, 'accomodations': d.get('accomodations'), 'status': d.get('status'), 'stay': d.get('stay_gap'), 'payment': d.get('payment')})
                              
                        return {'success': bool(data), 'data': new_data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}


      def current_bookings(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT 
                                    booking_id,
                                    name, 
                                    check_in, 
                                    check_out, 
                                    accomodations, 
                                    status, 
                                    payment,
                                    DATE(check_out) - DATE(check_in) AS stay_gap
                              FROM bookings
                              WHERE YEAR(check_in) = YEAR(CURRENT_DATE())
                              AND MONTH(check_in) = MONTH(CURRENT_DATE());
                        ''')
                        data = cursor.fetchall()
                        new_data = []

                        for d in data:
                              formatted_checkin  = d.get('check_in').strftime("%b %-d")  
                              formatted_checkout  = d.get('check_out').strftime("%b %-d")  

                              new_data.append({'id': d.get('booking_id'), 'name': d.get('name'), 'checkin': formatted_checkin, 'checkout': formatted_checkout, 'accomodations': d.get('accomodations'), 'status': d.get('status'), 'stay': d.get('stay_gap'), 'payment': d.get('payment')})
                              
                        return {'success': bool(data), 'data': new_data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def todays_checkout(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT COALESCE(count(status), 0) as today_checkouts from bookings where check_out = CURRENT_DATE() AND status = 'Checked-out' ''')
                        data = cursor.fetchone()

                        return {'today_checkouts': data.get('today_checkouts')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def total_checkin(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT
                                    SUM(
                                          CASE 
                                                WHEN YEARWEEK(check_in, 1) = YEARWEEK(CURDATE(), 1)
                                                AND status IN ('Checked-in', 'Checked-out', 'Day Guest')
                                                THEN 1 ELSE 0 
                                          END
                                    ) AS this_week,
                                    
                                    SUM(
                                          CASE 
                                                WHEN YEARWEEK(check_in, 1) = YEARWEEK(CURDATE(), 1) - 1
                                                AND status IN ('Checked-in', 'Checked-out', 'Day Guest')
                                                THEN 1 ELSE 0 
                                          END
                                    ) AS last_week
                              FROM bookings
                              WHERE status != 'Cancelled';
                        ''')

                        data = cursor.fetchone()
                        lastweek = int(data.get('last_week'))
                        thisweek = int(data.get('this_week'))
                        change = ((thisweek - lastweek) / lastweek) * 100 if lastweek != 0 else 0 if lastweek == 0 and thisweek == 0 else 100

                        return {'total_checkins': data.get('this_week'), 'change': change}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def arrivals(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''SELECT COALESCE(COUNT(*), 0) as arrivals FROM bookings where status = 'Reserved' AND check_in > CURRENT_DATE() ''')
                        data = cursor.fetchone()

                        return {'upcoming_checkin': data.get('arrivals')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def get_year_data(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT DISTINCT YEAR(check_in) AS year
                              FROM accomodation_data
                              ORDER BY year DESC;
                        ''')
                        data = cursor.fetchall()

                        return {'years': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def total_cancelled(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT COALESCE(COUNT(*), 0) AS cancelled
                              FROM bookings
                              WHERE status = 'Cancelled'
                              AND MONTH(check_in) = MONTH(CURDATE())
                              AND YEAR(check_in) = YEAR(CURDATE());
                        ''')
                        data = cursor.fetchone()

                        return {'cancelled': data.get('cancelled')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def mark_checkin(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' UPDATE bookings SET status = 'Checked-in' where booking_id = %s ''', (id))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if cursor.rowcount != 0 else 'Failed!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def mark_checkout(self, id, accomodation):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' UPDATE bookings SET status = 'Checked-out' where booking_id = %s ''', (id))
                  
                        parts = accomodation.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]
                        
                        for room, number in set(zip(rooms, room_no)):
                              cursor.execute('''UPDATE accomodation_spaces SET status = "need-clean" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                        
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if cursor.rowcount != 0 else 'Failed!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def mark_paid(self, payment, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        query = f" UPDATE bookings SET payment = '{payment}' where booking_id = {id}"
                        cursor.execute(query)
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if cursor.rowcount != 0 else 'Failed!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def cancel_booking(self, id, accomodation):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        parts = accomodation.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]
                        
                        for room, number in set(zip(rooms, room_no)):
                              cursor.execute('''UPDATE accomodation_spaces SET status = "avl" WHERE name=%s AND room=%s''', (room.capitalize(), number))

                        cursor.execute(''' UPDATE bookings SET payment = 'Refunded', status = 'Cancelled' where booking_id = %s ''', (id,))
                        cursor.execute(''' DELETE FROM accomodation_data WHERE booking_id = %s ''', (id,))

                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Cancelled successfully!' if cursor.rowcount != 0 else 'Failed!'}

            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def view_details(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM bookings where booking_id = %s ''', (id,))
                        data = cursor.fetchone()

                        return {'success': bool(cursor.rowcount != 0), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

