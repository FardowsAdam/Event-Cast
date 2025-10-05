import os
import pickle
import datetime as dt
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

import sys
from pathlib import Path

# Make ml-model importable
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / "ml-model"))
from nasa import fetch_power_daily  # noqa: E402
from seasonal_predictor import seasonal_predict  # noqa: E402

MODEL_PATH = ROOT / "ml-model" / "weather_predictor.pkl"

app = FastAPI(title="AI Weather Predictor")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    lat: float
    lon: float
    date: str  # ISO date YYYY-MM-DD for the day you want prediction


class PredictResponse(BaseModel):
    temperature: float
    humidity: float
    rain_probability: float
    confidence: float


class UnifiedForecastResponse(BaseModel):
    mode: str  # "short_term" or "seasonal"
    predicted_temperature: list[float]
    predicted_humidity: list[float]
    predicted_precipitation: list[float]
    confidence: float


def _load_model() -> Dict[str, Any]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


@app.post("/predict-weather", response_model=PredictResponse)
def predict_weather(req: PredictRequest):
    try:
        bundle = _load_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    model = bundle["model"]
    feature_columns = bundle["feature_columns"]

    # We predict next day from the most recent available data.
    target_date = dt.date.fromisoformat(req.date)
    # Ensure we fetch at least 14 days history to build features
    end = min(target_date - dt.timedelta(days=1), dt.date.today())
    start = end - dt.timedelta(days=60)

    df = fetch_power_daily(req.lat, req.lon, start, end)
    if df.empty:
        raise HTTPException(status_code=400, detail="No historical data available from NASA POWER")

    # Rebuild features identically to training
    tmp = df.copy()
    tmp["RAIN_FLAG"] = (tmp["PRECTOTCORR"].fillna(0.0) > 0.5).astype(int)

    X = pd.DataFrame(index=tmp.index)
    for col in ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "PRECTOTCORR"]:
        X[f"{col}_lag0"] = tmp[col]
        X[f"{col}_lag1"] = tmp[col].shift(1)
        X[f"{col}_lag3"] = tmp[col].rolling(3, min_periods=1).mean()
        X[f"{col}_lag7"] = tmp[col].rolling(7, min_periods=1).mean()

    X["dayofyear"] = tmp.index.dayofyear
    X["sin_doy"] = np.sin(2 * np.pi * X["dayofyear"] / 365.25)
    X["cos_doy"] = np.cos(2 * np.pi * X["dayofyear"] / 365.25)

    if X.empty:
        raise HTTPException(status_code=400, detail="Insufficient data to build features")

    # Use last row as current features; model predicts next day
    x_last = X.iloc[[-1]]
    # Align columns
    for col in feature_columns:
        if col not in x_last.columns:
            x_last[col] = 0.0
    x_last = x_last[feature_columns]

    pred = model.predict(x_last)[0]
    temp, humid, rain_prob = float(pred[0]), float(pred[1]), float(min(max(pred[2], 0.0), 1.0))

    # Very simple confidence heuristic: more recent data and length of history
    days_covered = (end - start).days
    recency_days = (dt.date.today() - end).days
    confidence = max(0.4, min(0.95, 0.6 + 0.002 * days_covered - 0.02 * recency_days))

    return PredictResponse(
        temperature=round(temp, 1),
        humidity=round(humid, 1),
        rain_probability=round(rain_prob, 3),
        confidence=round(confidence, 3),
    )


