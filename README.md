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
