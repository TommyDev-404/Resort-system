from datetime import date, datetime
from .all_reservation import Reservation

class RevenueMgmt:
      def __init__(self, db):
            self.db = db
            self.reservation_model = Reservation(db)

      def apply_promo2(self, dates, promo_name, duration, promo_rate, areas_promo):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        
                        areas = areas_promo.split(',')
                        promotions = f"{promo_name} - {promo_rate}%"
                        discount = int(promo_rate)/100

                        converted_date = datetime.strptime(dates, "%Y-%m-%d").date()
                        if converted_date <= date.today():
                              cursor.execute(''' INSERT INTO promos(date, name, discount, area, end_date, status) VALUES(%s, %s, %s, %s, %s, %s)''', (dates, promotions, promo_rate, areas_promo, duration, 'Active'))

                              for area in areas:
                                    cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = rate * (1 - %s) WHERE name = %s ''', 
                                    (promotions, discount, area.split(' ')[0].strip()))
                                    con.commit()

                              cursor.execute(''' SELECT * FROM bookings WHERE check_in >= %s AND promo = %s''', (dates, 'No promo.'))
                              booking_data = cursor.fetchall()

                              for data in booking_data:
                                    accomodations = data.get('accomodations').split(',')
                                    id = data.get('booking_id')
                                    print(id)
                                    print(data)
                                    area_under_promo = []
                                    for area in accomodations:
                                          name = area.split(' ')[0].strip()

                                          if name in areas:
                                                area_under_promo.append(area)
                                    
                                    if len(area_under_promo) > 0:
                                          cursor.execute(''' UPDATE bookings SET  promo  = %s, promo_area = %s WHERE booking_id = %s ''', 
                                          (f'{promotions} discount', ','.join(area_under_promo), id))
                                          con.commit()
                                    
                                    self.reservation_model.update_reservation_date(id, str(data.get('check_in')), str(data.get('check_out')))
                        else:
                              cursor.execute(''' INSERT INTO promos(date, name, discount, area, end_date, status) VALUES(%s, %s, %s, %s, %s, %s)''', (dates, promotions, promo_rate, areas_promo, duration, 'Upcoming'))
                              
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': "Promotions applied successfully" if bool(cursor.rowcount != 0) else "Failed to apply promotions."}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def apply_promo(self, dates, promo_name, duration, promo_rate, areas_promo):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        promo_start = datetime.strptime(dates, "%Y-%m-%d").date()
                        discount = float(promo_rate) / 100
                        areas = [a.strip() for a in areas_promo.split(',')]
                        promo_label = f"{promo_name} - {promo_rate}%"

                        status = 'Active' if promo_start <= date.today() else 'Upcoming'

                        # 1️⃣ Insert promo
                        cursor.execute('''
                              INSERT INTO promos(date, name, discount, area, end_date, status)
                              VALUES (%s, %s, %s, %s, %s, %s)
                        ''', (dates, promo_label, promo_rate, areas_promo, duration, status))

                        # 2️⃣ Update accommodation prices (FROM BASE RATE)
                        cursor.execute(f'''
                              UPDATE accomodation_spaces
                              SET promo = %s,
                              rate = orig_rate * (1 - %s)
                              WHERE name IN ({','.join(['%s'] * len(areas))})
                        ''', [promo_label, discount, *areas])

                        # 3️⃣ Find affected bookings
                        cursor.execute('''
                              SELECT booking_id, accomodations, check_in, check_out
                              FROM bookings
                              WHERE status NOT IN ('Checked-out', 'Cancelled')
                              AND check_out >= %s
                        ''', (promo_start,))

                        bookings = cursor.fetchall()

                        booking_areas  = []
                        for b in bookings:
                              for a in b['accomodations'].split(','):
                                    booking_areas.append(a.strip())

                        affected = []

                        for area in booking_areas:
                              area_name = area.split(' ')[0].strip()
                              if area_name in areas:
                                    affected.append(area)

                        if affected:
                              for ba in bookings:
                                    cursor.execute('''
                                          UPDATE bookings
                                          SET promo = %s,
                                          promo_area = %s
                                          WHERE booking_id = %s
                                    ''', (
                                          f"{promo_label} discount",
                                          ','.join([a for a in ba['accomodations'].split(',') if a.strip() in affected]),
                                          ba['booking_id']
                                    ))
                                    con.commit()

                                    # Recalculate booking totals safely
                                    self.reservation_model.update_reservation_date(
                                          ba['booking_id'],
                                          str(ba['check_in']),
                                          str(ba['check_out'])
                                    )

                        return {
                              'success': True,
                              'message': 'Promotion applied successfully'
                        }

            except Exception as e:
                  con.rollback()
                  return {
                        'success': False,
                        'message': f'Promo application failed: {e}'
                  }

      def get_promo_data(self, id=None):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        if id:
                              cursor.execute(f"SELECT * FROM promos WHERE id = {id} ORDER BY date DESC;")
                              promos = cursor.fetchone()
                        else:
                              cursor.execute("SELECT * FROM promos ORDER BY date DESC;")
                              promos = cursor.fetchall()

                        return {'success': bool(promos), 'data': promos}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def update_promo(self, id, dates, promo_name, duration, promo_rate, areas_promo, prev_area):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        
                        promo_start = datetime.strptime(dates, "%Y-%m-%d").date()
                        promo_end = datetime.strptime(duration, "%Y-%m-%d").date()
                        discount = float(promo_rate) / 100
                        areas = [a.strip() for a in areas_promo.split(',')]
                        promo_label = f"{promo_name} - {promo_rate}%"
                        prev_areas = prev_area.split(',')

                        for area in prev_areas:
                              cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = orig_rate WHERE name = %s ''', ("None", area))

                        status = None
                        if promo_start <= date.today():
                              status = 'Active'  if promo_end >= date.today() else  'Expired'
                        else:
                              status = 'Upcoming'

                        # 1️⃣ Update promo
                        cursor.execute(''' UPDATE promos SET date = %s, name = %s, discount = %s, area = %s, end_date = %s, status = %s WHERE id = %s''', (dates, promo_label, promo_rate, areas_promo, duration, status, id))
                        promo_updated = cursor.rowcount > 0

                        # 2️⃣ Update accommodation prices (FROM BASE RATE)
                        cursor.execute(f'''
                              UPDATE accomodation_spaces
                              SET promo = %s,
                              rate = orig_rate * (1 - %s)
                              WHERE name IN ({','.join(['%s'] * len(areas))})
                        ''', [promo_label, discount, *areas])

                        # 3️⃣ Find affected bookings
                        cursor.execute('''
                              SELECT booking_id, accomodations, check_in, check_out
                              FROM bookings
                              WHERE status NOT IN ('Checked-out', 'Cancelled')
                              AND check_out >= %s
                        ''', (promo_start,))

                        bookings = cursor.fetchall()

                        booking_areas  = []
                        for b in bookings:
                              for a in b['accomodations'].split(','):
                                    booking_areas.append(a.strip())

                        affected = []

                        for area in booking_areas:
                              area_name = area.split(' ')[0].strip()
                              if area_name in areas:
                                    affected.append(area)

                        if affected:
                              for ba in bookings:
                                    cursor.execute('''
                                          UPDATE bookings
                                          SET promo = %s,
                                          promo_area = %s
                                          WHERE booking_id = %s
                                    ''', (
                                          f"{promo_label} discount",
                                          ','.join([a for a in ba['accomodations'].split(',') if a.strip() in affected]),
                                          ba['booking_id']
                                    ))
                                    con.commit()

                                    # Recalculate booking totals safely
                                    self.reservation_model.update_reservation_date(
                                          ba['booking_id'],
                                          str(ba['check_in']),
                                          str(ba['check_out'])
                                    )

                        return {
                              'success': promo_updated,
                              'message': "Promotions updated successfully" if promo_updated else "No changes were made to the promotion."
                        }

            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def remove_promo(self, id, areas_promo):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        areas = areas_promo.split(', ')
                        
                        for area in areas:
                              cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = orig_rate WHERE name = %s ''', 
                              ('None', area.split(' ')[0]))
                              con.commit()

                              cursor.execute(''' SELECT * FROM promos WHERE id = %s''', (id,))
                              promo_data = cursor.fetchone()

                              cursor.execute(''' SELECT * FROM bookings WHERE check_out >= %s AND promo NOT IN ('No promo.') ''', (promo_data.get('date'),))
                              booking_data = cursor.fetchall()
                              print(booking_data)
                              
                              for data in booking_data:
                                    accomodations = data.get('accomodations').split(',')
                                    bid = data.get('booking_id')
                                    
                                    area_under_promo = []
                                    for are in accomodations:
                                          name = are.split(' ')[0].strip()
                                          promo_area = area.split(' ')[0].strip()

                                          if name in promo_area:
                                                area_under_promo.append(are)
                                    print(area_under_promo)
                                    if len(area_under_promo) > 0:
                                          cursor.execute(''' UPDATE bookings SET  promo  = %s, promo_area = %s WHERE booking_id = %s ''', 
                                          ('No promo.', 'No accomodations under promo.', bid))
                                          con.commit()

                                    self.reservation_model.update_reservation_date(bid, str(data.get('check_in')), str(data.get('check_out')))

                        cursor.execute(''' DELETE FROM promos WHERE id = %s''', (id))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': "Promotions remove successfully" if bool(cursor.rowcount != 0) else "Failed to remove promotions."}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def get_promo_area(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        cursor.execute("SELECT area FROM promos WHERE id = %s;", (id,))
                        promos = cursor.fetchone()
                        
                        return {'success': bool(promos), 'data': promos.get('area')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      