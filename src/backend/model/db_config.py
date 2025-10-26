import pymysql

class Database:
      #global variable
      def __init__(self, host, user, password, database, cursor):
            self.host = host
            self.user = user
            self.password = password
            self.database = database
            self.cursorclass = cursor

      def connect(self):
            return pymysql.connect(
                  host=self.host,
                  user=self.user,
                  password=self.password,
                  database=self.database,
                  cursorclass=pymysql.cursors.DictCursor
            )




