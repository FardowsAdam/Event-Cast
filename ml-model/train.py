import os
import pickle
import datetime as dt
from dataclasses import dataclass
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

from nasa import fetch_power_daily


@dataclass
class TrainConfig:
    lat: float
    lon: float
    days: int = 1200  # ~3.3 years
    random_state: int = 42
    model_path: str = "weather_predictor.pkl"


def build_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Create supervised learning dataset for next-day prediction.
    X: lag features and calendar features for day t
    y: targets for day t+1 (temp, humidity, precip-probability)
    """
    # Basic columns
    tmp = df.copy()
    # Create precipitation flag for rain probability (mm > 0.5)
    tmp["RAIN_FLAG"] = (tmp["PRECTOTCORR"].fillna(0.0) > 0.5).astype(int)

    # Shift by 1 day to create next-day targets
    y = pd.DataFrame(
        {
            "target_temp": tmp["T2M"].shift(-1),
            "target_humidity": tmp["RH2M"].shift(-1),
            "target_rain_prob": tmp["RAIN_FLAG"].rolling(3, min_periods=1).mean().shift(-1),
        },
        index=tmp.index,
    )

    # Feature engineering
    X = pd.DataFrame(index=tmp.index)
    for col in ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS2M", "PRECTOTCORR"]:
        X[f"{col}_lag0"] = tmp[col]
        X[f"{col}_lag1"] = tmp[col].shift(1)
        X[f"{col}_lag3"] = tmp[col].rolling(3, min_periods=1).mean()
        X[f"{col}_lag7"] = tmp[col].rolling(7, min_periods=1).mean()

    # Calendar features
    X["dayofyear"] = tmp.index.dayofyear
    X["sin_doy"] = np.sin(2 * np.pi * X["dayofyear"] / 365.25)
    X["cos_doy"] = np.cos(2 * np.pi * X["dayofyear"] / 365.25)

    # Drop last row where y is NaN due to shift(-1)
    valid = y.dropna().index
    X = X.loc[valid]
    y = y.loc[valid]
    return X, y


def train_model(cfg: TrainConfig) -> None:
    end = dt.date.today() - dt.timedelta(days=1)
    start = end - dt.timedelta(days=cfg.days)
    print(f"Fetching POWER data for ({cfg.lat}, {cfg.lon}) from {start} to {end}...")
    df = fetch_power_daily(cfg.lat, cfg.lon, start, end)
    if df.empty:
        raise RuntimeError("No data fetched from NASA POWER")

    X, y = build_features(df)

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=cfg.random_state, shuffle=False
    )

    base = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=2,
        random_state=cfg.random_state,
        n_jobs=-1,
    )
    model = MultiOutputRegressor(base)
    model.fit(X_train, y_train)

    pred = pd.DataFrame(model.predict(X_val), index=y_val.index, columns=y_val.columns)
    print(
        {
            "r2": {c: float(r2_score(y_val[c], pred[c])) for c in y_val.columns},
            "mae": {c: float(mean_absolute_error(y_val[c], pred[c])) for c in y_val.columns},
        }
    )

    with open(cfg.model_path, "wb") as f:
        pickle.dump({"model": model, "feature_columns": X.columns.tolist()}, f)
    print(f"Saved model to {cfg.model_path}")


if __name__ == "__main__":
    lat = float(os.getenv("LAT", "24.7136"))
    lon = float(os.getenv("LON", "46.6753"))
    train_model(TrainConfig(lat=lat, lon=lon))
