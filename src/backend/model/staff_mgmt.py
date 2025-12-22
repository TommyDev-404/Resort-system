from datetime import datetime
from datetime import date, timedelta

class Staff_Management: 
      def __init__(self, db):
            self.db = db

      def add_staff(self, staff_name, date_started, daily_salary, position, avl_leave, status):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        weekly = int(daily_salary) * 7
                        monthly = int(daily_salary) * 25

                        cursor.execute(''' 
                              INSERT INTO staff_details(staff_name, date_started, daily_salary, weekly_salary, monthly_salary, estimate_weekly, estimate_month, job_position, avl_leave, status, workdays, absent, reset_date)
                              VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ''', 
                        (staff_name, date_started, daily_salary, 0, 0,  weekly, monthly, position, avl_leave, status, 0, 0, date.today()))
                        
                        con.commit()

                        return {'success': True, 'message': 'Added successfully!'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def update_staff(self, staff_id, staff_name, position, daily_salary, avl_leave, date_started, status):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              UPDATE staff_details set staff_name = %s, date_started = %s, daily_salary = %s, estimate_weekly = daily_salary * 7, estimate_month = daily_salary * 25, job_position = %s, avl_leave = %s, status = %s WHERE id = %s
                        ''', (staff_name, date_started, daily_salary, position, avl_leave, status, staff_id))

                        if status == 'On Leave':
                              cursor.execute(''' INSERT INTO staff_leaves_data (staff_id, name, position, date) VALUES (%s, %s, %s, %s) ''', (staff_id, staff_name, position, date.today()))
                        
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if bool(cursor.rowcount != 0) else 'Failed! Either data not changed or something went wrong.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def all_staff(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_details ORDER BY FIELD(job_position, 'Front Desk', 'Security Guard',  'Maintenance', 'Janitor')''')
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def staff_list(self, day, month):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        target_date = date(date.today().year, month, day)
                        next_date = target_date + timedelta(days=1)
                        print(target_date, next_date)
                        query = """
                        SELECT *
                        FROM staff_details sd
                        WHERE sd.id NOT IN (
                        SELECT sa.staff_id
                        FROM staff_attendance sa
                        WHERE sa.date >= %s
                              AND sa.date < %s
                              AND sa.status <> 'On Leave'
                        )
                        """

                        cursor.execute(query, (target_date, next_date))
                        data = cursor.fetchall()
                        
                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def view_staff_info(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_details WHERE id = %s''', (id,))
                        data = cursor.fetchone()

                        return {'success': bool(data), 'data': data}
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
                              dates = datetime.strptime(staff.get('date'), '%Y-%m-%d').date()

                              if status != 'Absent':
                                    cursor.execute('''
                                          INSERT INTO staff_attendance (staff_id, name, time_in, time_out, date, status)
                                          VALUES (%s, %s, %s, %s, %s, %s)
                                    ''', (staff_id, name, time_in.strftime("%I:%M %p") if time_in else None, '--', dates, "--"))

                                    if dates == date.today():
                                          cursor.execute('''
                                                UPDATE staff_details SET status = %s WHERE id = %s
                                          ''', ('Active', staff_id))
                              else:
                                    # Absent case
                                    cursor.execute('''
                                          INSERT INTO staff_attendance (staff_id, name, time_in, time_out, date, status)
                                          VALUES (%s, %s, %s, %s, %s, %s)
                                    ''', (staff_id, name, '--', '--', dates, status))

                                    if dates == date.today():
                                          cursor.execute(''' UPDATE staff_details SET status = %s, absent = absent + 1 WHERE id = %s ''', (status, staff_id))
                                    else:
                                          cursor.execute(''' UPDATE staff_details SET absent = absent + 1 WHERE id = %s ''', (staff_id,))

                        con.commit()
                        return {'success': True, 'message': 'Added successfully!'}
            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Failed: {e}'}
            
      def update_staff_attendance(self, updated_data):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        for data in updated_data:
                              new_time_out = datetime.strptime(data.get('time_out'), '%H:%M').time() if data.get('time_out') else None
                              new_time_in = datetime.strptime(data.get('time_in'), '%H:%M').time() if data.get('time_in') else None
                              dates = datetime.strptime(data.get('date'), '%a, %d %b %Y %H:%M:%S %Z').date()

                              morning_in = datetime.strptime('08:00', '%H:%M').time()
                              afternoon_in= datetime.strptime('13:00', '%H:%M').time()
                              morning_out = datetime.strptime('12:00', '%H:%M').time()
                              afternoon_out = datetime.strptime('16:30', '%H:%M').time()

                              if new_time_in <= morning_in:
                                    if new_time_out == afternoon_out:
                                          new_status = "Present (Whole Day)"
                                          work_value = 1.0
                                    elif new_time_out >= morning_out and new_time_out < afternoon_in:
                                          new_status = "Present (Half Day)"
                                          work_value = 0.5
                                    elif new_time_out > afternoon_out:
                                          new_status = 'Present (Overtime)'
                                          gap = datetime.combine(date.today(), new_time_out) - datetime.combine(date.today(), afternoon_out)
                                          gap_minutes = gap.total_seconds() / 60
                                          ot_hours = gap_minutes / 60   # example: 45 minutes = 0.75 hours
                                          work_value = 1.0
                              elif new_time_in > morning_out and new_time_in <= afternoon_in:
                                    if new_time_out >= afternoon_out:
                                          new_status = "Present (Half Day)"
                                          work_value = 0.5

                              cursor.execute('''
                                    UPDATE staff_attendance SET  time_out = %s, status = %s  WHERE staff_id = %s AND date = %s
                              ''', (new_time_out.strftime("%I:%M %p"), new_status, data.get('id'), dates))
                              #update_date = cursor.rowcount > 0

                              if new_status == 'Present (Overtime)':
                                    cursor.execute("SELECT daily_salary FROM staff_details WHERE id = %s", (data.get('id'),))
                                    daily_salary = cursor.fetchone().get("daily_salary")
                                    hourly_rate = daily_salary / 8

                                    # compute overtime pay
                                    ot_pay = ot_hours * hourly_rate * 1.25  # 125% OT rate

                                    # update salary
                                    cursor.execute('''
                                          UPDATE staff_details 
                                          SET 
                                                workdays = workdays + %s,
                                                weekly_salary = weekly_salary + daily_salary + %s,
                                                monthly_salary = monthly_salary + daily_salary + %s
                                          WHERE id = %s
                                    ''', (work_value, ot_pay, ot_pay, data.get('id')))
                              else:
                                    cursor.execute('''
                                          UPDATE staff_details 
                                          SET 
                                          workdays = workdays + %s,
                                          weekly_salary = weekly_salary + (daily_salary * %s),
                                          monthly_salary = monthly_salary + (daily_salary * %s)
                                          WHERE id = %s
                                    ''', (work_value, work_value, work_value, data.get('id')))
                        
                              con.commit()
                        
                        return {'success': bool(cursor.rowcount != 0), 'message': 'Updated successfully!' if bool(cursor.rowcount != 0) else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}

      def all_staff_attendance(self, day, month):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor() 
                        target_date = date(date.today().year, int(month), int(day))
                        cursor.execute('''
                        SELECT * 
                        FROM staff_attendance 
                        WHERE date = %s
                        ''', (target_date,))
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def all_present_staff(self, day, month):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        target_date = f"{date.today().year}-{int(month)}-{int(day)}"  # format YYYY-MM-DD
                        print('date: '+str(target_date))
                        cursor.execute('''
                        SELECT * 
                        FROM staff_attendance 
                        WHERE date = %s
                              AND status not in ('Absent')
                        ''', (target_date,))

                        data = cursor.fetchall()
                        print(data)
                        return {'success': bool(data), 'data': data}

            except Exception as e:
                  con.rollback()
                  return {'success': False, 'message': f'Query failed: {e}'}

      def individual_staff_attendance(self, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_attendance WHERE staff_id = %s''', (id,))
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def search_staff(self, staff_name):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT * FROM staff_details WHERE staff_name LIKE %s''', (staff_name +"%"))
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
                        del_staff = cursor.rowcount

                        cursor.execute(''' DELETE FROM staff_attendance WHERE staff_id = %s''', (id,))
                        del_staff_attendance = cursor.rowcount
                        con.commit()
                        success = (del_staff + del_staff_attendance) > 0

                        return {'success': True if success > 0 else False, 'message': 'Removed successfully!' if success > 0 else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def remove_staff_attendance(self, id, status, date):
            new_date = datetime.strptime(date, "%b %d, %Y")
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' DELETE FROM staff_attendance WHERE staff_id = %s  AND date = %s''', (id, new_date))
                        del_attendance = cursor.rowcount

                        if status != 'Absent':
                              if status in ['Present (Whole Day)', 'Present (Overtime)']:
                                    cursor.execute('''
                                          UPDATE staff_details
                                          SET 
                                          workdays = CASE 
                                                            WHEN workdays - 1 < 0 THEN 0
                                                            ELSE workdays - 1
                                                      END,

                                          weekly_salary = CASE
                                                            WHEN weekly_salary - (daily_salary * 1) < 0 THEN 0
                                                            ELSE weekly_salary - (daily_salary * 1)
                                                            END,

                                          monthly_salary = CASE
                                                            WHEN monthly_salary - (daily_salary * 1) < 0 THEN 0
                                                            ELSE monthly_salary - (daily_salary * 1)
                                                            END
                                          WHERE id = %s
                                    ''', (id,))
                              else:
                                    cursor.execute('''
                                          UPDATE staff_details
                                          SET 
                                          workdays = CASE 
                                                            WHEN workdays - 0.5 < 0 THEN 0
                                                            ELSE workdays - 0.5
                                                      END,

                                          weekly_salary = CASE
                                                            WHEN weekly_salary - (daily_salary * 0.5) < 0 THEN 0
                                                            ELSE weekly_salary - (daily_salary * 0.5)
                                                            END,

                                          monthly_salary = CASE
                                                            WHEN monthly_salary - (daily_salary * 0.5) < 0 THEN 0
                                                            ELSE monthly_salary - (daily_salary * 0.5)
                                                            END
                                          WHERE id = %s
                                    ''', (id,))

                        else:
                              cursor.execute('''
                                    UPDATE staff_details SET 
                                    absent = CASE WHEN absent - 1 < 0 THEN 0 ELSE absent - 1 END,
                                    weekly_salary = CASE WHEN weekly_salary - (daily_salary * 1) < 0 THEN 0 ELSE weekly_salary - (daily_salary * 1) END,
                                    monthly_salary = CASE WHEN monthly_salary - (daily_salary * 1) < 0 THEN 0 ELSE monthly_salary - (daily_salary * 1) END
                                    WHERE id = %s;
                              ''', (id,))

                              cursor.execute(''' UPDATE staff_details SET status = %s WHERE id = %s ''', ('Active', id))
                              
                        con.commit()

                        return {'success': bool(del_attendance), 'message': 'Removed successfully!' if bool(del_attendance) else 'Failed'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def staff_summary_cards(self, month, day):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute('''
                              WITH 
                              last_week_sunday AS (
                                    SELECT DATE_SUB(CURRENT_DATE(), INTERVAL (WEEKDAY(CURRENT_DATE()) + 1) DAY) AS sunday_date
                              ),
                              this_week_sunday AS (
                                    SELECT DATE_ADD(sunday_date, INTERVAL 7 DAY) AS sunday_date
                                    FROM last_week_sunday
                              )
                              
                              SELECT 
                                    (SELECT COUNT(*) FROM staff_details) AS total_staff,

                                    (SELECT COUNT(*) 
                                    FROM staff_attendance 
                                    WHERE status != 'Absent'
                                    AND MONTH(date) = %s AND DAY(date) = %s  AND YEAR(date) = YEAR(CURRENT_DATE())
                                    ) AS today_duty,

                                    (SELECT COUNT(*) 
                                    FROM staff_attendance 
                                    WHERE status = 'Absent'
                                    AND MONTH(date) = %s AND DAY(date) = %s AND YEAR(date) = YEAR(CURRENT_DATE())
                                    ) AS today_absent,

                                    (SELECT COUNT(*) 
                                    FROM staff_leaves_data
                                    WHERE date >= (SELECT sunday_date FROM last_week_sunday)
                                    AND date < (SELECT sunday_date FROM this_week_sunday)
                                    ) AS total_leave;
                        ''', (month, day, month, day))
                        stats = cursor.fetchone()


                        return {'success': bool(stats), 'data': stats}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      
      def this_week_onleave(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' 
                              WITH 
                              last_week_sunday AS (
                                    SELECT DATE_SUB(CURRENT_DATE(), INTERVAL (WEEKDAY(CURRENT_DATE()) + 1) DAY) AS sunday_date
                              ),
                              this_week_sunday AS (
                                    SELECT DATE_ADD(sunday_date, INTERVAL 7 DAY) AS sunday_date
                                    FROM last_week_sunday
                              )
                              SELECT  *
                                    FROM staff_leaves_data
                                    WHERE date >= (SELECT sunday_date FROM last_week_sunday)
                                    AND date < (SELECT sunday_date FROM this_week_sunday)
                        ''')
                  
                        data = cursor.fetchall()

                        return {'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
