from collections import Counter
from .alert import Alerts
from datetime import datetime, timezone, timedelta, date
from calendar import monthrange


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
                                    SELECT COUNT(name) AS pr FROM accomodation_spaces WHERE name = 'Premium' AND status IN ('avl')
                                    ),
                                    st AS (
                                    SELECT COUNT(name) AS st FROM accomodation_spaces WHERE name = 'Standard' AND status IN ('avl')
                                    ),
                                    gr AS (
                                    SELECT COUNT(name) AS gr FROM accomodation_spaces WHERE name = 'Garden' AND status IN ('avl')
                                    ),
                                    fm AS (
                                    SELECT COUNT(name) AS fm FROM accomodation_spaces WHERE name = 'Family' AND status IN ('avl')
                                    ),
                                    bd AS (
                                    SELECT COUNT(name) AS bd FROM accomodation_spaces WHERE name = 'Barkada' AND status IN ('avl')
                                    ),
                                    cb AS (
                                    SELECT COUNT(name) AS cb FROM accomodation_spaces WHERE name = 'Cabana' AND status IN ('avl')
                                    ),
                                    sm AS (
                                    SELECT COUNT(name) AS sm FROM accomodation_spaces WHERE name = 'Small' AND status IN ('avl')
                                    ),
                                    bg AS (
                                    SELECT COUNT(name) AS bg FROM accomodation_spaces WHERE name = 'Big' AND status IN ('avl')
                                    ),
                                    hall AS (
                                    SELECT COUNT(name) AS hall FROM accomodation_spaces WHERE name in ('Pavillion', 'Mariposa', 'Minicon') AND status IN ('avl')
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

      def get_avl_room(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT room, name from accomodation_spaces where status = %s ''', ("avl",))
                        data = cursor.fetchall()
                        
                        list = []
                        for d in data:
                              list.append((d.get('room'), d.get('name')))

                        return {'rooms' : list}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def add_booking(self, name, total_guest, booking_type, payment, accomodations_selected, checkin, checkout, book_date=None, date_paid_add=None):
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
                        today = date.today()

                        guest_revenue = int(total_guest) * 200
                        new_amount = guest_revenue

                        cursor.execute(''' SELECT * FROM promos WHERE status IN ('Active') ''')
                        promo_data = cursor.fetchone()
                        
                        room_affected = []

                        count = 0
                        new_area_revenue = {
                              "premium": 0,
                              "standard": 0,
                              "garden": 0,
                              "barkada": 0,
                              "cabana": 0,
                              "big": 0,
                              "small": 0,
                              "pavillion": 0,
                              "mariposa": 0,
                              "minicon": 0
                        }

                        for room in rooms:
                              cursor.execute(''' SELECT rate, orig_rate FROM accomodation_spaces WHERE name = %s LIMIT 1 ''', (room.capitalize(),))
                              rate_data = cursor.fetchone()

                              promo_rate = float(rate_data.get('rate'))
                              orig_rate = float(rate_data.get('orig_rate'))
                              revenue_per_area = 0

                              if promo_data:
                                    promo_name = promo_data.get('name')
                                    promo_area = promo_data.get('area').split(',')
                                    promo_start = promo_data.get('date') 
                                    promo_end = promo_data.get('end_date')
                                    if room.capitalize() in promo_area: room_affected.append(parts[count])
                              else:
                                    promo_start = None
                                    promo_end = None

                              if new_checkin < new_checkout:
                                    day = new_checkin
                                    while day < new_checkout:
                                          if promo_start and day >= promo_start: # if promo start today and checkin is before promo start
                                                if promo_end and day >= promo_end: # if promo end and the check in is after it
                                                      nightly_rate = orig_rate # add the original rate 
                                                else:
                                                      nightly_rate = promo_rate # get the promo rate
                                          else:
                                                nightly_rate = orig_rate

                                          revenue_per_area += nightly_rate
                                          new_amount += nightly_rate
                                          day += timedelta(days=1)
                              else:
                                    if booking_type == 'Day Guest':
                                          new_amount += promo_rate if promo_end and promo_end >= today else orig_rate
                                          revenue_per_area += promo_rate if promo_end and promo_end >= today else orig_rate
                                    else: # for same day checkin and checkout
                                          new_amount += promo_rate / 2 if promo_end and promo_end >= today else orig_rate / 2
                                          revenue_per_area += promo_rate / 2 if promo_end and promo_end >= today else orig_rate / 2

                              new_area_revenue[room.lower()] = revenue_per_area - (revenue_per_area * 0.05) if payment == 'ZUZU (Online Payment)' else revenue_per_area

                              count += 1

                        full_promo_name = f'{promo_name} discount' if len(room_affected) > 0 else 'No promo.'

                        if payment == 'ZUZU (Online Payment)':
                              new_amount = new_amount - (new_amount * 0.05)
                        
                        cursor.execute(''' INSERT INTO bookings (name, date_book, check_in, check_out, accomodations, total_guest, booking_type, payment, status, total_amount, paid_date, promo, promo_area) 
                        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                        ''', (name, book_date if book_date != None else checkin, checkin, checkout, accomodations_selected, total_guest, booking_type, payment, status, new_amount, date_paid_add if payment != 'Pending' else None, full_promo_name, ", ".join(room_affected) if len(room_affected) > 0 else 'No accomodations under promo.'))
                        
                        if cursor.rowcount != 0: result_list.append(True)

                        cursor.execute(''' INSERT INTO accomodation_data(check_in, check_out, premium, standard, garden, barkada, cabana, small, big, pavillion, mariposa, minicon, total) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ''', 
                        (      
                              checkin, 
                              checkout, 
                              counts.get('premium') if counts.get('premium') else 0, 
                              counts.get('standard') if counts.get('standard') else 0, 
                              counts.get('garden') if counts.get('garden') else 0, 
                              counts.get('barkada') if counts.get('barkada') else 0,
                              counts.get('cabana') if counts.get('cabana') else 0, 
                              counts.get('small') if counts.get('small') else 0, 
                              counts.get('big') if counts.get('big') else 0, 
                              counts.get('pavillion') if counts.get('pavillion') else 0,
                              counts.get('mariposa') if counts.get('mariposa') else 0,
                              counts.get('minicon') if counts.get('minicon') else 0,
                              len(rooms)
                        ))
                        
                        if cursor.rowcount != 0: result_list.append(True)

                        for room, number in set(zip(rooms, room_no)):
                              if booking_type == 'Check-in' or booking_type == 'Day Guest':
                                    cursor.execute('''UPDATE accomodation_spaces SET status = %s WHERE name=%s AND room=%s''', ("occupied", room.capitalize(), number))
                              else:
                                    cursor.execute('''UPDATE accomodation_spaces SET status = %s WHERE name=%s AND room=%s''', ("reserved", room.capitalize(), number))

                        con.commit()

                        total = sum(new_area_revenue.values())

                        cursor.execute(''' SELECT booking_id FROM bookings ORDER BY booking_id DESC LIMIT 1; ''')
                        data_id = cursor.fetchone()
                        booking_id = data_id.get('booking_id')

                        cursor.execute('''
                              INSERT INTO area_revenue
                              (booking_id, check_in, check_out, premium, standard, garden, barkada, cabana, big, small, pavillion, mariposa, minicon, total)
                              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                              ''', (
                              booking_id,               # MUST BE THE FIRST VALUE
                              checkin,
                              checkout,
                              new_area_revenue["premium"],
                              new_area_revenue["standard"],
                              new_area_revenue["garden"],
                              new_area_revenue["barkada"],
                              new_area_revenue["cabana"],
                              new_area_revenue["big"],
                              new_area_revenue["small"],
                              new_area_revenue["pavillion"],
                              new_area_revenue["mariposa"],
                              new_area_revenue["minicon"],
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
                        start_date = date(int(year), int(month), 1)

                        # Compute first day of the next month
                        if int(month) == 12:
                              end_date = date(int(year) + 1, 1, 1)
                        else:
                              end_date = date(int(year), int(month) + 1, 1)

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
                        WHERE check_in >= %s
                              AND check_in < %s
                        ORDER BY check_in DESC;
                        ''', (start_date, end_date))

                        data = cursor.fetchall()
                        new_data = []

                        for d in data:
                              formatted_checkin  = d.get('check_in').strftime("%b %d").lstrip("0")    
                              formatted_checkout  = d.get('check_out').strftime("%b %d").lstrip("0") if d.get('check_out') else '--'
                              formatted_date  = d.get('date_book').strftime("%b %d").lstrip("0") if d.get('date_book') else '--'

                              new_data.append({'id': d.get('booking_id'), 'name': d.get('name'),  'date_book': formatted_date , 'checkin': formatted_checkin, 'checkout': formatted_checkout, 'accomodations': d.get('accomodations'), 'booking_type': d.get('booking_type'), 'status': d.get('status'), 'stay': d.get('stay_gap'), 'payment': d.get('payment')})
                              
                        return {'success': bool(data), 'data': new_data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def booking_category(self, year, month, category):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # Compute start and end dates for the month
                        start_date = date(int(year), int(month), 1)
                        if int(month) == 12:
                              end_date = date(int(year) + 1, 1, 1)
                        else:
                              end_date = date(int(year), int(month) + 1, 1)

                        base_sql = '''
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
                        WHERE {date_column} >= %s
                              AND {date_column} < %s
                        '''

                        # Determine which date column to filter on
                        if category == 'check_out-data':
                              date_column = 'check_out'
                        else:
                              date_column = 'check_in'

                        sql = base_sql.format(date_column=date_column)

                        # Add category-specific filters
                        if category == 'check_out-data':
                              sql += ' AND status = "Checked-out"'
                        elif category == 'check_in-data':
                              sql += ' AND status = "Checked-in"'
                        elif category == 'reserved-data':
                              sql += ' AND status = "Reserved"'
                        elif category == 'cancelled-reservation-data':
                              sql += ' AND status = "Cancelled"'
                        elif category == 'day-guest':
                              sql += ' AND booking_type = "Day Guest"'
                        elif category == 'not_paid-data':
                              sql += ' AND status <> "Reserved" AND payment = "Pending"'

                        sql += ' ORDER BY check_in DESC'

                        cursor.execute(sql, (start_date, end_date))
                        data = cursor.fetchall()
                        new_data = []

                        for d in data:
                              formatted_checkin  = d.get('check_in').strftime("%b %d").lstrip("0")  
                              formatted_checkout  = d.get('check_out').strftime("%b %d").lstrip("0")    
                              formatted_date  = d.get('date_book').strftime("%b %d").lstrip("0") if d.get('date_book') else '--'

                              new_data.append({
                                    'id': d.get('booking_id'),
                                    'name': d.get('name'),
                                    'date_book': formatted_date,
                                    'checkin': formatted_checkin,
                                    'checkout': formatted_checkout,
                                    'accomodations': d.get('accomodations'),
                                    'status': d.get('status'),
                                    'booking_type': d.get('booking_type'),
                                    'stay': d.get('stay_gap'),
                                    'payment': d.get('payment')
                              })

                        return {'success': bool(data), 'data': new_data}

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Cancellation failed: {e}'}

      def arrivals(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT COALESCE(COUNT(booking_id), 0) as arrivals FROM bookings where status IN ('Reserved') AND check_in > CURRENT_DATE() ''')
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
                              SUM(CASE WHEN status IN ('Checked-in') AND check_in = CURRENT_DATE() THEN total_guest ELSE 0 END) AS total_guests,

                              -- Check-Ins today
                              COUNT(CASE WHEN status IN ('Checked-in') AND booking_type IN ('Check-in', 'Reservation') AND check_in = CURRENT_DATE() THEN 1 END) AS bookings_checkin,
                              SUM(CASE WHEN status IN ('Checked-in') AND booking_type IN ('Check-in', 'Reservation') AND check_in = CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_checkin,

                              -- Check-Outs today
                              COUNT(CASE WHEN status IN ('Checked-out') AND check_out = CURRENT_DATE THEN 1 END) AS bookings_checkout,
                              SUM(CASE WHEN status IN ('Checked-out') AND check_out = CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_checkout,

                              -- Day Guests today
                              COUNT(CASE WHEN booking_type IN ('Day Guest') AND status IN ('Checked-in') AND check_in = CURRENT_DATE THEN 1 END) AS bookings_day,
                              SUM(CASE WHEN booking_type IN ('Day Guest') AND status IN ('Checked-in') AND check_in = CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_day,

                              -- Upcoming Arrivals (future reservations)
                              COUNT(CASE WHEN status IN ('Reserved') AND check_in > CURRENT_DATE THEN 1 END) AS bookings_upcoming,
                              SUM(CASE WHEN status IN ('Reserved') AND check_in > CURRENT_DATE THEN total_guest ELSE 0 END) AS guests_upcoming,

                              -- Cancelled Bookings (this month)
                              COUNT(CASE WHEN status = 'Cancelled' AND check_in >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') 
                                    AND check_in <  DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) 
                                    THEN 1 END) AS bookings_cancelled,
                              SUM(CASE WHEN status = 'Cancelled' AND check_in >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') 
                                    AND check_in <  DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) 
                                    THEN total_guest ELSE 0 END) AS guests_cancelled

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
                        cursor.execute(''' UPDATE bookings SET status =%s where booking_id = %s ''', ("Checked-in", id))
                        con.commit()

                        parts = accomodation.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]

                        for room, number in set(zip(rooms, room_no)):
                              if room not in ['cabana', 'small', 'big', 'hall']:
                                    cursor.execute('''UPDATE accomodation_spaces SET status = %s WHERE name=%s AND room=%s''', ("occupied", room.capitalize(), number))
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
                        cursor.execute(''' UPDATE bookings SET status = %s where booking_id = %s ''', ("Checked-out", id))
                  
                        parts = accomodation.split(',')
                        room_dict = {}

                        for part in parts:
                              tokens = part.split(' ')  # split by space
                              room_type = tokens[0].lower()  # "Premium", "Garden", ...
                              room_dict[room_type] = part
                              
                        rooms = [parts[x].split(' ')[0].strip().lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]
                        now = datetime.now(timezone.utc)

                        cursor.execute(''' SELECT check_out FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()
                        check_out = data.get('check_out')

                        if check_out < date.today():
                              for room, number in set(zip(rooms, room_no)):
                                    if room.strip() not in ['cabana', 'small', 'big', 'hall']:
                                          cursor.execute('''UPDATE accomodation_spaces SET status = %s WHERE name=%s AND room=%s''', ("avl", room.capitalize(), number))
                        else:
                              for room, number in set(zip(rooms, room_no)):
                                    if room.strip() not in ['cabana', 'small', 'big', 'hall']:
                                          cursor.execute('''UPDATE accomodation_spaces SET status = %s WHERE name=%s AND room=%s''', ("need-clean", room.capitalize(), number))
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

                        cursor.execute(''' SELECT payment FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()
                        payment = data.get('payment')

                        parts = accomodation.split(',')
                        rooms = [parts[x].split(' ')[0].lower() for x in range(len(parts))]
                        room_no = [parts[x].split(' ')[2].lower() for x in range(len(parts))]

                        for room, number in set(zip(rooms, room_no)):
                              cursor.execute('''UPDATE accomodation_spaces SET status = %s WHERE name=%s AND room=%s''', ("avl", room.capitalize(), number))
                              con.commit()

                        if payment.strip() != 'Pending':
                              cursor.execute(''' UPDATE bookings SET payment = %s, status = %s where booking_id = %s ''', ('Refunded', 'Cancelled', id))
                        else:
                              cursor.execute(''' UPDATE bookings SET payment = %s, status = %s where booking_id = %s ''', ('None', 'Cancelled', id))

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

      def update_reservation_date(self, id, edit_checkin, edit_checkout):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT premium, standard, garden, barkada, cabana, small, big, pavillion, mariposa, minicon FROM area_revenue WHERE booking_id = %s ''', (id,))
                        area_data = cursor.fetchone()

                        cursor.execute(''' SELECT accomodations, total_guest, payment FROM bookings WHERE booking_id = %s ''', (id,))
                        data = cursor.fetchone()

                        areas = data.get('accomodations').split(',')

                        new_checkin = datetime.strptime(edit_checkin, "%Y-%m-%d").date()
                        new_checkout = datetime.strptime(edit_checkout, "%Y-%m-%d").date()

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

                              cursor.execute(''' SELECT * FROM promos WHERE status = %s ''', ('Active',))
                              promo_data = cursor.fetchone()

                              if promo_data:
                                    promo_start = promo_data.get('date')
                                    promo_end = promo_data.get('end_date') 
                              else:
                                    promo_start = None
                                    promo_end = None

                              if new_checkin < new_checkout:
                                    # Handle revenue if promo applied
                                    day = new_checkin
                                    while day < new_checkout: # loop until the day every night the guest stay
                                          if promo_start and day >= promo_start: # if promo start today and checkin is before promo start
                                                if promo_end and day >= promo_end: # if promo end and the check in is after it
                                                      nightly_rate = orig_rate # add the original rate 
                                                else:
                                                      nightly_rate = promo_rate # get the promo rate
                                          else:
                                                nightly_rate = orig_rate
                                                
                                          revenue_per_area += nightly_rate
                                          new_amount += nightly_rate

                                          day += timedelta(days=1)
                              else:
                                    if promo_end >= new_checkin:
                                          new_amount += promo_rate / 2
                                          revenue_per_area += promo_rate / 2
                                    else:
                                          new_amount += orig_rate / 2
                                          revenue_per_area += orig_rate / 2

                              new_area_revenue[area_name] = revenue_per_area - (revenue_per_area * 0.05) if data.get('payment') == 'ZUZU (Online Payment)' else revenue_per_area

                        total = sum([
                              new_area_revenue["premium"],
                              new_area_revenue["standard"],
                              new_area_revenue["garden"],
                              new_area_revenue["barkada"],
                              new_area_revenue["cabana"],
                              new_area_revenue["big"],
                              new_area_revenue["small"],
                              new_area_revenue["pavillion"],
                              new_area_revenue["mariposa"],
                              new_area_revenue["minicon"]
                        ])

                        if data.get('payment') == 'ZUZU (Online Payment)':
                              new_amount = new_amount - (new_amount * 0.05)

                        cursor.execute('''
                              UPDATE area_revenue SET
                                    check_in = %s,
                                    check_out = %s,
                                    premium = %s,
                                    standard = %s,
                                    garden = %s,
                                    barkada = %s,
                                    cabana = %s,
                                    big = %s,
                                    small = %s,
                                    pavillion = %s,
                                    mariposa = %s,
                                    minicon = %s,
                                    total = %s
                              WHERE booking_id = %s
                              ''', (
                              new_checkin,
                              new_checkout,
                              new_area_revenue["premium"],
                              new_area_revenue["standard"],
                              new_area_revenue["garden"],
                              new_area_revenue["barkada"],
                              new_area_revenue["cabana"],
                              new_area_revenue["big"],
                              new_area_revenue["small"],
                              new_area_revenue["pavillion"],
                              new_area_revenue["mariposa"],
                              new_area_revenue["minicon"],
                              total,
                              id  # WHERE condition comes last
                        ))

                        cursor.execute(''' UPDATE bookings SET check_in = %s, check_out = %s, total_amount = %s WHERE booking_id = %s ''', 
                        (edit_checkin, edit_checkout, new_amount, id))

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

                        # Compute start and end dates for the month
                        start_month = date(int(year), int(month), 1)
                        if int(month) == 12:
                              end_month = date(int(year) + 1, 1, 1)
                        else:
                              end_month = date(int(year), int(month) + 1, 1)

                        cursor.execute("""
                        WITH c_checkin AS (
                              SELECT COUNT(*) AS total_checkin
                              FROM bookings
                              WHERE check_in >= %s AND check_in <= %s
                              AND status = 'Checked-in'
                        ),
                        c_reserved AS (
                              SELECT COUNT(*) AS total_reserved
                              FROM bookings
                              WHERE check_in >= %s AND check_in <= %s
                              AND status = 'Reserved'
                        ),
                        c_checkout AS (
                              SELECT COUNT(*) AS total_checkout
                              FROM bookings
                              WHERE check_out >= %s AND check_out <= %s
                              AND status = 'Checked-out'
                        ),
                        c_paid AS (
                              SELECT COUNT(*) AS total_paid
                              FROM bookings
                              WHERE check_in >= %s AND check_in <= %s
                              AND payment NOT IN ('Refunded', 'Pending')
                        ),
                        c_dayguest AS (
                              SELECT COUNT(*) AS total_dayguest
                              FROM bookings
                              WHERE check_in >= %s AND check_in <= %s
                              AND booking_type = 'Day Guest'
                        ),
                        c_not_paid AS (
                              SELECT COUNT(*) AS total_npaid
                              FROM bookings
                              WHERE check_in >= %s AND check_in <= %s
                              AND status <> 'Reserved'
                              AND payment = 'Pending'
                        ),
                        c_cancelled AS (
                              SELECT COUNT(*) AS total_cancel
                              FROM bookings
                              WHERE check_in >= %s AND check_in <= %s
                              AND status = 'Cancelled'
                        ),
                        c_all AS (
                              SELECT COUNT(*) AS total_all
                              FROM bookings
                              WHERE check_in >= %s AND check_in <= %s
                        )
                        SELECT 
                              ci.total_checkin,
                              r.total_reserved,
                              dg.total_dayguest,
                              co.total_checkout,
                              p.total_paid,
                              np.total_npaid,
                              cn.total_cancel,
                              a.total_all
                        FROM c_checkin ci,
                              c_reserved r,
                              c_dayguest dg,
                              c_checkout co,
                              c_paid p,
                              c_not_paid np,
                              c_cancelled cn,
                              c_all a;
                        """, (start_month, end_month) * 8)  # repeat start/end 9 times for placeholders

                        data = cursor.fetchone()
                        return {
                        'success': bool(data),
                        'checkin': data.get('total_checkin'),
                        'cancelled': data.get('total_cancel'),
                        'checkout': data.get('total_checkout'),
                        'reserved': data.get('total_reserved'),
                        'paid': data.get('total_paid'),
                        'not_paid': data.get('total_npaid'),
                        'day_guest': data.get('total_dayguest'),
                        'all': data.get('total_all')
                        }

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Failed: {e}'}

      def search_guest(self, guest_name, year, month, category):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # Compute first and last day of the month
                        start_date = date(int(year), int(month), 1)
                        if int(month) == 12:
                              end_date = date(int(year) + 1, 1, 1)
                        else:
                              end_date = date(int(year), int(month) + 1, 1)

                        # Base query with range (index-friendly)
                        sql = """
                        SELECT * FROM bookings 
                        WHERE name LIKE %s COLLATE utf8mb4_general_ci
                              AND check_in >= %s
                              AND check_in <= %s
                        """
                        params = [guest_name + "%", start_date, end_date]

                        # Add category filters
                        if category != 'all-data':
                              if category == 'check_out-data':
                                    sql += ' AND status = "Checked-out"'
                              elif category == 'check_in-data':
                                    sql += ' AND status = "Checked-in"'
                              elif category == 'reserved-data':
                                    sql += ' AND status = "Reserved"'
                              elif category == 'cancelled-reservation-data':
                                    sql += ' AND status = "Cancelled"'
                              elif category == 'paid-data':
                                    sql += ' AND payment != "Pending"'
                              elif category == 'not_paid-data':
                                    sql += ' AND payment = "Pending"'
                              elif category == 'day_guest':
                                    sql += ' AND booking_type = "Day Guest"'

                        # Always order by check_in descending
                        sql += ' ORDER BY check_in DESC'

                        cursor.execute(sql, params)
                        data = cursor.fetchall()

                        new_data = []
                        for d in data: 
                              formatted_checkin  = d.get('check_in').strftime("%b %d").lstrip("0")  
                              formatted_checkout = d.get('check_out').strftime("%b %d").lstrip("0")    
                              formatted_date     = d.get('date_book').strftime("%b %d").lstrip("0") if d.get('date_book') else '--'

                              new_data.append({
                                    'id': d.get('booking_id'),
                                    'name': d.get('name'),
                                    'date_book': formatted_date,
                                    'checkin': formatted_checkin,
                                    'checkout': formatted_checkout,
                                    'accomodations': d.get('accomodations'),
                                    'booking_type': d.get('booking_type'),
                                    'status': d.get('status'),
                                    'stay': d.get('stay_gap'),
                                    'payment': d.get('payment')
                              })

                        return {'success': bool(new_data), 'data': new_data}

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Search failed: {e}'}

      def accomodation_data(self, query):
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute('SELECT rate from accomodation_spaces where name = %s ', (query.strip(),))
                  data = cursor.fetchone()

                  return data.get('rate')
