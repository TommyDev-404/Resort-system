import bcrypt
from backend.model import OTPVerification
from datetime import date
from flask import url_for, session
import re

class Login:
      def __init__(self, db):
            self.db = db
            self.otp_sender = OTPVerification(db)
            self.email = None
            self.code = None

      def login(self, username, password):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        cursor.execute(''' SELECT username FROM admin where username = %s ''', (username,))
                        data = cursor.fetchone()

                        if data:
                              cursor.execute(''' SELECT password FROM admin WHERE username = %s ''', (username))
                              db_password = cursor.fetchone()

                              # password from db
                              password_bytes3 = db_password.get('password').encode('utf-8')
                              hashed_pass =  bcrypt.hashpw(password_bytes3, bcrypt.gensalt())

                              # user password 
                              input_bytes = password.encode('utf-8')

                              if bcrypt.checkpw(input_bytes, hashed_pass):
                                    session['admin'] = username
                                    return {'success': True, 'message': 'Login successfully!', 'redirect': url_for('system_page')}
                              else:
                                    return {'success': False, 'message': 'Incorrect password!'}
                        else:
                              return {'success': False, 'message': 'Username not exists!'}

            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}


      def forgot_pass(self, email):
            print(email)
            # validate email format
            email_validation = self.is_valid_email(email.get('email'))
            if not email_validation: return {'message': 'Invalid email!'}

            result = self.otp_sender.verify_acc(email.get('email'))
            if result.get('success'):
                  #store temporary
                  self.email = email.get('email')
                  self.code = result.get('code')

                  return {'success': True, 'message': "We've sent you a 6-digit code in your email to verify its you."}
            else:
                  return {'success': False, 'message': result.get('message')}
                        

      def check_code(self, code):
            if str(code.get('code')) == str(self.code):
                  return {'success': True}
            else:
                  return {'success': False, 'message': "Incorrect code! Try again."}

      def changePass(self, new_password):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        cursor.execute(''' UPDATE admin SET password = %s, date_pass_change = %s WHERE email = %s ''', (new_password.get('new_password'), date.today(), self.email))
                        con.commit()

                        return {'success': bool(cursor.rowcount != 0), 'message' : "Password changed successfully!" if bool(cursor.rowcount != 0) else 'Failed to change password.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      

      def is_valid_email(self, email):
            pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
            return re.match(pattern, email) is not None
