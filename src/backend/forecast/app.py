
import pandas as pd
from prophet import Prophet
from datetime import date, timedelta
import sys
import json



def get_week_range(date):
	monday = date - timedelta(days=date.weekday())  # Monday
	sunday = monday + timedelta(days=6)           # Sunday
	return monday, sunday

def get_checkin_change(data):
	yesterday_data = float(round(data['yhat'].iloc[-2]))
	today_data =  float(round(data['yhat'].iloc[-1]))
	return ((today_data if today_data > 0 else 0 - yesterday_data) / today_data) * 100 if today_data != 0 else 0
	
def forecast_guest(type):
	df = pd.read_excel('./src/backend/forecast/excel/guest-all-data.ods', engine='odf')
	df.columns = df.columns.str.strip().str.lower()
	df = df.rename(columns={ # must rename cause it only read the ds and y column name
		"date": "ds",  # date
		"total guest": "y" # value, can be room data, guest or profit
	})

	model = Prophet() 
	model.fit(df) # train the library about your data to make predictions
	future = model.make_future_dataframe(periods= (date.today() + timedelta(days=1) - df['ds'].max().date()).days if type == "tommorow" else (date.today() - df['ds'].max().date()).days)
	forecast = model.predict(future)

	return {'date':  forecast['ds'].dt.strftime('%Y-%m-%d').iloc[-1], 'guest': int(forecast['yhat'].iloc[-1].round(2))}

def projected_revenue():
	guest = forecast_guest('today').get('guest')
	check_in = forecast_check_ins().get('predicted_check_ins')

	#total = (guest * 200) + (check_in * )

def forecast_check_ins(type):
	df = pd.read_excel('./src/backend/forecast/excel/guest-all-data.ods', engine='odf')
	df.columns = df.columns.str.strip().str.lower()
	df = df.groupby('date')['total occupancy'].sum().reset_index()

	df = df.rename(columns={"date": "ds", "total occupancy": "y"})
	model = Prophet() 
	model.fit(df) # train the library about your data to make predictions
	
	future = model.make_future_dataframe(periods= (date.today() + timedelta(days=1) - df['ds'].max().date()).days if type == "tommorow" else (date.today() - df['ds'].max().date()).days)	
	forecast = model.predict(future)

	return {'date': forecast['ds'].dt.strftime('%Y-%m-%d').iloc[-1], 'predicted_check_ins': int(forecast['yhat'].apply(lambda x : max(0, int(round(x)))).tail(1)), 'change': get_checkin_change(forecast)}

def total_guest_in_home_data():
	df = pd.read_excel('./src/backend/forecast/excel/guest-all-data.ods', engine='odf')
	df.columns = df.columns.str.strip().str.lower()
	df = df.rename(columns={"check-out": "ds", "total guest": "y" })

	model = Prophet() 

	model = Prophet() 
	model.fit(df) # train the library about your data to make predictions

	monday, sunday = get_week_range(date.today())
	future = model.make_future_dataframe(periods=((sunday - pd.Timedelta(days=7)) - df['ds'].max().date()).days)
	forecast = model.predict(future)

	monday, sunday = get_week_range(forecast['ds'].max())
	lastweek_data = forecast[(forecast['ds'] >= monday) & (forecast['ds'] <= sunday)]['yhat']

	# this week data
	future2 = model.make_future_dataframe(periods=(date.today() - df['ds'].max().date()).days)
	forecast2 = model.predict(future2)

	monday2, sunday2 = get_week_range(forecast2['ds'].max())
	thisweek_data = forecast2[(forecast2['ds'] >= monday2) & (forecast2['ds'] <= sunday2)]['yhat']

	# change rate
	change = ((thisweek_data.sum() - lastweek_data.sum()) / thisweek_data.sum()) * 100

	return {'lastweek_data': int(lastweek_data.sum().round()), 'thisweek_data': int(thisweek_data.sum().round()), 'change': float(change.round(2))}


def current_occupancy_data():
	thisweek_data = int(forecast_check_ins('today').get('predicted_check_ins'))
	room_count = 78
	# occupancy percentage
	occupancy = thisweek_data / room_count
	return {'total_room': room_count- int(thisweek_data), "occupancy": round(occupancy, 2)}

methods = {
	"forecast_guest": forecast_guest,
	"forecast_check_ins": forecast_check_ins,
	"total_guest_in_home_data": total_guest_in_home_data,
	"current_occupancy_data": current_occupancy_data
}

if __name__ == "__main__":
	"""
	# 👇 This is where Python "receives" data from Express
	method_name = sys.argv[1] if len(sys.argv) > 1 else "forecast_guest"
	method_args = sys.argv[2:]  # optional additional arguments

	# Call the function dynamically
	if method_name in methods:
		result = methods[method_name](*method_args) 
	else:
		result = {"error": f"Unknown method {method_name}"}

	# 👇 This is Python sending data back to Express (stdout)
	print(json.dumps(result))
"""
print(forecast_guest('today'))
print(total_guest_in_home_data())
