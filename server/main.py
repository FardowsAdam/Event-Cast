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


@app.get("/")
def root():
    return {"status": "ok"}
