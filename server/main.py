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
