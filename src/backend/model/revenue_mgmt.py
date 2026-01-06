from datetime import date, datetime
from backend.extensions import cache

class RevenueMgmt:
      def __init__(self, db, alert, reserve):
            self.db = db
            self.alert = alert
            self.reservation_model = reserve

      def apply_promo(self, dates, promo_name, duration, promo_rate, areas_promo):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        promo_start = datetime.strptime(dates, "%Y-%m-%d").date()
                        promo_end = datetime.strptime(duration, "%Y-%m-%d").date()
                        discount = float(promo_rate) / 100
                        areas = [a.strip() for a in areas_promo.split(',')]
                        promo_label = f"{promo_name} - {promo_rate}%"

                        status = 'Expired' if promo_end < date.today() else 'Active'

                        new_areas = []
                        for area in areas:
                              if area == 'Hall':
                                    new_areas.append('Pavillion')
                                    new_areas.append('Mariposa')
                                    new_areas.append('Minicon')
                              else:
                                    new_areas.append(area)

                        # 1️⃣ Insert promo
                        cursor.execute('''
                              INSERT INTO promos(date, name, discount, area, end_date, status)
                              VALUES (%s, %s, %s, %s, %s, %s)
                        ''', (dates, promo_label, promo_rate, ",".join(new_areas), duration, status))

                        if promo_end > date.today():
                              # Apply promo
                              cursor.execute(f'''
                                    UPDATE accomodation_spaces
                                    SET promo = %s,
                                    rate = orig_rate * (1 - %s)
                                    WHERE name IN ({','.join(['%s'] * len(new_areas))})
                              ''', [promo_label, discount, *new_areas])
                        else:
                              # reset price to orig rate
                              cursor.execute(f'''
                                    UPDATE accomodation_spaces
                                    SET promo = %s,
                                    rate = orig_rate 
                                    WHERE name IN ({','.join(['%s'] * len(new_areas))})
                              ''', ['None', *new_areas])

                        con.commit()

                        # 3️⃣ Find affected bookings
                        cursor.execute('''
                              SELECT booking_id, accomodations, check_in, check_out, booking_type
                              FROM bookings
                              WHERE status NOT IN ('Cancelled')
                              AND check_out > %s
                        ''', (promo_start))
                        bookings = cursor.fetchall()

                        if bookings:
                              booking_areas  = []    
                              for b in bookings:
                                    for a in b['accomodations'].split(','):
                                          booking_areas.append(a.strip())

                              affected = []
                              for area in booking_areas:
                                    area_name = area.split(' ')[0].strip()
                                    if area_name in new_areas:
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
                                                str(ba['check_out']), 
                                                ba.get('booking_type')
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
                              cursor.execute(f"SELECT * FROM promos WHERE id = {id} ORDER BY end_date DESC;")
                              promos = cursor.fetchone()
                        else:
                              cursor.execute("SELECT * FROM promos ORDER BY end_date DESC;")
                              promos = cursor.fetchall()

                        result = {'success': bool(promos), 'data': promos}

                        return result
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

                        new_prev_areas = []
                        for area in prev_areas:
                              if area == 'Hall':
                                    new_prev_areas.append('Pavillion')
                                    new_prev_areas.append('Mariposa')
                                    new_prev_areas.append('Minicon')
                              else:
                                    new_prev_areas.append(area)
                                    
                        for area in new_prev_areas:
                              cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = orig_rate WHERE name = %s ''', ("None", area))

                        status = 'Active'  if promo_end >= date.today() else  'Expired'

                        new_areas = []
                        for area in areas:
                              if area == 'Hall':
                                    new_areas.append('Pavillion')
                                    new_areas.append('Mariposa')
                                    new_areas.append('Minicon')
                              else:
                                    new_areas.append(area)

                        # 1️⃣ Update promo
                        cursor.execute(''' UPDATE promos SET date = %s, name = %s, discount = %s, area = %s, end_date = %s, status = %s WHERE id = %s''', (dates, promo_label, promo_rate, ",".join(new_areas), duration, status, id))
                        promo_updated = cursor.rowcount > 0

                        # 2️⃣ Update accommodation prices (FROM BASE RATE)
                        cursor.execute(f'''
                              UPDATE accomodation_spaces
                              SET promo = %s,
                              rate = orig_rate * (1 - %s)
                              WHERE name IN ({','.join(['%s'] * len(new_areas))})
                        ''', [promo_label, discount, *new_areas])

                        con.commit()

                        # 3️⃣ Find affected bookings
                        cursor.execute('''
                              SELECT booking_id, accomodations, check_in, check_out, booking_type
                              FROM bookings
                              WHERE status NOT IN ('Cancelled')
                              AND check_out >= %s
                        ''', (promo_start))
                        bookings = cursor.fetchall()

                        booking_areas  = []
                        for b in bookings:
                              for a in b['accomodations'].split(','):
                                    booking_areas.append(a.strip())

                        for b in bookings:
                              cursor.execute(''' UPDATE bookings SET  promo  = %s, promo_area = %s WHERE booking_id = %s ''', ('No promo.', 'No accomodations under promo.', b['booking_id']))
                        con.commit()

                        affected = []
                        for area in booking_areas:
                              area_name = area.split(' ')[0].strip()
                              if area_name in new_areas:
                                    affected.append(area)
                                    
                        if affected:
                              for ba in bookings:
                                    if ba['check_out'] > promo_start:
                                          area = [a.strip() for a in ba['accomodations'].split(',')]
                                          if any(a in affected for a in area):

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
                                          str(ba['check_out']),
                                          ba['booking_type']
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

                        cursor.execute(''' SELECT date, end_date FROM promos WHERE id = %s''', (id,))
                        promo_data = cursor.fetchone()

                        if promo_data.get('end_date') >= date.today():
                              for area in areas:
                                    areas_list = area.split(',')  # ['Premium', 'Standard']
                                    placeholders = ','.join(['%s'] * len(areas_list))

                                    query = f'''
                                          UPDATE accomodation_spaces
                                          SET promo = %s, rate = orig_rate
                                          WHERE name IN ({placeholders})
                                    '''
                                    cursor.execute(query, ['None', *areas_list])
                                    con.commit()

                                    cursor.execute(''' SELECT booking_id, accomodations, check_in, check_out, booking_type FROM bookings WHERE check_out >= %s ''', (promo_data.get('date'),))
                                    booking_data = cursor.fetchall()

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
                                                print('here')
                                                cursor.execute(''' UPDATE bookings SET  promo  = %s, promo_area = %s WHERE booking_id = %s ''', 
                                                ('No promo.', 'No accomodations under promo.', bid))
                                                con.commit()

                                          self.reservation_model.update_reservation_date(bid, str(data.get('check_in')), str(data.get('check_out')), data.get('booking_type'))
                        else:
                              print('promo not today')
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
      