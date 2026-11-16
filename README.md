# KIZUKI

See the change. Understand the cause. Predict the future.

AI-powered climate visualisation and environmental intelligence platform.
Initial focus: Bengaluru, Karnataka, India.

## Structure

- `frontend/` React + Vite + Tailwind web app
- `backend/` Python FastAPI server (coming in Milestone 3)
- `datasets/` Local data files
- `docs/` Documentation

## Run the frontend

    cd frontend
    npm install
    npm run dev

## Sea Ice Monitoring

KIZUKI includes an interactive sea ice visualization layer.

### Features
- Arctic and Antarctic exploration
- Historical year selection
- Satellite-derived sea ice concentration imagery
- Integration with the Climate Explorer
- Synchronized observation timeline

### Scientific Context
Sea ice concentration represents the fraction of an
observed area covered by sea ice.

Sea ice concentration is different from sea ice extent.
Changes between selected years should not automatically
be interpreted as long-term climate trends.

<!-- KIZUKI FEATURES START -->

---

## KIZUKI | GeoAI Climate Intelligence Platform

**See the change. Understand the cause.**

KIZUKI is a geospatial climate exploration platform that brings together historical climate observations, satellite imagery, vegetation analysis, and polar sea ice monitoring in an interactive web application.

### Key Features

#### 1. Climate Explorer
- Explore historical temperature and precipitation data.
- Select locations or interact directly with the global map.
- Compare observation years.
- Visualize annual climate trends.
- Examine year-over-year differences.

**Data source:** NASA POWER.

#### 2. Satellite Temperature Visualization
- NASA MODIS Terra land-surface temperature imagery.
- Interactive global satellite map.
- Historical observation-year selection.
- Satellite imagery over OpenStreetMap or satellite basemaps.

**Important:** Satellite land-surface temperature is different from near-surface air temperature.

#### 3. Vegetation and NDVI Analysis
- Satellite-derived vegetation monitoring.
- Historical NDVI observations.
- Vegetation comparisons across selected years.
- Regional vegetation-change exploration.

**Data source:** NASA MODIS.

#### 4. Arctic and Antarctic Sea Ice Monitoring
- Sea ice concentration visualization.
- Arctic and Antarctic region selection.
- Historical satellite imagery.
- Polar exploration through NASA Worldview.

**Data source:** NASA GIBS / AMSR2.

Sea ice concentration describes the fraction of an observed area covered by sea ice. Polar imagery availability depends on the selected layer, date, and map projection.

#### 5. Polar Sea Ice Intelligence
- Arctic September sea ice extent trends.
- Antarctic February sea ice extent trends.
- Historical comparison charts.
- Selected-year and comparison-year statistics.
- Extent differences measured in million square kilometres.

**Data source:** NSIDC Sea Ice Index, Version 4.

Sea ice extent and sea ice concentration are different measurements. Extent typically counts ocean areas with at least 15% sea ice concentration.

#### 6. Dynamic Satellite Map Legends
- Context-aware map legends.
- NASA satellite colour-scale requests.
- Sea ice concentration explanations.
- Land-surface temperature explanations.
- Rainfall measurement guidance.

#### 7. Interactive Climate Timeline
- Historical year selection.
- Comparison-year controls.
- Synchronized climate visualizations.
- Interactive time-series charts.

#### 8. Reports and Satellite Comparison
- Climate report interface.
- Historical satellite comparison interface.
- Location-based climate statistics.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Maps | Leaflet, React Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| Climate observations | NASA POWER |
| Vegetation observations | NASA MODIS |
| Satellite imagery | NASA GIBS |
| Sea ice extent | NSIDC Sea Ice Index v4 |
| Frontend deployment | Vercel |
| Backend deployment | Vercel |

---

## Live Application

**Frontend:** https://kizuki-zu3p.vercel.app/

**Backend:** https://kizuki-eta.vercel.app/

**Repository:** https://github.com/mohithsa07-byte/kizuki

---

## Data Sources and Scientific Notes

KIZUKI integrates multiple scientific datasets. Their measurements, spatial resolutions, temporal coverage, and limitations are not interchangeable.

- **NASA POWER:** Gridded historical climate estimates.
- **NASA MODIS:** Satellite-derived land-surface and vegetation observations.
- **NASA GIBS:** Satellite imagery visualization services.
- **NSIDC:** Historical sea ice extent records.

A difference between two selected years does not, by itself, establish a long-term climate trend.

Satellite imagery may be unavailable for certain dates or map projections. Data availability and quality should be checked before drawing conclusions.

### Official References

