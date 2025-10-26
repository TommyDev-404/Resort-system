from collections import Counter
from datetime import date

class Housekeeping:
      def __init__(self, db):
            self.db = db
      
      def total_area_data(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT 
                                    name,
                                    COUNT(name) as total_room,
                                    SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied,
                                    SUM(CASE WHEN status = 'need-clean' THEN 1 ELSE 0 END) AS need_clean,
                                    SUM(CASE WHEN status = 'avl' THEN 1 ELSE 0 END) AS ready,
                                    SUM(CASE WHEN status = 'on-clean' THEN 1 ELSE 0 END) AS on_clean,
                                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance
                              FROM accomodation_spaces WHERE name = 'Premium' OR name = 'Standard' OR name = 'Garden' OR name = 'Barkada'  OR name = 'Family'
                              GROUP BY name;
                        ''')
                        data = cursor.fetchall()

                  return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def total_data(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT 
                                    COUNT(*) AS total_rooms,
                                    SUM(CASE WHEN status = 'need-clean' THEN 1 ELSE 0 END) AS total_need_clean,
                                    SUM(CASE WHEN status = 'avl' THEN 1 ELSE 0 END) AS total_ready,
                                    SUM(CASE WHEN status = 'on-clean' THEN 1 ELSE 0 END) AS total_on_clean,
                                    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS total_maintenance,
                                    SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS total_occupied
                              FROM accomodation_spaces WHERE name = 'Premium' OR name = 'Standard' OR name = 'Garden' OR name = 'Barkada'  OR name = 'Family';
                        ''')
                        data = cursor.fetchone()

                        return {'total_room': data.get('total_rooms'), 'occupied': data.get('total_occupied'),'need_clean': data.get('total_need_clean'), 'ready': data.get('total_ready'), 'on_clean': data.get('total_on_clean'), 'maintenance': data.get('total_maintenance')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def get_area_data(self, accomodation):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT *  FROM accomodation_spaces WHERE name = %s
                        ''', (accomodation))
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def assign_cleaner(self, area_name, room_no, name, date):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE accomodation_spaces SET status = 'on-clean', staff_assign = %s, date = %s WHERE name = %s AND room = %s
                        ''', (name, date, area_name, room_no))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Assigned successfully!' if bool(cursor.rowcount ) else 'Failed inserting data!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def reassign_cleaner(self, name, role, date, room_no, area_name):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE accomodation_spaces SET staff_assign = %s, date = %s WHERE name = %s AND room = %s
                        ''', (name, role, date, area_name, room_no))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Re-assigned successfully!' if bool(cursor.rowcount ) else 'Failed inserting data!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def update_room_condition(self, room_no, area_name):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE accomodation_spaces SET status = 'avl' WHERE name = %s AND room = %s
                        ''', (area_name, room_no))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if bool(cursor.rowcount ) else 'Failed inserting data!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}