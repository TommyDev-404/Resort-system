

class RevenueMgmt:
      def __init__(self, db):
            self.db = db

      def apply_promo(self, date, promo_name, duration, promo_rate, areas_promo):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        
                        areas = areas_promo.split(',')
                        promotions = f"{promo_name} - {promo_rate}%"
                        discount = int(promo_rate)/100

                        cursor.execute(''' INSERT INTO promos(date, name, discount, area, end_date, status) VALUES(%s, %s, %s, %s, %s, %s)''', (date, promotions, discount, areas_promo, duration, 'Active'))

                        for area in areas:
                              cursor.execute(''' UPDATE accomodation_spaces SET promo = %s, rate = rate * (1 - %s) WHERE name = %s ''', 
                              (promotions, discount, area))

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
      