- [NASA POWER](https://power.larc.nasa.gov/)
- [NASA Earthdata](https://www.earthdata.nasa.gov/)
- [NASA Worldview](https://worldview.earthdata.nasa.gov/)
- [NSIDC Sea Ice Index](https://nsidc.org/data/seaice_index)

---

## Project Vision

KIZUKI aims to make climate and environmental data easier to explore, compare, and interpret through accessible geospatial visualization.

**KIZUKI — See the change. Understand the cause.**

<!-- KIZUKI FEATURES END -->

## Satellite and Climate Data Sources

KIZUKI integrates multiple Earth-observation and climate datasets to support environmental exploration and visualization.

| Source | Application |
|---|---|
| NASA POWER | Historical temperature and rainfall data |
| NASA MODIS (Terra) | Land-surface temperature and vegetation monitoring |
| NASA GIBS | Satellite imagery overlays through WMS |
| JAXA GCOM-W1 / AMSR2 | Sea ice concentration visualization |
| NSIDC | Historical Arctic and Antarctic sea ice extent |
| Copernicus Sentinel-2 / EOX | High-resolution, Sentinel-2-derived cloudless satellite imagery |

### Sentinel-2 Integration

KIZUKI includes a Sentinel-2 imagery option in Climate Explorer.

- Displays a true-colour cloudless mosaic derived from Copernicus Sentinel-2 observations.
- Uses the EOX WMS imagery service.
- Allows users to switch between Sentinel-2 imagery and other climate map layers.
- Supports geographical exploration using the existing React Leaflet interface.

**Data clarification:** The EOX cloudless mosaic is not equivalent to a date-specific Sentinel-2 Level-2A scene. Date-specific L2A imagery in the comparison workflow should only be claimed after its implementation has been verified.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | JavaScript, React, JSX, Vite |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Mapping | Leaflet, React Leaflet |
| Visualizations | Recharts |
| Satellite Imagery | NASA GIBS WMS, Copernicus Sentinel-2 / EOX |
| Climate Data | NASA POWER, MODIS, NSIDC |
| Deployment | Vercel |
| Version Control | Git, GitHub |

<!-- KIZUKI_AI_PROJECTION_START -->

## AI-Assisted Climate Projection Lab

KIZUKI combines historical climate observations, statistical trend projections, and large language model (LLM) interpretation to make climate information more accessible.

### Live Application

- **Frontend:** https://kizuki-zu3p.vercel.app/
- **Backend:** https://kizuki-eta.vercel.app/
- **Climate Projection Lab:** https://kizuki-zu3p.vercel.app/forecast

### How the Projection System Works

1. Users select a geographic location, climate variable, and future projection year.
2. KIZUKI retrieves historical climate observations from NASA POWER.
3. Monthly observations are aggregated into complete annual records.
4. A regularized least-squares linear trend is fitted to historical observations.
5. The trend is extrapolated to the selected future year.
6. Users can adjust the trend sensitivity to explore alternative assumptions.
7. NVIDIA Nemotron generates a natural-language interpretation of the resulting projection.

The LLM explains the numerical results; it does not calculate or modify the regression model's projections.

### AI Architecture

| Component | Technology | Purpose |
|---|---|---|
| Historical climate data | NASA POWER API | Temperature and precipitation observations |
| Statistical projection | Regularized linear regression | Trend extrapolation |
| AI interpretation | NVIDIA Nemotron 3.5 Lightning 30B A3B | Explain projections and limitations |
| Backend | Python, FastAPI, HTTPX | API requests and LLM integration |
| Frontend | React, Vite, Tailwind CSS | Interactive climate exploration |
| Charts | Recharts | Historical and projected data visualization |
| Mapping | React Leaflet | Geographic selection |
| Deployment | Vercel | Frontend and backend hosting |

### AI Projection Workflow

```text
User selects location, variable and projection year
                       |
                       v
           NASA POWER historical data
                       |
                       v
          Annual climate aggregation
                       |
                       v
       Regularized linear trend fitting
                       |
                       v
       Baseline and adjusted projections
                       |
                       v
       NVIDIA Nemotron LLM interpretation
                       |
                       v
      AI Climate Interpretation interface
```

### AI Interpretation Endpoint

`POST /api/analyst/projection-insight`

Example request:

```json
{
  "location": "Bengaluru (12.9716, 77.5946)",
  "variable": "temperature",
  "first_year": 1990,
  "last_year": 2025,
  "target_year": 2040,
  "last_observed": 25.1,
  "baseline": 26.0,
  "adjusted": 26.3,
  "sensitivity": 0.2
}
```

The numerical values above are illustrative API inputs, not verified climate measurements.

Example response structure:

```json
{
  "interpretation": "AI-generated explanation of the supplied projection.",
  "model": "nvidia/nemotron-3.5-lightning-30b-a3b",
  "method": "LLM interpretation of statistical projection",
  "is_validated_forecast": false
}
```

The backend requires an `NVIDIA_API_KEY` environment variable.
An optional `NVIDIA_MODEL` variable can override the default model.

Never expose the NVIDIA API key in frontend code or commit it to Git.

### Scientific Transparency

KIZUKI's Climate Projection Lab provides **exploratory statistical projections**, not validated AI climate forecasts.

Important limitations:

- Linear extrapolation assumes historical trends provide useful future context.
- The adjustable trend sensitivity is not a physical emissions scenario.
- The displayed uncertainty envelope is heuristic, not a calibrated confidence or prediction interval.
- Long-term temperature and precipitation patterns may be nonlinear.
- NVIDIA Nemotron provides interpretation, not numerical forecast validation.
- These results should not be used independently for policy, infrastructure, or safety-critical decisions.

For rigorous climate planning, validated climate models and scenario-based projections, such as CMIP6, should be considered.

### Current Development Status

The AI interpretation feature has been implemented in source code as a proposed integration. Its production availability should be confirmed through deployment and end-to-end testing.

<!-- KIZUKI_AI_PROJECTION_END -->
