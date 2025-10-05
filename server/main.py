"""
FastAPI server for AI weather prediction
Provides endpoint to get weather predictions using the trained ML model
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import os
import sys
import asyncio
from datetime import datetime, timedelta
import requests
import json

# Add the ml-model directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml-model'))

try:
    from weather_predictor import WeatherPredictor
except ImportError:
    print("Warning: weather_predictor module not found. Make sure to install dependencies.")
    WeatherPredictor = None

app = FastAPI(
    title="AI Weather Prediction API",
    description="AI-powered weather prediction service using NASA historical data",
    version="1.0.0"
)

# Add CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app", "https://*.netlify.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Global predictor instance
weather_predictor = None
model_location = None

class WeatherPredictionRequest(BaseModel):
    lat: float
    lon: float
    current_weather: Dict[str, Any]

class WeatherPredictionResponse(BaseModel):
    temperature: float
    humidity: float
    rain_probability: float
    confidence: Dict[str, float]
    condition: str
    condition_ar: str
    feels_like: float
    wind_speed: float
    uv_index: float
    precipitation: float
    is_ai_prediction: bool = True


def get_weather_condition(temp: float, rain_prob: float):
    """Determine weather condition based on temperature and rain probability"""
    conditions = {
        'Clear': 'صافي',
        'Partly Cloudy': 'غائم جزئياً', 
        'Cloudy': 'غائم',
        'Rainy': 'ممطر',
        'Hot': 'حار',
        'Very Hot': 'حار جداً',
        'Warm': 'دافئ',
        'Mild': 'معتدل',
        'Cool': 'بارد'
    }
    
    if rain_prob > 50:
        return 'Rainy', conditions['Rainy']
    elif temp > 38:
        return 'Very Hot', conditions['Very Hot']
    elif temp > 30:
        return 'Hot', conditions['Hot']
    elif temp > 25:
        return 'Warm', conditions['Warm']
    elif temp > 15:
        return 'Mild', conditions['Mild']
    else:
        return 'Cool', conditions['Cool']


async def fetch_nasa_current_data(lat: float, lon: float):
    """Fetch recent NASA data to use as input for prediction"""
    try:
        # Get data from the last 7 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")
        
        params = "T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR,ALLSKY_SFC_UV_INDEX"
        url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters={params}&community=RE&longitude={lon}&latitude={lat}&start={start_str}&end={end_str}&format=JSON"
        
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        properties = data.get('properties', {}).get('parameter', {})
        if not properties:
            return None
        
        # Get the most recent valid data point
        temp_data = properties.get('T2M', {})
        humidity_data = properties.get('RH2M', {})
        precip_data = properties.get('PRECTOTCORR', {})
        wind_data = properties.get('WS2M', {})
        uv_data = properties.get('ALLSKY_SFC_UV_INDEX', {})
        
        for date_str in sorted(temp_data.keys(), reverse=True):
            temp = temp_data.get(date_str)
            if temp is not None and temp != -999:
                return {
                    'date': datetime.strptime(date_str, '%Y%m%d'),
                    'temperature': temp,
                    'temp_max': properties.get('T2M_MAX', {}).get(date_str, temp),
                    'temp_min': properties.get('T2M_MIN', {}).get(date_str, temp),
                    'humidity': humidity_data.get(date_str, 50),
                    'wind_speed': wind_data.get(date_str, 5),
                    'precipitation': precip_data.get(date_str, 0),
                    'uv_index': uv_data.get(date_str, 5)
                }
        
        return None
        
    except Exception as e:
        print(f"Error fetching NASA data: {e}")
        return None


def ensure_model_loaded(lat: float, lon: float):
    """Ensure the weather prediction model is loaded for the given location"""
    global weather_predictor, model_location
    
    model_path = os.path.join(os.path.dirname(__file__), '..', 'ml-model', 'weather_predictor.pkl')
    
    # Check if we need to load or retrain the model
    location_key = f"{lat:.2f},{lon:.2f}"
    
    if weather_predictor is None:
        weather_predictor = WeatherPredictor()
        
        # Try to load existing model
        try:
            weather_predictor.load_model(model_path)
            model_location = location_key
            print(f"Loaded existing model for location {location_key}")
        except (FileNotFoundError, Exception) as e:
            print(f"No existing model found or error loading: {e}")
            print(f"Training new model for location {location_key}...")
            
            # Train new model
            try:
                weather_predictor.train_models(lat, lon, days_back=365)
                weather_predictor.save_model(model_path)
                model_location = location_key
                print(f"Successfully trained and saved new model for {location_key}")
            except Exception as train_error:
                print(f"Error training model: {train_error}")
                raise HTTPException(status_code=500, detail=f"Failed to train model: {str(train_error)}")
    
    # Check if we need to retrain for a different location (simplified for demo)
    elif model_location != location_key:
        print(f"Retraining model for new location {location_key}")
        try:
            weather_predictor.train_models(lat, lon, days_back=365) 
            weather_predictor.save_model(model_path)
            model_location = location_key
        except Exception as train_error:
            print(f"Error retraining model: {train_error}")
            # Continue with existing model as fallback
            pass


@app.get("/")
async def root():
    return {
        "message": "AI Weather Prediction API", 
        "version": "1.0.0",
        "endpoints": ["/predict-weather", "/health"]
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/predict-weather")
async def predict_weather(request: WeatherPredictionRequest) -> WeatherPredictionResponse:
    """Predict weather for the next day using AI model"""
    
    if WeatherPredictor is None:
        raise HTTPException(status_code=500, detail="Weather prediction model not available")
    
    try:
        # Ensure model is loaded for this location
        ensure_model_loaded(request.lat, request.lon)
        
        # Get current weather data from NASA if not provided in sufficient detail
        current_data = request.current_weather.copy()
        
        # Fetch recent NASA data if we don't have all required fields
        if not all(key in current_data for key in ['temperature', 'humidity', 'precipitation']):
            nasa_data = await fetch_nasa_current_data(request.lat, request.lon)
            if nasa_data:
                # Merge NASA data with provided data
                for key, value in nasa_data.items():
                    if key not in current_data or current_data.get(key) is None:
                        current_data[key] = value
        
        # Ensure we have minimum required data
        required_fields = ['temperature', 'humidity']
        for field in required_fields:
            if field not in current_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Set defaults for missing optional fields
        current_data.setdefault('precipitation', 0)
        current_data.setdefault('wind_speed', 5)
        current_data.setdefault('uv_index', 5)
        current_data.setdefault('temp_max', current_data['temperature'] + 5)
        current_data.setdefault('temp_min', current_data['temperature'] - 5)
        current_data.setdefault('date', datetime.now())
        
        # Make prediction
        prediction = weather_predictor.predict_weather(current_data)
        
        # Determine weather condition
        condition, condition_ar = get_weather_condition(
            prediction['temperature'], 
            prediction['rain_probability']
        )
        
        # Calculate derived values
        feels_like = prediction['temperature']
        if prediction['humidity'] > 70:
            feels_like += 2
        elif prediction['humidity'] < 30:
            feels_like -= 1
            
        # Estimate other weather parameters based on predicted values
        wind_speed = current_data.get('wind_speed', 10) + (0.5 - 0.5) * 5  # Random-like variation
        wind_speed = max(0, min(50, wind_speed))
        
        uv_index = max(1, min(11, prediction['temperature'] / 3.5))
        precipitation = prediction['rain_probability'] / 10 if prediction['rain_probability'] > 30 else 0
        
        return WeatherPredictionResponse(
            temperature=prediction['temperature'],
            humidity=prediction['humidity'],
            rain_probability=prediction['rain_probability'],
            confidence=prediction['confidence'],
            condition=condition,
            condition_ar=condition_ar,
            feels_like=round(feels_like, 1),
            wind_speed=round(wind_speed, 1),
            uv_index=round(uv_index, 1),
            precipitation=round(precipitation, 1),
            is_ai_prediction=True
        )
        
    except Exception as e:
        print(f"Error in weather prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/predict-weather")
async def predict_weather_get(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"), 
    temperature: float = Query(..., description="Current temperature in Celsius"),
    humidity: float = Query(..., description="Current humidity percentage"),
    precipitation: float = Query(0, description="Current precipitation in mm"),
    wind_speed: float = Query(5, description="Current wind speed in m/s"),
    uv_index: float = Query(5, description="Current UV index")
) -> WeatherPredictionResponse:
    """GET endpoint for weather prediction (for easier testing)"""
    
    current_weather = {
        'temperature': temperature,
        'humidity': humidity,
        'precipitation': precipitation,
        'wind_speed': wind_speed,
        'uv_index': uv_index
    }
    
    request = WeatherPredictionRequest(
        lat=lat,
        lon=lon,
        current_weather=current_weather
    )
    
    return await predict_weather(request)


if __name__ == "__main__":
    import uvicorn
    
    # Train initial model on startup if needed
    print("Starting AI Weather Prediction API...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )