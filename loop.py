import pandas as pd
import pymysql
from datetime import date

# 1️⃣ Load Excel file
df = pd.read_excel('data.ods', engine='odf')

# 2️⃣ Clean column names
df.columns = df.columns.str.strip().str.lower()
# Convert date columns to datetime
df = df.rename(columns={
    "name": "name",
    "date": "check",
    "check-out": "checkout",
    "total guest": "totalguest",
    "payment type": "payment",
    "accommodation": "acc",
    "amount": "am",
    "premium": "pr",
    "standard": "st",
    "barkada": "bd",
    "garden": "gar",
    "cabana": "cb",
    "smallcottage": "sm",
    "bigcottage": "bg",
    "pavillion": "pv",
    "mariposa": "mp",
    "minicon": "mn",
    "total": "total"
})

# 4️⃣ Loop through dataframe and insert
count = 1
print(' INSERT INTO accomodation_data (check_in, check_out, premium, standard, garden, barkada, cabana, small, big, pavillion, mariposa, minicon, total) VALUES')
for index, row in df.iterrows():
    print(f'''('{row['check'].date()}', '{row['checkout'].date()}', {row['pr']}, {row['st']}, {row['gar']}, {row['bd']}, {row['cb']}, {row['sm']}, {row['bg']}, {row['pv']}, {row['mp']}, {row['mn']}, {row['total']}),''')


    count+=1


print(f"{len(df)} rows inserted successfully!")


"""
    cursor.execute(
        INSERT INTO bookings (name, check_in, check_out, accomodations,  total_guest, payment, status, booking_type, total_amount)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    , (row['name'], row['check'], row['checkout'], row.acc, row['totalguest'], row['payment'], 'Checked-out', 'Check-in', row['am']) )

    cursor.execute(
        INSERT INTO accomodation_data (check_in, check_out, premium, standard, garden, barkada, family, cabana, small, big, hall, total)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
     (row['check'], row['checkout'], row['pr'], row['st'], row['gar'], row['bd'], row['fm'], row['cb'], row['sm'], row['bg'], row['h'], row['total'] ))
    """