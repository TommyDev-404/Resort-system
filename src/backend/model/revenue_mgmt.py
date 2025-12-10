from datetime import date, datetime

class RevenueMgmt:
      def __init__(self, db):
            self.db = db

      def apply_promo(self, dates, promo_name, duration, promo_rate, areas_promo):
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
                        else:
                              cursor.execute(''' INSERT INTO promos(date, name, discount, area, end_date, status) VALUES(%s, %s, %s, %s, %s, %s)''', (dates, promotions, promo_rate, areas_promo, duration, 'Upcoming'))
                              
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': "Promotions applied successfully" if bool(cursor.rowcount != 0) else "Failed to apply promotions."}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def get_promo_data(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        cursor.execute("SELECT * FROM promos ORDER BY date DESC;")
                        promos = cursor.fetchall()

                        return {'success': bool(promos), 'data': promos}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def update_promo(self, id, dates, promo_name, duration, promo_rate, areas_promo, prev_area):
            print(prev_area)
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        
                        areas = areas_promo.split(',')
                        prev_areas = prev_area.split(',')
                        promotions = f"{promo_name} - {promo_rate}%"
                        discount = int(promo_rate)/100

                        for area in prev_areas:
                              cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = orig_rate WHERE name = %s ''', 
                              ("None", area))
                              con.commit()

                        converted_date = datetime.strptime(dates, "%Y-%m-%d").date()
                        converted_end_date = datetime.strptime(duration, "%Y-%m-%d").date()
                        if converted_date <= date.today():
                              if converted_end_date >= date.today():
                                    cursor.execute(''' UPDATE promos SET date = %s, name = %s, discount = %s, area = %s, end_date = %s, status = %s WHERE id = %s''', (dates, promotions, promo_rate, areas_promo, duration, 'Active', id))

                                    for area in areas:
                                          cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = rate * (1 - %s) WHERE name = %s ''', 
                                          (promotions, discount, area.split(' ')[0].strip()))
                              else:
                                    cursor.execute(''' UPDATE promos SET date = %s, name = %s, discount = %s, area = %s, end_date = %s, status = %s WHERE id = %s''', (dates, promotions, promo_rate, areas_promo, duration, 'Expired', id))
                        else:
                              cursor.execute(''' UPDATE promos SET date = %s, name = %s, discount = %s, area = %s, end_date = %s, status = %s WHERE id = %s''', (dates, promotions, promo_rate, areas_promo, duration, 'Upcoming', id))
                        
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': "Promotions updated successfully" if bool(cursor.rowcount != 0) else "Failed to apply promotions."}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def remove_promo(self, id, areas_promo):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        areas = areas_promo.split(', ')
                        
                        cursor.execute(''' DELETE FROM promos WHERE id = %s''', (id))
                        con.commit()
                        for area in areas:
                              cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = orig_rate WHERE name = %s ''', 
                              ('None', area.split(' ')[0]))
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
      