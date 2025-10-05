import datetime as dt
from typing import Literal, Tuple, List
import pandas as pd
import numpy as np
from nasa import fetch_power_daily

RangeMode = Literal["date", "month"]


def _days_in_month(year: int, month: int) -> int:
    next_month = month % 12 + 1
    next_year = year + (1 if month == 12 else 0)
    return (dt.date(next_year, next_month, 1) - dt.date(year, month, 1)).days


def _collect_multi_year(lat: float, lon: float, start: dt.date, end: dt.date, years: int = 5) -> pd.DataFrame:
    frames: List[pd.DataFrame] = []
    for i in range(1, years + 1):
        s = start.replace(year=start.year - i)
        e = end.replace(year=end.year - i)
        try:
            df = fetch_power_daily(lat, lon, s, e)
            df["year"] = df.index.year
            frames.append(df)
        except Exception:
            continue
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames).sort_index()


def seasonal_predict(
    lat: float,
    lon: float,
    target: dt.date,
    mode: RangeMode = "date",
    years: int = 5,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, float]:
    """
    Compute seasonal typical conditions using multi-year NASA data.
    - If mode == 'date': returns arrays of length 1 for the specific date (±3-day window typical).
    - If mode == 'month': returns arrays for each day of the next month starting from the first day of next month.
    Returns: (temp_array, humidity_array, precip_mm_array, confidence)
    """
    if mode == "date":
        # +- 3 day window around day-of-year across years
        doy = target.timetuple().tm_yday
        start_ref = target - dt.timedelta(days=3)
        end_ref = target + dt.timedelta(days=3)
        # collect for each previous year
        hist = _collect_multi_year(lat, lon, start_ref, end_ref, years=years)
        if hist.empty:
            return np.array([]), np.array([]), np.array([]), 0.5
        agg = hist.groupby(hist.index.dayofyear).agg({
            "T2M": "mean",
            "RH2M": "mean",
            "PRECTOTCORR": "mean",
        })
        # Use the central day (closest to target doy) if available, else average all
        if doy in agg.index:
            t = float(agg.loc[doy, "T2M"])
            h = float(agg.loc[doy, "RH2M"])
            p = float(agg.loc[doy, "PRECTOTCORR"])
        else:
            t = float(agg["T2M"].mean())
            h = float(agg["RH2M"].mean())
            p = float(agg["PRECTOTCORR"].mean())
        confidence = min(0.95, 0.6 + 0.05 * len(agg))
        return np.array([t]), np.array([h]), np.array([p]), confidence

    # month mode
    next_month = target.month % 12 + 1
    next_year = target.year + (1 if target.month == 12 else 0)
    first_day = dt.date(next_year, next_month, 1)
    days = _days_in_month(next_year, next_month)
    last_day = first_day + dt.timedelta(days=days - 1)

    hist = _collect_multi_year(lat, lon, first_day, last_day, years=years)
    if hist.empty:
        return np.array([]), np.array([]), np.array([]), 0.5

    # Build typical values per day-of-month
    hist["day"] = hist.index.day
    agg = hist.groupby("day").agg({
        "T2M": "mean",
        "RH2M": "mean",
        "PRECTOTCORR": "mean",
    })

    temps = np.array([float(agg.loc[d, "T2M"]) if d in agg.index else float(agg["T2M"].mean()) for d in range(1, days + 1)])
    humids = np.array([float(agg.loc[d, "RH2M"]) if d in agg.index else float(agg["RH2M"].mean()) for d in range(1, days + 1)])
    precs = np.array([float(agg.loc[d, "PRECTOTCORR"]) if d in agg.index else float(agg["PRECTOTCORR"].mean()) for d in range(1, days + 1)])

    confidence = min(0.95, 0.6 + 0.01 * len(agg))
    return temps, humids, precs, confidence
