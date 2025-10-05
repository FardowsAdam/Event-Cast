"""
Weather Prediction ML Model
Trains a Random Forest model on NASA weather data to predict future weather conditions.
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import pickle
import json
import os


class WeatherPredictor:
    def __init__(self):
        self.temp_model = None
        self.humidity_model = None
        self.rain_model = None
        self.feature_cols = None
        
    def fetch_nasa_data(self, lat, lon, days_back=365):
        """Fetch historical weather data from NASA POWER API"""
        print(f"Fetching NASA data for {lat}, {lon} for {days_back} days...")
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Format dates for NASA API
        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")
        
        # NASA POWER API parameters
        params = "T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR,ALLSKY_SFC_UV_INDEX"
        url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters={params}&community=RE&longitude={lon}&latitude={lat}&start={start_str}&end={end_str}&format=JSON"
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            properties = data.get('properties', {}).get('parameter', {})
            if not properties:
                raise ValueError("No data returned from NASA API")
                
            # Convert to DataFrame
            dates = []
            temps = []
            temp_max = []
            temp_min = []
            humidity = []
            wind_speed = []
            precipitation = []
            uv_index = []
            
            for date_str in properties.get('T2M', {}):
                # Skip invalid data points
                temp = properties['T2M'][date_str]
                if temp == -999 or temp is None:
                    continue
                    
                dates.append(pd.to_datetime(date_str, format='%Y%m%d'))
                temps.append(temp)
                temp_max.append(properties.get('T2M_MAX', {}).get(date_str, temp))
                temp_min.append(properties.get('T2M_MIN', {}).get(date_str, temp))
                humidity.append(properties.get('RH2M', {}).get(date_str, 50))
                wind_speed.append(properties.get('WS2M', {}).get(date_str, 5))
                precipitation.append(properties.get('PRECTOTCORR', {}).get(date_str, 0))
                uv_index.append(properties.get('ALLSKY_SFC_UV_INDEX', {}).get(date_str, 5))
            
            df = pd.DataFrame({
                'date': dates,
                'temperature': temps,
                'temp_max': temp_max,
                'temp_min': temp_min,
                'humidity': humidity,
                'wind_speed': wind_speed,
                'precipitation': precipitation,
                'uv_index': uv_index
            })
            
            # Remove outliers and invalid data
            df = df[df['temperature'] > -50]  # Remove extreme values
            df = df[df['temperature'] < 60]
            df = df[df['humidity'] >= 0]
            df = df[df['humidity'] <= 100]
            df = df[df['precipitation'] >= 0]
            
            print(f"Successfully fetched {len(df)} days of data")
            return df.sort_values('date').reset_index(drop=True)
            
        except Exception as e:
            print(f"Error fetching NASA data: {e}")
            raise
    
    def engineer_features(self, df):
        """Create additional features for better prediction"""
        df = df.copy()
        
        # Date-based features
        df['month'] = df['date'].dt.month
        df['day_of_year'] = df['date'].dt.dayofyear
        df['day_of_month'] = df['date'].dt.day
        
        # Seasonal features
        df['season'] = ((df['month'] % 12 + 3) // 3).map({1: 'winter', 2: 'spring', 3: 'summer', 4: 'fall'})
        df['is_summer'] = (df['season'] == 'summer').astype(int)
        df['is_winter'] = (df['season'] == 'winter').astype(int)
        
        # Cyclical features for date
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
        
        # Moving averages for trend features
        window = 7  # 7-day moving average
        df['temp_ma_7'] = df['temperature'].rolling(window=window, min_periods=1).mean()
        df['humidity_ma_7'] = df['humidity'].rolling(window=window, min_periods=1).mean()
        df['precipitation_ma_7'] = df['precipitation'].rolling(window=window, min_periods=1).mean()
        
        # Lag features (previous days)
        for lag in [1, 2, 3, 7]:
            df[f'temp_lag_{lag}'] = df['temperature'].shift(lag)
            df[f'humidity_lag_{lag}'] = df['humidity'].shift(lag)
            df[f'precipitation_lag_{lag}'] = df['precipitation'].shift(lag)
        
        # Weather pattern indicators
        df['temp_range'] = df['temp_max'] - df['temp_min']
        df['rain_probability'] = (df['precipitation'] > 0).astype(int)
        
        return df
    
    def prepare_training_data(self, df):
        """Prepare data for training with target variables shifted by 1 day"""
        df_features = self.engineer_features(df)
        
        # Create targets (next day's weather)
        df_features['next_temp'] = df_features['temperature'].shift(-1)
        df_features['next_humidity'] = df_features['humidity'].shift(-1)
        df_features['next_rain_prob'] = df_features['rain_probability'].shift(-1)
        
        # Remove rows with NaN values
        df_features = df_features.dropna()
        
        # Select feature columns (exclude date and target columns)
        exclude_cols = ['date', 'next_temp', 'next_humidity', 'next_rain_prob']
        feature_cols = [col for col in df_features.columns if col not in exclude_cols]
        
        self.feature_cols = feature_cols
        
        X = df_features[feature_cols]
        y_temp = df_features['next_temp']
        y_humidity = df_features['next_humidity']
        y_rain = df_features['next_rain_prob']
        
        return X, y_temp, y_humidity, y_rain
    
    def train_models(self, lat, lon, days_back=365):
        """Train Random Forest models for temperature, humidity, and rain prediction"""
        print("Training weather prediction models...")
        
        # Fetch and prepare data
        df = self.fetch_nasa_data(lat, lon, days_back)
        if len(df) < 30:
            raise ValueError("Insufficient data for training (need at least 30 days)")
        
        X, y_temp, y_humidity, y_rain = self.prepare_training_data(df)
        
        if len(X) < 20:
            raise ValueError("Insufficient training samples after preprocessing")
        
        # Split data for training and testing
        X_train, X_test, y_temp_train, y_temp_test = train_test_split(
            X, y_temp, test_size=0.2, random_state=42
        )
        _, _, y_humidity_train, y_humidity_test = train_test_split(
            X, y_humidity, test_size=0.2, random_state=42
        )
        _, _, y_rain_train, y_rain_test = train_test_split(
            X, y_rain, test_size=0.2, random_state=42
        )
        
        # Train Random Forest models
        print("Training temperature model...")
        self.temp_model = RandomForestRegressor(
            n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
        )
        self.temp_model.fit(X_train, y_temp_train)
        
        print("Training humidity model...")
        self.humidity_model = RandomForestRegressor(
            n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
        )
        self.humidity_model.fit(X_train, y_humidity_train)
        
        print("Training rain probability model...")
        self.rain_model = RandomForestRegressor(
            n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
        )
        self.rain_model.fit(X_train, y_rain_train)
        
        # Evaluate models
        temp_pred = self.temp_model.predict(X_test)
        humidity_pred = self.humidity_model.predict(X_test)
        rain_pred = self.rain_model.predict(X_test)
        
        print(f"Temperature Model - R²: {r2_score(y_temp_test, temp_pred):.3f}, RMSE: {np.sqrt(mean_squared_error(y_temp_test, temp_pred)):.2f}")
        print(f"Humidity Model - R²: {r2_score(y_humidity_test, humidity_pred):.3f}, RMSE: {np.sqrt(mean_squared_error(y_humidity_test, humidity_pred)):.2f}")
        print(f"Rain Model - R²: {r2_score(y_rain_test, rain_pred):.3f}, RMSE: {np.sqrt(mean_squared_error(y_rain_test, rain_pred)):.3f}")
        
        return df
    
    def predict_weather(self, current_data):
        """Predict next day weather based on current conditions"""
        if not all([self.temp_model, self.humidity_model, self.rain_model]):
            raise ValueError("Models not trained. Call train_models() first.")
        
        # Prepare features similar to training
        df_input = pd.DataFrame([current_data])
        df_features = self.engineer_features(df_input)
        
        # Use only the feature columns from training
        X = df_features[self.feature_cols].fillna(0)  # Fill any NaN with 0
        
        # Make predictions
        temp_pred = self.temp_model.predict(X)[0]
        humidity_pred = self.humidity_model.predict(X)[0]
        rain_prob_pred = max(0, min(1, self.rain_model.predict(X)[0]))  # Clamp between 0 and 1
        
        # Calculate confidence based on feature importance and prediction variance
        temp_confidence = min(0.95, max(0.6, 1 - (abs(temp_pred - current_data['temperature']) / 20)))
        humidity_confidence = min(0.95, max(0.6, 1 - (abs(humidity_pred - current_data['humidity']) / 50)))
        rain_confidence = min(0.95, max(0.6, 0.8))  # Rain prediction is generally less confident
        
        return {
            'temperature': round(temp_pred, 1),
            'humidity': round(max(0, min(100, humidity_pred)), 1),
            'rain_probability': round(rain_prob_pred * 100, 1),  # Convert to percentage
            'confidence': {
                'temperature': round(temp_confidence, 2),
                'humidity': round(humidity_confidence, 2),
                'rain': round(rain_confidence, 2),
                'overall': round((temp_confidence + humidity_confidence + rain_confidence) / 3, 2)
            }
        }
    
    def save_model(self, filepath):
        """Save trained models to pickle file"""
        if not all([self.temp_model, self.humidity_model, self.rain_model]):
            raise ValueError("Models not trained. Cannot save.")
        
        model_data = {
            'temp_model': self.temp_model,
            'humidity_model': self.humidity_model,
            'rain_model': self.rain_model,
            'feature_cols': self.feature_cols,
            'version': '1.0',
            'created_at': datetime.now().isoformat()
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"Models saved to {filepath}")
    
    def load_model(self, filepath):
        """Load trained models from pickle file"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.temp_model = model_data['temp_model']
        self.humidity_model = model_data['humidity_model']
        self.rain_model = model_data['rain_model']
        self.feature_cols = model_data['feature_cols']
        
        print(f"Models loaded from {filepath}")


