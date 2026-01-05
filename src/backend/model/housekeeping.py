from collections import Counter
from datetime import date, datetime
from backend.extensions import cache

class Housekeeping:
      def __init__(self, db, alert):
            self.db = db
            self.alert = alert

      def total_area_data(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              SELECT 
                                    name,
                                    COUNT(name) as total_room,
                                    SUM(CASE WHEN status IN ("occupied") THEN 1 ELSE 0 END) AS occupied,
                                    SUM(CASE WHEN status IN ("need-clean") THEN 1 ELSE 0 END) AS need_clean,
                                    SUM(CASE WHEN status IN ("avl") THEN 1 ELSE 0 END) AS ready,
                                    SUM(CASE WHEN status IN ("on-clean") THEN 1 ELSE 0 END) AS on_clean,
                                    SUM(CASE WHEN status IN ("reserved") THEN 1 ELSE 0 END) AS reserved
                              FROM accomodation_spaces WHERE name IN ("Premium", "Standard", "Garden", "Barkada", "Small", "Big", "Cabana", "Pavillion", "Mariposa", "Minicon")
                              GROUP BY name 
                              ORDER BY
                                    CASE
                                          -- ROOMS
                                          WHEN name IN ('Premium', 'Standard', 'Garden', 'Barkada') THEN 1
                                          -- COTTAGES
                                          WHEN name IN ('Small', 'Big', 'Cabana') THEN 2
                                          -- HALLS
                                          WHEN name IN ('Pavillion',  'Mariposa', 'Minicon') THEN 3
                                          ELSE 4
                                    END,
                              name;
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
                                    COUNT(name) AS total_rooms,
                                    SUM(CASE WHEN status IN ('need-clean') THEN 1 ELSE 0 END) AS total_need_clean,
                                    SUM(CASE WHEN status IN ('avl') THEN 1 ELSE 0 END) AS total_ready,
                                    SUM(CASE WHEN status IN ('on-clean') THEN 1 ELSE 0 END) AS total_on_clean,
                                    SUM(CASE WHEN status IN ('reserved') THEN 1 ELSE 0 END) AS reserved,
                                    SUM(CASE WHEN status IN ('occupied') THEN 1 ELSE 0 END) AS total_occupied
                              FROM accomodation_spaces WHERE name IN ('Premium', 'Standard', 'Garden', 'Barkada', "Small", "Big", "Cabana", "Pavillion", "Mariposa", "Minicon");
                        ''')
                        data = cursor.fetchone()

                        return {'total_room': data.get('total_rooms'), 'occupied': data.get('total_occupied'),'need_clean': data.get('total_need_clean'), 'ready': data.get('total_ready'), 'on_clean': data.get('total_on_clean'), 'reserved': data.get('reserved')}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def get_area_data(self, accomodation):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        area = accomodation.split(' ')[0]

                        cursor.execute('''
                              SELECT room, status  FROM accomodation_spaces WHERE name = %s
                        ''', (area))
                        data = cursor.fetchall()

                        result = {'success': bool(data), 'data': data}

                        return result
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def assign_cleaner(self, area_name, room_no, name, date):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        cursor.execute('''
                              UPDATE accomodation_spaces SET status = %s WHERE name = %s AND room = %s
                        ''', ('on-clean', area_name.split(' ')[0], room_no))
      
                        room = f'''{area_name}{room_no}'''
                        cursor.execute('''
                              INSERT INTO room_assign_history(name, date, room, status) VALUES(%s, %s, %s, %s)
                        ''', (name, date, room, 'on-clean'))
            
                        cursor.execute('''
                              DELETE FROM notifications WHERE room_name = %s AND room_no = %s
                        ''', (area_name.split(' ')[0].lower(), room_no))
                        
                        con.commit()

                        return {'success': bool(cursor.rowcount > 0), 'message': 'Assigned successfully!' if bool(cursor.rowcount > 0) else 'Failed inserting data!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def update_room_condition(self, room_no, area_name):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE accomodation_spaces SET status = %s WHERE name = %s AND room = %s
                        ''', ('avl', area_name.split(' ')[0], room_no))
                        
                        room = f'''{area_name} {room_no}'''
                        cursor.execute(''' UPDATE room_assign_history SET status = %s WHERE room = %s ''', ('avl', room))

                        con.commit()
                        
                        return {'success': bool(cursor.rowcount > 0), 'message': 'Marked ready successfully!' if bool(cursor.rowcount > 0) else 'Failed inserting data!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def staff_cleaners(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              SELECT staff_name
                              FROM staff_details st
                              JOIN staff_attendance sa
                              ON st.id = sa.staff_id 
                              WHERE st.job_position NOT IN ('Front Desk', 'Security Guard') AND sa.date = CURRENT_DATE()
                              AND sa.status NOT IN ('Absent')
                        ''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def room_assigned_history(self, room):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        cursor.execute(''' SELECT date, name FROM room_assign_history WHERE room = %s ORDER BY date DESC''', (room,))
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            from datetime import date

      def cleaning_history(self, month, day):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        target_date = date(date.today().year, int(month), int(day))

                        cursor.execute('''
                        SELECT * 
                        FROM room_assign_history 
                        WHERE date = %s
                        ''', (target_date,))
                        
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Query failed: {e}'}

            cache.delete('total_area_data')
            cache.delete('total_data')
            cache.delete('staff_cleaners')
            key_index = cache.get("cleaning_history_keys") or set()
            for key in key_index:
                  cache.delete(key)

            key_index2 = cache.get("room_assigned_history_keys") or set()
            for key in key_index2:
                  cache.delete(key)

            key_index3 = cache.get("area_data_keys") or set()
            for key in key_index3:
                  cache.delete(key)