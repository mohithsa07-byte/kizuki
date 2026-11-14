# SAMPLE DATA ONLY. Milestone 4 replaces this file's logic with NASA POWER data.

MONTHLY_TEMP = [22.1, 24.0, 26.5, 28.2, 27.8, 25.4, 24.3, 24.1, 24.6, 24.0, 22.9, 21.7]
MONTHLY_RAIN = [3, 5, 12, 45, 110, 80, 105, 125, 165, 170, 60, 20]
BASE_YEAR = 2016
DRIFT_PER_YEAR = 0.02

SOURCE = "Sample data (not a real measurement)"
IS_SAMPLE = True
TEMPERATURE_NOTE = "Air temperature at 2 m. Not the same as satellite land surface temperature."


def build_timeseries(start_year: int, end_year: int) -> list[dict]:
    points = []
    for year in range(start_year, end_year + 1):
        for month in range(12):
            temp = MONTHLY_TEMP[month] + DRIFT_PER_YEAR * (year - BASE_YEAR)
            points.append(
                {
                    "date": f"{year}-{month + 1:02d}",
                    "temperature_c": round(temp, 2),
                    "rainfall_mm": float(MONTHLY_RAIN[month]),
                }
            )
    return points


def build_summary(start_year: int, end_year: int) -> dict:
    points = build_timeseries(start_year, end_year)
    years = end_year - start_year + 1
    temps = [p["temperature_c"] for p in points if p["temperature_c"] is not None]
    rain = [p["rainfall_mm"] for p in points if p["rainfall_mm"] is not None]
    return {
        "mean_temperature_c": round(sum(temps) / len(temps), 2) if temps else None,
        "mean_annual_rainfall_mm": round(sum(rain) / years, 1) if rain else None,
    }