@app.post("/predict", response_model=UnifiedForecastResponse)
def predict_short_term(req: PredictRequest):
    """Predict next 3 days using RF model with simple recursive rollout."""
    try:
        bundle = _load_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    model = bundle["model"]
    feature_columns = bundle["feature_columns"]

    anchor_date = dt.date.fromisoformat(req.date)
    end = min(anchor_date - dt.timedelta(days=1), dt.date.today())
    start = end - dt.timedelta(days=14)

    df = fetch_power_daily(req.lat, req.lon, start, end)
    if df.empty:
        raise HTTPException(status_code=400, detail="No historical data available from NASA POWER")

    tmp = df.copy()
    tmp["RAIN_FLAG"] = (tmp["PRECTOTCORR"].fillna(0.0) > 0.5).astype(int)

    X = pd.DataFrame(index=tmp.index)
    for col in ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "PRECTOTCORR"]:
        X[f"{col}_lag0"] = tmp[col]
        X[f"{col}_lag1"] = tmp[col].shift(1)
        X[f"{col}_lag3"] = tmp[col].rolling(3, min_periods=1).mean()
        X[f"{col}_lag7"] = tmp[col].rolling(7, min_periods=1).mean()
    X["dayofyear"] = tmp.index.dayofyear
    X["sin_doy"] = np.sin(2 * np.pi * X["dayofyear"] / 365.25)
    X["cos_doy"] = np.cos(2 * np.pi * X["dayofyear"] / 365.25)

    # Start from last known feature row
    last_row = X.iloc[[-1]].copy()
    # Ensure column alignment
    for col in feature_columns:
        if col not in last_row.columns:
            last_row[col] = 0.0
    last_row = last_row[feature_columns]

    temps: list[float] = []
    humids: list[float] = []
    precs: list[float] = []

    current_date = end
    for step in range(1, 4):
        # Predict next day
        y = model.predict(last_row)[0]
        temp = float(y[0])
        humid = float(y[1])
        rain_prob = float(min(max(y[2], 0.0), 1.0))
        precip_mm = float(rain_prob * 20.0)

        temps.append(round(temp, 1))
        humids.append(round(humid, 1))
        precs.append(round(precip_mm, 2))

        # Roll features one day forward naively: update lag0 values
        current_date = current_date + dt.timedelta(days=1)
        # Update feature placeholders
        # We update only base set used in training; rolling windows approximated
        feature_updates = {
            "T2M_lag0": temp,
            "T2M_MAX_lag0": temp + 2,
            "T2M_MIN_lag0": temp - 2,
            "RH2M_lag0": humid,
            "WS2M_lag0": last_row.iloc[0][feature_columns[0]] if feature_columns else 3.0,
            "PRECTOTCORR_lag0": precip_mm,
        }
        for k, v in feature_updates.items():
            if k in last_row.columns:
                last_row.iloc[0, last_row.columns.get_loc(k)] = v

        # Day-of-year features
        doy = current_date.timetuple().tm_yday
        if "dayofyear" in last_row.columns:
            last_row.iloc[0, last_row.columns.get_loc("dayofyear")] = doy
        if "sin_doy" in last_row.columns:
            last_row.iloc[0, last_row.columns.get_loc("sin_doy")] = np.sin(2 * np.pi * doy / 365.25)
        if "cos_doy" in last_row.columns:
            last_row.iloc[0, last_row.columns.get_loc("cos_doy")] = np.cos(2 * np.pi * doy / 365.25)

    days_covered = (end - start).days
    recency_days = (dt.date.today() - end).days
    confidence = max(0.4, min(0.95, 0.6 + 0.002 * days_covered - 0.02 * recency_days))

    return UnifiedForecastResponse(
        mode="short_term",
        predicted_temperature=temps,
        predicted_humidity=humids,
        predicted_precipitation=precs,
        confidence=round(confidence, 3),
    )


class SeasonalRequest(BaseModel):
    lat: float
    lon: float
    date: str  # anchor date yyyy-mm-dd
    range: str | None = "month"  # "month" or "date"


@app.post("/predict-seasonal", response_model=UnifiedForecastResponse)
def predict_seasonal(req: SeasonalRequest):
    try:
        target = dt.date.fromisoformat(req.date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format")
    mode = "month" if req.range not in ("date", "month") else req.range
    temps, humids, precs, conf = seasonal_predict(req.lat, req.lon, target, mode=mode)  # type: ignore[arg-type]
    if temps.size == 0:
        raise HTTPException(status_code=400, detail="Insufficient historical data for seasonal prediction")
    return UnifiedForecastResponse(
        mode="seasonal",
        predicted_temperature=[round(float(x), 1) for x in temps.tolist()],
        predicted_humidity=[round(float(x), 1) for x in humids.tolist()],
        predicted_precipitation=[round(float(x), 2) for x in precs.tolist()],
        confidence=round(float(conf), 3),
    )


@app.get("/")
def root():
    return {"status": "ok"}
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
