

class Staff_Management: 
      def __init__(self, db):
            self.db = db

      def add_staff(self, role, name, salary, avl_leave, date_started):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' INSERT INTO staff_details(staff_name, date_started, wage, role, avl_leave) VALUES(%s, %s, %s, %s, %s) ''', (name, date_started, salary, role, avl_leave ))

                        cursor.execute(' SELECT id FROM staff_details where staff_name = %s', (name, ))
                        data = cursor.fetchone()
                        id = data.get('id')

                        cursor.execute(''' INSERT INTO staff_salary(staff_id, name, workdays, absent, salary) VALUES(%s, %s, %s, %s, %s) ''', (id, name, 0, 0, 0))
                        
                        con.commit()

                        return {'success': True, 'message': 'Added successfully!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def update_staff(self, id, role, name, salary, avl_leave, date_started):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE staff_details set staff_name = %s, date_started = %s, wage = %s, role = %s, avl_leave = %s  WHERE id = %s
                        ''', (name, date_started, salary, role, avl_leave, id))

                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if bool(cursor.rowcount != 0) else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def update_staff_salary(self, id, name, absences, workdays, salary):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE staff_salary set name = %s, workdays = %s, absent = %s, salary = %s  WHERE id = %s
                        ''', (name, absences, workdays, salary, id))

                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if bool(cursor.rowcount != 0) else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def update_staff_attendance(self, id, staff_id, name, date, label):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE staff_attendance set staff_id = %s,  name = %s,  date = %s, label = %s  WHERE id = %s
                        ''', (staff_id, name, date, label, id))

                        if label == "Half-day":
                              cursor.execute('''
                                    UPDATE staff_salary set salary  WHERE id = %s
                              ''', (staff_id, name, date, label, id))
                              
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if bool(cursor.rowcount != 0) else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

 def add_staff_attendance(self, attendance_data):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # Loop through each staff in the list
                        for staff in attendance_data:
                              staff_id = staff.get('id')
                              name = staff.get('name')
                              time_in = datetime.strptime(staff.get('time_in'), '%H:%M').time() if staff.get('time_in')else None
                              status = staff.get('status')
                              date = staff.get('date')

                              if status == None: return {'success': False, 'message': 'Status empty!'}

                              # Validate time_in
                              halfday_threshold = datetime.strptime('13:00', '%H:%M').time()
                              if status != 'Absent':
                                    if time_in and time_in >= halfday_threshold:
                                          new_status = "Present (Half Day)"
                                          work_value = 0.5
                                    else:
                                          new_status = "Present (Whole Day)"
                                          work_value = 1.0

                                    # Insert attendance
                                    cursor.execute('''
                                          INSERT INTO staff_attendance (staff_id, name, time_in, time_out, date, status)
                                          VALUES (%s, %s, %s, %s, %s, %s)
                                    ''', (staff_id, name, time_in.strftime("%I:%M %p") if time_in else None, '--', date, new_status))

                                    # Update staff salary/workdays
                                    cursor.execute(f'''
                                          UPDATE staff_details 
                                          SET 
                                          workdays = workdays + %s,
                                          weekly_salary = weekly_salary + (daily_salary * %s),
                                          monthly_salary = monthly_salary + (daily_salary * %s)
                                          WHERE id = %s
                                    ''', (work_value, work_value, work_value, staff_id))
                              else:
                                    # Absent case
                                    cursor.execute('''
                                          INSERT INTO staff_attendance (staff_id, name, time_in, time_out, date, status)
                                          VALUES (%s, %s, %s, %s, %s, %s)
                                    ''', (staff_id, name, '--', '--', date, status))

                                    cursor.execute('''
                                          UPDATE staff_details SET absent = absent + 1 WHERE id = %s
                                    ''', (staff_id,))

                        con.commit()
                        return {'success': True, 'message': 'Added successfully!'}
            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Failed: {e}'}
            

      def all_staff(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_details''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def remove_staff(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' DELETE FROM staff_details WHERE id = %s''', (id,))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Removed successfully!' if bool(cursor.rowcount != 0) else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def remove_staff_attendance(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' DELETE FROM staff_attendance WHERE id = %s''', (id,))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Removed successfully!' if bool(cursor.rowcount != 0) else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def add_staff_attendance(self, staffs, attendance_date):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        # Loop through each staff in the list
                        for staff in staffs:
                              staff_id = staff.get('id')
                              name = staff.get('name')
                              label = staff.get('label')

                              # Insert into attendance table
                              cursor.execute('''
                                    INSERT INTO staff_attendance (staff_id, name, date, label) VALUES (%s, %s, %s, %s)
                              ''', (staff_id, name, attendance_date, label))

                              # Update staff status
                              cursor.execute(''' UPDATE staff_details SET status = %s WHERE id = %s ''', ('in', staff_id))
                              
                              # Update staff salary
                              cursor.execute('''
                                    UPDATE staff_salary AS s
                                    JOIN staff_details AS d ON s.staff_id = d.id
                                    SET 
                                          s.workdays = s.workdays + 1,
                                          s.salary = s.salary + d.wage 
                                    WHERE s.staff_id = %s
                              ''', (staff_id,))

                        con.commit()
                        return {'success': True, 'message': 'Added successfully!'}

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Failed: {e}'}

      def all_staff_list(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_details WHERE status = 'out' ''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def all_staff_attendance(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_attendance WHERE date = CURRENT_DATE()''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def all_staff_salary(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_salary''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            