from datetime import date

class Storage:
      def __init__(self):
            self.data = {}   # {year: [booking_dicts]}
            self.loaded_years = set() # prevent hitting the db once the year is cache

      def load_year(self, db, year):
            if year in self.loaded_years:
                  return

            with db.connect() as con:
                  cursor = con.cursor()

                  start = date(int(year), 1, 1)
                  end = date(int(year) + 1, 1, 1)

                  cursor.execute("""
                        SELECT *
                        FROM bookings
                        WHERE check_in >= %s AND check_in < %s 
                  """, (start, end))

                  self.data[year] = cursor.fetchall()
                  self.loaded_years.add(year)

      def get_year(self, year):
            return self.data.get(year, [])
      
      def get_by_category(self, year, category):
            records = self.get_year(year)
            
            if category == "all-data":
                  return records

            filters = {
                  "check_in-data": lambda r: r["status"] == "Checked-in",
                  "reserved-data": lambda r: r["status"] == "Reserved",
                  "overnight-data": lambda r: r["status"] == "Checked-in" and r["booking_type"] == "Check-in",
                  "day-guest": lambda r: r["status"] == "Checked-in" and r["booking_type"] == "Day Guest"
            }

            predicate = filters.get(category)
            if not predicate:
                  return records

            return [r for r in records if predicate(r)]

      def clear_year(self, year):
            self.data.pop(year, None)
            self.loaded_years.discard(year)

      def clear_all(self):
            self.data.clear()
            self.loaded_years.clear()
