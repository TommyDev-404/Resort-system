from datetime import date
import pandas as pd
from prophet import Prophet
from datetime import date, timedelta

class Forecast:
      def forecast_revenue(self, dates, values):
            today = date.today()
            current_year = today.year
            start_of_year = date(current_year, 1, 1)
            end_of_year = date(current_year, 12, 31)

            # Create a Prophet-ready DataFrame
            df = pd.DataFrame({
                  'ds': pd.to_datetime(dates),
                  'y': values
            })

            # Filter historical data to current year only
            df = df[df['ds'].dt.year == current_year]

            model = Prophet()
            model.fit(df)

            last_date = df['ds'].max().date()  # last historical date in current year
            periods = (end_of_year - last_date).days if last_date < end_of_year else 0

            # Generate future dataframe and forecast
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)
            
            # Historical (actual) data
            historical = df[['ds', 'y']].copy()
            historical = historical.rename(columns={'y': 'value'})
            historical['value'] = pd.to_numeric(historical['value'], errors='coerce').fillna(0)
            historical['month'] = historical['ds'].dt.month

            # Forecasted data: only dates after last_date
            forecast_only = forecast[forecast['ds'].dt.date > last_date][['ds', 'yhat']]
            forecast_only = forecast_only.rename(columns={'yhat': 'value'})
            forecast_only['value'] = pd.to_numeric(forecast_only['value'], errors='coerce').fillna(0)
            forecast_only['month'] = forecast_only['ds'].dt.month

            # Aggregate by month (sum values per month)
            historical_by_month = historical.groupby('month')['value'].sum().reindex(range(1,13), fill_value=0)
            forecast_by_month = forecast_only.groupby('month')['value'].sum().reindex(range(1,13), fill_value=0)

            # Prepare result
            result = {
                  'historical': {
                        'month': historical_by_month.index.tolist(),  # 1-12
                        'value': historical_by_month.round().tolist()
                  },
                  'forecasted': {
                        'month': forecast_by_month.index.tolist(),  # 1-12
                        'value': forecast_by_month.round().tolist()
                  }
            }

            return result


      def forecast_checkin(self, dates, values):
            # Create a Prophet-ready DataFrame
            df = pd.DataFrame({
                  'ds': pd.to_datetime(dates),
                  'y': values
            })

            model = Prophet()
            model.fit(df)  # train the model

            today = date.today()
            last_date = df['ds'].max().date()
            end_of_year = date(today.year, 12, 31)

            # Number of days to forecast until end of year
            periods = (end_of_year - last_date).days

            # Generate future dataframe
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)

            # Historical (actual) data
            historical = df[['ds', 'y']].copy()
            historical = historical.rename(columns={'y': 'value'})

            # Forecasted data: only dates after last_date
            forecast_only = forecast[forecast['ds'].dt.date > last_date][['ds', 'yhat']]
            forecast_only = forecast_only.rename(columns={'yhat': 'value'})

            # Optional: convert to float
            historical['value'] = pd.to_numeric(historical['value'], errors='coerce').fillna(0)
            forecast_only['value'] = pd.to_numeric(forecast_only['value'], errors='coerce').fillna(0)

            # Format dates
            historical_dates = historical['ds'].dt.strftime('%Y-%m-%d').to_list()
            forecast_dates = forecast_only['ds'].dt.strftime('%Y-%m-%d').to_list()

            result = {
                  'historical': {
                        'date': historical_dates,
                        'value': historical['value'].round().tolist()
                  },
                  'forecasted': {
                        'date': forecast_dates,
                        'value': forecast_only['value'].round().tolist()
                  }
            }

            return result

      def forecast_occupancy(self, dates, values):
            # Create a Prophet-ready DataFrame
            df = pd.DataFrame({
                  'ds': pd.to_datetime(dates),
                  'y': values
            })

            model = Prophet()
            model.fit(df)  # train the model

            today = date.today()
            last_date = df['ds'].max().date()
            end_of_year = date(today.year, 12, 31)

            # Number of days to forecast until end of year
            periods = (end_of_year - last_date).days

            # Generate future dataframe
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)

            # Historical (actual) data
            historical = df[['ds', 'y']].copy()
            historical = historical.rename(columns={'y': 'value'})

            # Forecasted data: only dates after last_date
            forecast_only = forecast[forecast['ds'].dt.date > last_date][['ds', 'yhat']]
            forecast_only = forecast_only.rename(columns={'yhat': 'value'})

            # Optional: convert to float
            historical['value'] = pd.to_numeric(historical['value'], errors='coerce').fillna(0)
            forecast_only['value'] = pd.to_numeric(forecast_only['value'], errors='coerce').fillna(0)

            # Format dates
            historical_dates = historical['ds'].dt.strftime('%Y-%m-%d').to_list()
            forecast_dates = forecast_only['ds'].dt.strftime('%Y-%m-%d').to_list()

            result = {
                  'historical': {
                        'date': historical_dates,
                        'value': historical['value'].round().tolist()
                  },
                  'forecasted': {
                        'date': forecast_dates,
                        'value': forecast_only['value'].round().tolist()
                  }
            }

            return result







      
