import bcrypt
import re
from .email_sender import OTPVerification
from datetime import date
import  random

class Admin:
      def __init__(self, db):
            self.db = db
            self.otp_sender = OTPVerification(db)
            self.password = None
            self.new_hash_pass = None
            self.email = None
            self.code = None

      def changePass(self, email, current_password, new_password, confirm_password):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        print(email)
                        # validate email format
                        email_validation = self.is_valid_email(email)
                        print(email_validation)
                        if not email_validation: return {'message': 'Invalid email!'}

                        cursor.execute(''' SELECT password FROM admin WHERE email = %s ''', (email))
                        password = cursor.fetchone()
                        
                        # password from db
                        password_bytes3 = password.get('password').encode('utf-8')
                        hashed_pass =  bcrypt.hashpw(password_bytes3, bcrypt.gensalt())

                        # input passwords
                        input_bytes_prev = current_password.encode('utf-8')
                        input_bytes_new = confirm_password.encode('utf-8')
                        
                        hashed_new = bcrypt.hashpw(input_bytes_new, bcrypt.gensalt())

                        if bcrypt.checkpw(input_bytes_prev, hashed_pass):
                              result = self.otp_sender.verify_acc(email)
                              if result.get('success'):
                                    #store temporary
                                    self.password = confirm_password
                                    self.new_hash_pass = hashed_new
                                    self.email = email
                                    self.code = result.get('code')

                                    return {'success': True,'message': "We've sent you a 6-digit code in your email to verify its you."}
                              else:
                                    return {'success': False, 'message': result.get('message')}
                        else:
                              return {'success': False, 'message': 'Incorrect current password! Try again.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def changePassv2(self, code):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()

                        if str(code) == str(self.code):
                              cursor.execute('''
                                    UPDATE admin SET password = %s, hash_pass = %s, date_pass_change = %s WHERE email = %s
                              ''', (self.password, self.new_hash_pass, date.today(), self.email))
                              con.commit()

                              return {'success': bool(cursor.rowcount != 0), 'message' : "Password changed successfully!" if bool(cursor.rowcount != 0) else 'Failed to change password.'}
                        else:
                              return {'success': False, 'message' : "Incorrect code! Bleh"}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
      

      def edit_info(self, info, type, id):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        query = f''' UPDATE admin SET { type.lower() } = "{ info }" WHERE id = { id }'''
                        cursor.execute(query)
                        con.commit()

                        return { 'success': bool(cursor.rowcount != 0), 'message': f"{type.capitalize()} changed successfully!" if bool(cursor.rowcount != 0) else f'Failed to change{type}.'}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
      def get_admin_profile(self):
            try:
                  with self.db.connect() as con:
                        cursor = con.cursor()
                        cursor.execute(''' SELECT username, email, contact, date_pass_change FROM admin''')
                        data = cursor.fetchone()

                        return { 'success': bool(data), 'data': data}
            except Exception as e:
                  con.rollback()
                  return { 'success': False, 'message': f'Cancellation failed: {e}'}
            
            
      def is_valid_email(self, email):
            pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
            return re.match(pattern, email) is not None

