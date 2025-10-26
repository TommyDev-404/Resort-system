import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random

class OTPVerification:
      def __init__(self, db):
            self.db = db

      def verify_acc(self, user_email):

            # Email credentialsEmail sent successfully!
            system_email = "rustomgalicia1@gmail.com"
            password = "gwrk yfve hhsa pepi"  # For Gmail, use an App Password

            # Create the email
            message = MIMEMultipart()
            message["From"] = system_email
            message["To"] = user_email
            message["Subject"] = "Resort System Confirmation Code"

            # get code from db
            with self.db.connect() as con:
                  cursor = con.cursor()
                  cursor.execute(''' SELECT code FROM admin WHERE email = %s ''', (user_email,))
                  code = cursor.fetchone()

                  # update new code
                  new_code = random.randint(100000, 999999)
                  cursor.execute(''' UPDATE admin SET code = %s WHERE email = %s ''', (new_code, user_email,))
                  con.commit()

            if not code: return {'success': False, 'message': 'Email does not exist!'}

            # Email body
            body = f"Your confirmation code: { code.get('code') }. Please dont share it with other."
            message.attach(MIMEText(body, "plain"))

            # Connect to Gmail SMTP server and send email
            try:
                  with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                        server.login(system_email, password)
                        server.sendmail(system_email, user_email, message.as_string())

                  return {'success': True, 'code': code.get('code')}
            except Exception as e:
                  return {'message': f"Error: {e}", 'success': False}

            
