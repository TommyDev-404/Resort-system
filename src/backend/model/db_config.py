import pymysql

class Database:
      #global variable
      def __init__(self, host, user, password, database, port, cursor):
            self.host = host
            self.user = user
            self.password = password
            self.database = database
            self.port = port
            self.cursorclass = cursor

      def connect(self):
            return pymysql.connect(
                  host=self.host,
                  user=self.user,
                  password=self.password,
                  database=self.database,
                  port=self.port,
                  cursorclass=pymysql.cursors.DictCursor
            )




