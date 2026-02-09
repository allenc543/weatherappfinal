"""Fetch historical weather data from Open-Meteo API for 5 cities."""
import asyncio
import httpx
import pandas as pd
from pathlib import Path

CITIES = {
    "houston": (29.76, -95.37),
    "dallas": (32.78, -96.80),
    "austin": (30.27, -97.74),
    "san_antonio": (29.42, -98.49),
    "nyc": (40.71, -74.01),
}

BASE_URL = "https://archive-api.open-meteo.com/v1/archive"
START_DATE = "2020-01-01"
END_DATE = "2025-12-31"

DAILY_VARS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "rain_sum",
    "snowfall_sum",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
    "shortwave_radiation_sum",
    "sunshine_duration",
    "weather_code",
]

RENAME_MAP = {
    "temperature_2m_max": "temp_max",
    "temperature_2m_min": "temp_min",
    "precipitation_sum": "precipitation",
    "rain_sum": "rain",
    "snowfall_sum": "snowfall",
    "wind_speed_10m_max": "wind_speed",
    "wind_gusts_10m_max": "wind_gusts",
    "shortwave_radiation_sum": "radiation",
    "sunshine_duration": "sunshine",
    "weather_code": "weather_code",
}

DATA_DIR = Path(__file__).resolve().parent.parent / "backend" / "data"


async def fetch_city(client: httpx.AsyncClient, name: str, lat: float, lon: float) -> None:
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "daily": ",".join(DAILY_VARS),
        "timezone": "America/Chicago",
    }
    print(f"Fetching {name}...")
    resp = await client.get(BASE_URL, params=params, timeout=60.0)
    resp.raise_for_status()
    data = resp.json()

    daily = data["daily"]
    df = pd.DataFrame({"date": daily["time"]})
    for var in DAILY_VARS:
        col_name = RENAME_MAP[var]
        df[col_name] = daily[var]

    out_path = DATA_DIR / f"{name}.csv"
    df.to_csv(out_path, index=False)
    print(f"  Saved {out_path} ({len(df)} rows)")


async def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    async with httpx.AsyncClient() as client:
        for name, (lat, lon) in CITIES.items():
            await fetch_city(client, name, lat, lon)
            await asyncio.sleep(1.5)  # Rate limit: sequential with delay
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
