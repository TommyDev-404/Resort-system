from collections import Counter
from .alert import Alerts
from datetime import datetime, timezone, timedelta, date


class Reservation:
      def __init__(self, db):
            self.db = db
            self.alert = Alerts(db)
      
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
                        cursor.execute(''' 
                              SELECT room as avl_room from accomodation_spaces where status = "avl" AND name = %s ''', (room_name, ))
                        data = cursor.fetchall()

                        list = []
                        for d in data:
                              list.append(d.get('avl_room'))

                        return {'rooms' : list}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def get_avl_room_all(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT room as avl_room from accomodation_spaces''')
                        data = cursor.fetchall()

                        list = []
                        for d in data:
                              list.append(d.get('avl_room'))

                        return {'rooms' : list}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def add_booking(self, name, total_guest, booking_type, payment, accomodations_selected, book_date, checkin, checkout, date_paid_add=None):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        parts = accomodations_selected.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[-1].lower() for x in range(len(parts))]
                        counts = Counter(rooms)

                        result_list = []

                        status = None
                        if booking_type == 'Reservation': status = 'Reserved'
                        if booking_type == 'Check-in': status = 'Checked-in'
                        if booking_type == 'Day Guest': status = 'Checked-in'
                        
                        new_checkin = datetime.strptime(checkin, "%Y-%m-%d").date()
                        new_checkout = datetime.strptime(checkout, "%Y-%m-%d").date()
                        night_stay = (new_checkout - new_checkin).days 

                        guest_revenue = int(total_guest) * 200
                        amount = guest_revenue
                        
                        room_revenue = []
                        for room in rooms:
                              price = self.accomodation_data(room.capitalize()) * night_stay if night_stay > 0 else self.accomodation_data(room.capitalize()) * 1
                              amount += price
                              room_revenue.append({'room': room, 'revenue' : price})
                        
                        cursor.execute(''' SELECT * from promos where date = CURRENT_DATE() ''')
                        data = cursor.fetchone()

                        room_affected = []
                        if data:
                              promo_area = data.get('area').split(',')
                              promo_name = data.get('name') if data else 'No promo.'

                              count = 0
                              for room in rooms:
                                    if room.capitalize() in promo_area:
                                          room_affected.append(parts[count])
                                    count += 1
                        
                        full_promo_name = f'{promo_name} discount' if len(room_affected) > 0 else 'No promo.'

                        if payment == 'ZUZU (Online Payment)':
                              zuzu_charge = amount * 0.05
                              resort_payment = amount * 0.95
                        else:
                              zuzu_charge = 0
                              resort_payment = amount 
                        
                        cursor.execute(''' INSERT INTO bookings (name, date_book, check_in, check_out, accomodations, total_guest, booking_type, payment, status, total_amount, resort_income, zuzu_charge, paid_date, promo, promo_area) 
                        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                        ''', (name, book_date, checkin, checkout, accomodations_selected, total_guest, booking_type, payment, status, amount, resort_payment, zuzu_charge, date_paid_add if payment != 'Pending' else None, full_promo_name, ", ".join(room_affected) if len(room_affected) > 0 else 'No accomodations under promo.'))
                        
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
                              if booking_type == 'Check-in' or booking_type == 'Day Guest':
                                    cursor.execute('''UPDATE accomodation_spaces SET status = "occupied" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                              else:
                                    cursor.execute('''UPDATE accomodation_spaces SET status = "reserved" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                              
                        con.commit()
                        
                        areas = {
                              "premium": 0,
                              "standard": 0,
                              "garden": 0,
                              "barkada": 0,
                              "family": 0,
                              "cabana": 0,
                              "big": 0,
                              "small": 0,
                              "hall": 0
                        }

                        for r in room_revenue:
                              key = r.get('room').lower().strip()
                              if key in areas:
                                    areas[key] = r.get('revenue')  

                        total = sum(areas.values())

                        cursor.execute(''' SELECT * FROM bookings ORDER BY booking_id DESC LIMIT 1; ''')
                        data_id = cursor.fetchone()
                        booking_id = data_id.get('booking_id')

                        cursor.execute('''
                              INSERT INTO area_revenue
                              (booking_id, check_in, check_out, premium, standard, garden, barkada, family, cabana, big, small, hall, total)
                              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                              ''', (
                              booking_id,               # MUST BE THE FIRST VALUE
                              checkin,
                              checkout,
                              areas["premium"],
                              areas["standard"],
                              areas["garden"],
                              areas["barkada"],
                              areas["family"],
                              areas["cabana"],
                              areas["big"],
                              areas["small"],
                              areas["hall"],
                              total
                        ))

                        con.commit()
                        # show notifications
                        self.alert.generate_alerts()

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
                                    date_book,
                                    check_in, 
                                    check_out, 
                                    accomodations, 
                                    booking_type,
                                    status, 
                                    payment,
                                    DATEDIFF(check_out, check_in) AS stay_gap
                              FROM bookings
                              WHERE YEAR(check_in) = %s
                              AND MONTH(check_in) = %s ORDER BY check_in DESC;
                        ''', (year, month))
                        data = cursor.fetchall()
                        new_data = []

                        for d in data:
                              formatted_checkin  = d.get('check_in').strftime("%b %d").lstrip("0")    
                              formatted_checkout  = d.get('check_out').strftime("%b %d").lstrip("0")    
                              formatted_date  = d.get('date_book').strftime("%b %d").lstrip("0")    

                              new_data.append({'id': d.get('booking_id'), 'name': d.get('name'),  'date_book': formatted_date, 'checkin': formatted_checkin, 'checkout': formatted_checkout, 'accomodations': d.get('accomodations'), 'booking_type': d.get('booking_type'), 'status': d.get('status'), 'stay': d.get('stay_gap'), 'payment': d.get('payment')})
                              
                        return {'success': bool(data), 'data': new_data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def booking_category(self, year, month, category):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        
                        if category == 'all-data':
                              cursor.execute('''
                                    SELECT 
                                          booking_id,
                                          name, 
                                          date_book,
                                          check_in, 
                                          check_out, 
                                          accomodations,  
                                          booking_type,
                                          status, 
                                          payment,
                                          DATE(check_out) - DATE(check_in) AS stay_gap
                                    FROM bookings
                                    WHERE YEAR(check_in) = %s
                                    AND MONTH(check_in) = %s ORDER BY check_in DESC;
                              ''', (year, month))
                        
                        if category == 'check_out-data':
                              cursor.execute('''
                                    SELECT 
                                          booking_id,
                                          name, 
                                          date_book,
                                          check_in, 
                                          check_out, 
                                          accomodations,  
                                          booking_type,
                                          status, 
                                          payment,
                                          DATE(check_out) - DATE(check_in) AS stay_gap
                                    FROM bookings
                                    WHERE YEAR(check_out) = %s
                                    AND MONTH(check_out) = %s AND status = "Checked-out" 
                                    ORDER BY check_in DESC;
                              ''', (year, month))

                        if category == 'reserved-data':
                              cursor.execute('''
                                    SELECT 
                                          booking_id,
                                          name,
                                          date_book, 
                                          check_in, 
                                          check_out, 
                                          accomodations,  
                                          booking_type,
                                          status, 
                                          payment,
                                          DATE(check_out) - DATE(check_in) AS stay_gap
                                    FROM bookings
                                    WHERE YEAR(check_in) = %s
                                    AND MONTH(check_in) = %s AND status = "Reserved"
                                    ORDER BY check_in DESC;
                              ''', (year, month))
                        
                        if category == 'cancelled-reservation-data':
                              cursor.execute('''
                                    SELECT 
                                          booking_id,
                                          name, 
                                          date_book,
                                          check_in, 
                                          check_out, 
                                          accomodations,  
                                          booking_type,
                                          status, 
                                          payment,
                                          DATE(check_out) - DATE(check_in) AS stay_gap
                                    FROM bookings
                                    WHERE YEAR(check_in) = %s
                                    AND MONTH(check_in) = %s AND status = "Cancelled"
                                    ORDER BY check_in DESC;
                              ''', (year, month))

                        if category == 'check_in-data':
                              cursor.execute('''
                                    SELECT 
                                          booking_id,
                                          name, 
                                          date_book,
                                          check_in, 
                                          check_out, 
                                          accomodations,  
                                          booking_type,
                                          status, 
                                          payment,
                                          DATE(check_out) - DATE(check_in) AS stay_gap
                                    FROM bookings
                                    WHERE YEAR(check_in) = %s
                                    AND MONTH(check_in) = %s AND status = "Checked-in"
                                    ORDER BY check_in DESC;
                              ''', (year, month))
                        
                        if category == 'day-guest':
                              cursor.execute('''
                                    SELECT 
                                          booking_id,
                                          name, 
                                          date_book,
                                          check_in, 
                                          check_out, 
                                          accomodations,  
                                          booking_type,
                                          status, 
                                          payment,
                                          DATE(check_out) - DATE(check_in) AS stay_gap
                                    FROM bookings
                                    WHERE YEAR(check_in) = %s
                                    AND MONTH(check_in) = %s AND booking_type = "Day Guest"
                                    ORDER BY check_in DESC;
                              ''', (year, month))

                        if category == 'not_paid-data':
                              cursor.execute('''
                                    SELECT 
                                          booking_id,
                                          name, 
                                          date_book,
                                          check_in, 
                                          check_out, 
                                          accomodations, 
                                          booking_type,
                                          status, 
                                          payment,
                                          DATE(check_out) - DATE(check_in) AS stay_gap
                                    FROM bookings
                                    WHERE YEAR(check_in) = %s
                                    AND MONTH(check_in) = %s AND status <> 'Reserved' AND payment = "Pending"
                                    ORDER BY check_in DESC;
                              ''', (year, month))
                        
                        data = cursor.fetchall()
                        new_data = []

                        for d in data: 
                              formatted_checkin  = d.get('check_in').strftime("%b %d").lstrip("0")  
                              formatted_checkout  = d.get('check_out').strftime("%b %d").lstrip("0")    
                              formatted_date  = d.get('date_book').strftime("%b %d").lstrip("0")    

                              new_data.append({'id': d.get('booking_id'), 'name': d.get('name'), 'date_book': formatted_date, 'checkin': formatted_checkin, 'checkout': formatted_checkout, 'accomodations': d.get('accomodations'), 'status': d.get('status'),  'booking_type': d.get('booking_type'), 'stay': d.get('stay_gap'), 'payment': d.get('payment')})
                              
                        return {'success': bool(data), 'data': new_data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def arrivals(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT COALESCE(COUNT(*), 0) as arrivals FROM bookings where status = 'Reserved' AND check_in > CURRENT_DATE() OR status = 'Reserved' ''')
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

      def summaryCardsData(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT
                              -- Total Guests (all guests checked in today)
                              SUM(CASE WHEN status = 'Checked-in' AND check_in = CURRENT_DATE() THEN total_guest ELSE 0 END) AS total_guests,

                              -- Check-Ins today
                              COUNT(CASE WHEN status = 'Checked-in' AND booking_type = 'Check-in' AND check_in = CURRENT_DATE() THEN 1 END) AS bookings_checkin,
                              SUM(CASE WHEN status = 'Checked-in' AND booking_type = 'Check-in' AND check_in = CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_checkin,

                              -- Check-Outs today
                              COUNT(CASE WHEN status = 'Checked-out' AND check_out = CURRENT_DATE THEN 1 END) AS bookings_checkout,
                              SUM(CASE WHEN status = 'Checked-out' AND check_out = CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_checkout,

                              -- Day Guests today
                              COUNT(CASE WHEN booking_type = 'Day Guest' AND status = 'Checked-in' AND check_in = CURRENT_DATE THEN 1 END) AS bookings_day,
                              SUM(CASE WHEN booking_type = 'Day Guest' AND status = 'Checked-in' AND check_in = CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_day,

                              -- Upcoming Arrivals (future reservations)
                              COUNT(CASE WHEN status = 'Reserved' AND check_in > CURRENT_DATE THEN 1 END) AS bookings_upcoming,
                              SUM(CASE WHEN status = 'Reserved' AND check_in > CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_upcoming,

                              -- Cancelled Bookings (this month)
                              COUNT(CASE WHEN status = 'Cancelled' AND MONTH(check_in) = MONTH(CURRENT_DATE) THEN 1 END) AS bookings_cancelled,
                              SUM(CASE WHEN status = 'Cancelled' AND MONTH(check_in) = MONTH(CURRENT_DATE) THEN total_guest ELSE 0 END) AS guests_cancelled

                              FROM bookings;

                        ''')
                        data = cursor.fetchone()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def mark_checkin(self, id, accomodation):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' UPDATE bookings SET status = 'Checked-in' where booking_id = %s ''', (id))
                        con.commit()

                        parts = accomodation.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]
                        
                        """
                        cursor.execute(''' SELECT * FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()
                        booking_type = data.get('booking_type')

                        
                        if booking_type == 'Reservation' and data.get('status') == 'Reserved':
                              for room, number in set(zip(rooms, room_no)):
                                    if room not in ['cabana', 'small', 'big', 'hall']:
                                          cursor.execute('''UPDATE accomodation_spaces SET status = "reserved" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                                    con.commit()
                        else:
                        """

                        for room, number in set(zip(rooms, room_no)):
                              if room not in ['cabana', 'small', 'big', 'hall']:
                                    cursor.execute('''UPDATE accomodation_spaces SET status = "occupied" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                        con.commit()
                        
                        self.alert.generate_alerts()

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
                        room_dict = {}

                        for part in parts:
                              tokens = part.split(' ')  # split by space
                              room_type = tokens[0].lower()  # "Premium", "Garden", ...
                              room_dict[room_type] = part
                              
                        rooms = [parts[x].split(' ')[0].strip().lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]
                        now = datetime.now(timezone.utc)

                        cursor.execute(''' SELECT * FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()
                        check_out = data.get('check_out')

                        if check_out < date.today():
                              for room, number in set(zip(rooms, room_no)):
                                    if room.strip() not in ['cabana', 'small', 'big', 'hall']:
                                          cursor.execute('''UPDATE accomodation_spaces SET status = "avl" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                        else:
                              for room, number in set(zip(rooms, room_no)):
                                    if room.strip() not in ['cabana', 'small', 'big', 'hall']:
                                          cursor.execute('''UPDATE accomodation_spaces SET status = "need-clean" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                                          cursor.execute(''' INSERT INTO notifications(name, date, room_name, room_no, alert_type) VALUES(%s, %s, %s, %s, %s) ''', (f'Housekeeping requested for {room_dict.get(room)}', now, room, number, 'housekeeping'))
                              
                        con.commit()

                        self.alert.generate_alerts()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if cursor.rowcount != 0 else 'Failed!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def mark_paid(self, payment, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        query = f" UPDATE bookings SET payment = '{payment}', paid_date = '{date.today()}' where booking_id = {id} and paid_date IS NULL"
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

                        cursor.execute(''' SELECT * FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()
                        payment = data.get('payment')

                        parts = accomodation.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]

                        for room, number in set(zip(rooms, room_no)):
                              cursor.execute('''UPDATE accomodation_spaces SET status = "avl" WHERE name=%s AND room=%s''', (room.capitalize(), number))
                              con.commit()

                        if payment.strip() != 'Pending':
                              cursor.execute(''' UPDATE bookings SET payment = 'Refunded', status = 'Cancelled' where booking_id = %s ''', (id,))
                        else:
                              cursor.execute(''' UPDATE bookings SET payment = 'None', status = 'Cancelled' where booking_id = %s ''', (id,))

                        cursor.execute(''' DELETE FROM accomodation_data WHERE booking_id = %s ''', (id,))
                        cursor.execute(''' DELETE FROM area_revenue WHERE booking_id = %s ''', (id,))
                        con.commit()

                        self.alert.generate_alerts()
                        return {'success': bool(cursor.rowcount > 0), 'message': 'Cancelled successfully!' if cursor.rowcount > 0 else 'Failed!'}

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
            
      def get_reservation_date(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT check_in, check_out, booking_type FROM bookings where booking_id = %s ''', (id,))
                        data = cursor.fetchone()

                        return {'check_in': data.get('check_in'), 'check_out': data.get('check_out'), 'booking_type': data.get('booking_type')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def update_reservation_date(self, id, edit_checkin, edit_checkout, booking_type):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM area_revenue WHERE booking_id = %s ''', (id,))
                        area_data = cursor.fetchone()

                        cursor.execute(''' SELECT * FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()

                        areas = data.get('accomodations').split(',')
                        check_in = data.get('check_in')
                        check_out = data.get('check_out')     
                        old_night_stay = (check_out - check_in).days     

                        new_checkin = datetime.strptime(edit_checkin, "%Y-%m-%d").date()
                        new_checkout = datetime.strptime(edit_checkout, "%Y-%m-%d").date()
                        night_stay2 = (new_checkout - new_checkin).days
                        added_night = night_stay2 - old_night_stay if night_stay2 > old_night_stay else old_night_stay - night_stay2

                        guest_revenue = int(data.get('total_guest')) * 200
                        today = date.today()
                        new_area_revenue = area_data.copy()
                        
                        new_area_revenue = {key: 0 for key in new_area_revenue}  # Reset values
                        new_amount = guest_revenue

                        for area in areas:
                              area_name = area.split(' ')[0].lower().strip()

                              # Fetch both rates
                              cursor.execute(''' SELECT rate, orig_rate FROM accomodation_spaces WHERE name = %s LIMIT 1 ''', (area_name,))
                              rate_data = cursor.fetchone()

                              promo_rate = float(rate_data.get('rate'))
                              orig_rate = float(rate_data.get('orig_rate'))

                              revenue_per_area = 0

                              cursor.execute(''' SELECT * FROM promos  ''')
                              promo_data = cursor.fetchone()

                              if promo_data:
                                    promo_start = promo_data.get('date')
                              else:
                                    promo_start = None  # no promo today

                              # Loop night by night
                              day = new_checkin
                              while day < new_checkout:

                                    if promo_start and day >= promo_start:
                                          print('promo Started')
                                          promo_end = promo_data.get('end_date') if promo_data.get('end_date') else None
                                          if promo_end and day > promo_end:
                                                print('promo end')
                                                nightly_rate = orig_rate
                                                print(nightly_rate)
                                          else:
                                                print('promo applied')
                                                nightly_rate = promo_rate
                                                print(nightly_rate)
                                    else:
                                          nightly_rate = orig_rate
                                          print('no promo')
                                          
                                    revenue_per_area += nightly_rate
                                    new_amount += nightly_rate

                                    day += timedelta(days=1)

                              new_area_revenue[area_name] = revenue_per_area

                        total = sum([
                              new_area_revenue["premium"],
                              new_area_revenue["standard"],
                              new_area_revenue["garden"],
                              new_area_revenue["barkada"],
                              new_area_revenue["family"],
                              new_area_revenue["cabana"],
                              new_area_revenue["big"],
                              new_area_revenue["small"],
                              new_area_revenue["hall"]
                        ])

                        if data.get('payment') == 'ZUZU (Online Payment)':
                              zuzu_charge = new_amount * 0.05
                              resort_payment = new_amount * 0.95
                        else:
                              zuzu_charge = 0
                              resort_payment = new_amount 

                        cursor.execute('''
                              UPDATE area_revenue SET
                                    check_in = %s,
                                    check_out = %s,
                                    premium = %s,
                                    standard = %s,
                                    garden = %s,
                                    barkada = %s,
                                    family = %s,
                                    cabana = %s,
                                    big = %s,
                                    small = %s,
                                    hall = %s,
                                    total = %s
                              WHERE booking_id = %s
                              ''', (
                              new_checkin,
                              new_checkout,
                              new_area_revenue["premium"],
                              new_area_revenue["standard"],
                              new_area_revenue["garden"],
                              new_area_revenue["barkada"],
                              new_area_revenue["family"],
                              new_area_revenue["cabana"],
                              new_area_revenue["big"],
                              new_area_revenue["small"],
                              new_area_revenue["hall"],
                              total,
                              id  # WHERE condition comes last
                        ))

                        cursor.execute(''' UPDATE bookings SET check_in = %s, check_out = %s, total_amount = %s, resort_income = %s, zuzu_charge = %s WHERE booking_id = %s ''', 
                        (edit_checkin, edit_checkout, new_amount, resort_payment, zuzu_charge, id))

                        con.commit()

                        self.alert.generate_alerts()

                        return {'success': bool(cursor.rowcount > 0), 'message': "Updated successfully!" if cursor.rowcount > 0 else 'Failed to update.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def get_data_to_update(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT accomodations, check_in, check_out FROM bookings WHERE booking_id = %s''', (id,))
                        data = cursor.fetchone()

                        return {'success': bool(data), 'checkin': data.get('check_in'), 'checkout': data.get('check_out'), 'accomodations': data.get('accomodations')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def totals(self, month, year):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute("""
                              WITH check_in AS (
                                    SELECT COALESCE(COUNT(status), 0) AS total_checkin 
                                    FROM bookings 
                                    WHERE MONTH(check_in) = %s
                                    AND YEAR(check_in) = %s
                                    AND status IN ('Checked-in')
                              ),
                              reserved AS (
                                    SELECT COALESCE(COUNT(status), 0) AS total_reserved 
                                    FROM bookings 
                                    WHERE MONTH(check_in) = %s
                                    AND YEAR(check_in) = %s
                                    AND status = 'Reserved'
                              ),
                              check_out AS (
                                    SELECT COALESCE(COUNT(status), 0) AS total_checkout 
                                    FROM bookings 
                                    WHERE MONTH(check_out) = %s
                                    AND YEAR(check_out) = %s
                                    AND status = 'Checked-out' 
                              ),
                              paid AS (
                                    SELECT COALESCE(COUNT(payment), 0) AS total_paid 
                                    FROM bookings 
                                    WHERE MONTH(check_in) = %s
                                    AND YEAR(check_in) = %s
                                    AND payment NOT IN ('Refunded', 'Pending')
                              ),
                              day_guest AS (
                                    SELECT COALESCE(COUNT(status), 0) AS total_dayguest 
                                    FROM bookings 
                                    WHERE MONTH(check_in) = %s
                                    AND YEAR(check_in) = %s
                                    AND booking_type = 'Day Guest'
                              ),
                              not_paid AS (
                                    SELECT COALESCE(COUNT(payment), 0) AS total_npaid 
                                    FROM bookings 
                                    WHERE MONTH(check_in) = %s
                                    AND YEAR(check_in) = %s AND status <> 'Reserved'
                                    AND payment = 'Pending'
                              ),
                              cancelled AS (
                                    SELECT COALESCE(COUNT(payment), 0) AS total_cancel
                                    FROM bookings 
                                    WHERE MONTH(check_in) = %s
                                    AND YEAR(check_in) = %s
                                    AND status = 'Cancelled'
                              ),
                              all_data AS (
                                    SELECT COALESCE(COUNT(*), 0) AS total_all 
                                    FROM bookings 
                                    WHERE MONTH(check_in) = %s
                                    AND YEAR(check_in) = %s
                              )
                              SELECT 
                                    c.total_checkin,
                                    r.total_reserved,
                                    d.total_dayguest,
                                    co.total_checkout,
                                    p.total_paid,
                                    np.total_npaid,
                                    cn.total_cancel,
                                    a.total_all
                              FROM 
                                    check_in c,
                                    reserved r,
                                    day_guest d,
                                    check_out co,
                                    paid p,
                                    not_paid np,
                                    cancelled cn,
                                    all_data a;
                        """, (month, year, month, year, month, year, month, year, month, year,  month, year, month, year, month, year))

                        data = cursor.fetchone()
                        return {'success': bool(data), 'checkin': data.get('total_checkin'), 'cancelled': data.get('total_cancel'), 'checkout': data.get('total_checkout'), 'reserved': data.get('total_reserved'), 'paid': data.get('total_paid'), 'not_paid': data.get('total_npaid'), 'day_guest': data.get('total_dayguest'),  'all': data.get('total_all')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def search_guest(self, guest_name, year, month, category):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # Base query
                        sql = """
                              SELECT * FROM bookings 
                              WHERE name LIKE %s COLLATE utf8mb4_general_ci
                              AND YEAR(check_in) = %s 
                              AND MONTH(check_in) = %s
                        """

                        params = [guest_name + "%", year, month]

                        # Add category filters
                        if category != 'all-data':
                              if category == 'check_out-data':
                                    sql += ' AND status = "Checked-out"  ORDER BY check_in DESC'
                              elif category == 'check_in-data':
                                    sql += ' AND status = "Checked-in"  ORDER BY check_in DESC'
                              elif category == 'reserved-data':
                                    sql += ' AND status = "Reserved"  ORDER BY check_in DESC'
                              elif category == 'cancelled-reservation-data':
                                    sql += ' AND status = "Cancelled"  ORDER BY check_in DESC'
                              elif category == 'paid-data':
                                    sql += ' AND payment != "Pending"  ORDER BY check_in DESC'
                              elif category == 'not_paid-data':
                                    sql += ' AND payment = "Pending"  ORDER BY check_in DESC'
                              elif category == 'day_guest':
                                    sql += ' AND status = "Day Guest"  ORDER BY check_in DESC'

                        cursor.execute(sql, params)
                        data = cursor.fetchall()

                        new_data = []

                        for d in data: 
                              formatted_checkin  = d.get('check_in').strftime("%b %d").lstrip("0")  
                              formatted_checkout  = d.get('check_out').strftime("%b %d").lstrip("0")    
                              formatted_date  = d.get('date_book').strftime("%b %d").lstrip("0")    

                              new_data.append({'id': d.get('booking_id'), 'name': d.get('name'), 'date_book': formatted_date, 'checkin': formatted_checkin, 'checkout': formatted_checkout, 'accomodations': d.get('accomodations'),'booking_type': d.get('booking_type'), 'status': d.get('status'), 'stay': d.get('stay_gap'), 'payment': d.get('payment')})
                              
                        return {'success': bool(new_data), 'data': new_data}

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Search failed: {e}'}

      def accomodation_data(self, query):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('SELECT rate from accomodation_spaces where name = %s ', (query.strip(),))
                  data = cursor.fetchone()
                  print(data.get('rate'))
                  return data.get('rate')