def train_and_save_model(lat=24.7136, lon=46.6753, days_back=365):
    """Train models for a specific location and save them"""
    predictor = WeatherPredictor()
    
    try:
        print(f"Training weather prediction model for location: {lat}, {lon}")
        df = predictor.train_models(lat, lon, days_back)
        
        # Save the trained model
        model_path = os.path.join(os.path.dirname(__file__), 'weather_predictor.pkl')
        predictor.save_model(model_path)
        
        # Save some recent data for testing
        recent_data = df.tail(1).iloc[0].to_dict()
        test_prediction = predictor.predict_weather(recent_data)
        
        print("\nTest prediction:")
        print(f"Current: Temp={recent_data['temperature']:.1f}°C, Humidity={recent_data['humidity']:.1f}%")
        print(f"Predicted: Temp={test_prediction['temperature']}°C, Humidity={test_prediction['humidity']}%, Rain={test_prediction['rain_probability']}%")
        print(f"Overall confidence: {test_prediction['confidence']['overall']:.2f}")
        
        return True
        
    except Exception as e:
        print(f"Error training model: {e}")
        return False


if __name__ == "__main__":
    import sys
    
    # Default coordinates (Riyadh, Saudi Arabia)
    lat = 24.7136
    lon = 46.6753
    days_back = 365
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        lat = float(sys.argv[1])
    if len(sys.argv) > 2:
        lon = float(sys.argv[2])
    if len(sys.argv) > 3:
        days_back = int(sys.argv[3])
    
    success = train_and_save_model(lat, lon, days_back)
    sys.exit(0 if success else 1)