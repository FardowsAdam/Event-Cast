import datetime as dt
from typing import Dict, List, Tuple
import requests
import pandas as pd

POWER_PARAMS = [
    "T2M",  # 2m air temperature (C)
    "T2M_MAX",
    "T2M_MIN",
    "RH2M",  # 2m relative humidity (%)
    "WS2M",  # 2m wind speed (m/s)
    "PRECTOTCORR",  # Precipitation (mm/day)
    "ALLSKY_SFC_UV_INDEX",  # UV Index
]

MISSING_SENTINEL = -999


def _date_str(d: dt.date) -> str:
    return d.strftime("%Y%m%d")


def fetch_power_daily(lat: float, lon: float, start: dt.date, end: dt.date, params: List[str] | None = None) -> pd.DataFrame:
    """
    Fetch NASA POWER daily data for a point between start and end (inclusive).
    Returns a DataFrame indexed by date with one column per parameter.
    """
    parameters = ",".join(params or POWER_PARAMS)
    url = (
        "https://power.larc.nasa.gov/api/temporal/daily/point"
        f"?parameters={parameters}&community=RE&longitude={lon}&latitude={lat}"
        f"&start={_date_str(start)}&end={_date_str(end)}&format=JSON"
    )
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    props = data.get("properties", {}).get("parameter", {})
    # Build a DataFrame with date index
    dates = sorted(next(iter(props.values())).keys()) if props else []
    if not dates:
        return pd.DataFrame()
    df_dict: Dict[str, List[float]] = {}
    for p in (params or POWER_PARAMS):
        series = props.get(p, {})
        df_dict[p] = [series.get(d) for d in dates]
    df = pd.DataFrame(df_dict)
    # Parse date index
    df.index = pd.to_datetime(dates, format="%Y%m%d")
    df.index.name = "date"
    # Replace missing sentinel with NaN and drop rows with no temp
    df = df.replace(MISSING_SENTINEL, pd.NA).dropna(subset=["T2M"]).astype(float)
    return df
