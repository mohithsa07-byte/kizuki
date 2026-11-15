import OverviewHero from '../components/OverviewHero'

import { useMemo, useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import ClimateChart from '../charts/ClimateChart'
import TrendChart from '../charts/TrendChart'
import useApi from '../hooks/useApi'

const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i)

const DEFAULT_SELECTION = {
  type: 'region',
  id: 'bengaluru-urban',
  name: 'Bengaluru',
  lat: 12.9716,
  lng: 77.5946,
}

const BASEMAPS = {
  dark: {
    label: 'Dark',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    className: 'osm-dark',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    className: '',
  },
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function mean(values) {
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null
}

function buildCharts(points = []) {
  const monthly = MONTHS.map((month, index) => {
    const rows = points.filter(
      (point) => Number(point.date.slice(5)) === index + 1,
    )

    const temperatures = rows
      .filter((row) => row.temperature_c !== null)
      .map((row) => row.temperature_c)

    const rainfall = rows
      .filter((row) => row.rainfall_mm !== null)
      .map((row) => row.rainfall_mm)

    const temperature = mean(temperatures)
    const rain = mean(rainfall)

    return {
      month,
      temp: temperature === null ? null : Number(temperature.toFixed(2)),
      rain: rain === null ? null : Number(rain.toFixed(1)),
    }
  })

  const byYear = {}

  points.forEach((point) => {
    const year = point.date.slice(0, 4)
    byYear[year] = byYear[year] || []

    if (point.temperature_c !== null) {
      byYear[year].push(point.temperature_c)
    }
  })

  const yearly = Object.entries(byYear)
    .filter(([, values]) => values.length === 12)
    .map(([year, values]) => ({
      year: Number(year),
      temp: Number(mean(values).toFixed(2)),
    }))

  return { monthly, yearly }
}

function buildInsights(monthly) {
  const temperatures = monthly.filter((item) => item.temp !== null)
  const rainfall = monthly.filter((item) => item.rain !== null)
  const insights = []

  if (temperatures.length) {
    const hottest = temperatures.reduce((a, b) =>
      b.temp > a.temp ? b : a,
    )
    const coolest = temperatures.reduce((a, b) =>
      b.temp < a.temp ? b : a,
    )

    insights.push({
      title: 'Temperature pattern',
      description: `${hottest.month} is the warmest month on average at ${hottest.temp} °C. ${coolest.month} is the coolest at ${coolest.temp} °C.`,
    })
  }

  if (rainfall.length) {
    const wettest = rainfall.reduce((a, b) =>
      b.rain > a.rain ? b : a,
    )

    insights.push({
      title: 'Rainfall pattern',
      description: `${wettest.month} receives the highest average monthly rainfall at ${wettest.rain} mm.`,
    })
  }

  return insights
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

function MapFocus({ selection }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo([selection.lat, selection.lng], 5, {
      duration: 1.2,
    })
  }, [map, selection.lat, selection.lng])

  return null
}

function StatusTag({ children, type = 'real' }) {
  const styles = {
    real: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    unavailable: 'border-white/10 bg-white/[0.04] text-slate-400',
    warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${styles[type]}`}
    >
      {children}
    </span>
  )
}

function MetricCard({ label, value, unit, description, status }) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-[#0c1724]/90 p-4 transition duration-300 hover:border-emerald-300/25 hover:bg-[#101e2d] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <span
          className={`mt-1 h-2 w-2 rounded-full ${
            ['NASA POWER', 'Sentinel-2'].includes(status)
              ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
              : 'bg-slate-600'
          }`}
        />
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-emerald-300">{unit}</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500">{description}</p>
        <StatusTag type={['NASA POWER', 'Sentinel-2'].includes(status) ? 'real' : 'unavailable'}>
          {status}
        </StatusTag>
      </div>
    </div>
  )
}

function SectionHeading({ eyebrow, title, detail }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
        {eyebrow}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-white sm:text-xl">
          {title}
        </h2>
        {detail && <p className="text-xs text-slate-500">{detail}</p>}
      </div>
    </div>
  )
}

function useOverviewNDVI(lat, lng) {
  const [result, setResult] = useState({
    data: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setResult({
        data: null,
        loading: true,
        error: null
      })

      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        max_cloud: '30'
      })

      try {
        const response = await fetch(
          `https://kizuki-eta.vercel.app/api/satellite/ndvi?${params}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`Satellite API HTTP ${response.status}`)
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setResult({
            data,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            data: null,
            loading: false,
            error: error.message
          })
        }
      }
    }

    load()
    return () => controller.abort()
  }, [lat, lng])

  return result
}
export default function Overview() {
  const [startYear, setStartYear] = useState(2016)
  const [endYear, setEndYear] = useState(2023)
  const [basemap, setBasemap] = useState('dark')
  const [selection, setSelection] = useState(DEFAULT_SELECTION)

  const overviewNDVI = useOverviewNDVI(
    Number(selection.lat.toFixed(4)),
    Number(selection.lng.toFixed(4))
  )

  const measuredNDVI =
    overviewNDVI.data?.status === 'available' &&
    overviewNDVI.data?.is_sample === false
      ? overviewNDVI.data?.mean_ndvi
      : null
  const regions = useApi('/api/regions')

  const locationQuery =
    selection.type === 'region'
      ? `region_id=${selection.id}`
      : `lat=${selection.lat.toFixed(4)}&lng=${selection.lng.toFixed(4)}`

  const query = `${locationQuery}&start_year=${startYear}&end_year=${endYear}`

  const summary = useApi(`/api/climate/summary?${query}`)
  const series = useApi(`/api/climate/timeseries?${query}`)

  const charts = useMemo(
    () => (series.data ? buildCharts(series.data.points) : null),
    [series.data],
  )

  const insights = charts ? buildInsights(charts.monthly) : []
  const loading = summary.loading || series.loading
  const error = summary.error || series.error

  const summaryData = summary.data
  const temperature =
    summaryData?.mean_temperature_c ?? null
  const rainfall =
    summaryData?.mean_annual_rainfall_mm ?? null

  const cityList = regions.data || []
  const base = BASEMAPS[basemap]

  function changeStart(value) {
    setStartYear(value)
    if (value > endYear) setEndYear(value)
  }

  function changeEnd(value) {
    setEndYear(value)
    if (value < startYear) setStartYear(value)
  }

  function pickPoint(lat, lng) {
    setSelection({
      type: 'point',
      name: `Selected location`,
      lat,
      lng,
    })
  }

  function pickRegion(region) {
    setSelection({
      type: 'region',
      id: region.id,
      name: region.name,
      lat: region.lat,
      lng: region.lng,
    })
  }

  return (
    <div className="min-h-screen bg-[#07111c] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* Premium KIZUKI Overview */}
        <OverviewHero
          selection={selection}
          startYear={startYear}
          endYear={endYear}
        />

        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-200">
            Could not load climate data: {error}
          </div>
        )}

        {/* Main metrics */}
        <section>
          <SectionHeading
            eyebrow="Environmental snapshot"
            title="Climate at a glance"
            detail={loading ? 'Updating data…' : 'Historical period average'}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Mean air temperature"
              value={temperature !== null ? temperature : loading ? '…' : 'N/A'}
              unit="°C"
              description="Air temperature at 2 metres"
              status={summaryData ? 'NASA POWER' : 'Unavailable'}
            />

            <MetricCard
              label="Mean annual rainfall"
              value={rainfall !== null ? rainfall : loading ? '…' : 'N/A'}
              unit="mm"
              description="Annualised precipitation"
              status={summaryData ? 'NASA POWER' : 'Unavailable'}
            />

                        <MetricCard
              label="Vegetation index"
              value={
                overviewNDVI.loading
                  ? '...'
                  : measuredNDVI != null
                    ? Number(measuredNDVI).toFixed(4)
                    : 'N/A'
              }
              description={
                measuredNDVI != null
                  ? `Point NDVI · ${overviewNDVI.data.scene_date?.slice(0, 10) || '2024'}`
                  : overviewNDVI.loading
                    ? 'Loading Sentinel-2 observation'
                    : 'No valid 2024 point observation'
              }
              status={
                measuredNDVI != null
                  ? 'Sentinel-2'
                  : overviewNDVI.loading
                    ? 'Loading'
                    : 'Unavailable'
              }
            />

            <MetricCard
              label="Air quality index"
              value="N/A"
              description="Air quality source not connected"
              status="Not connected"
            />
          </div>
        </section>

        {/* Map and region controls */}
        <section>
          <SectionHeading
            eyebrow="Geospatial intelligence"
            title="Explore the planet"
            detail="Select a city or click anywhere on the map"
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="relative h-[380px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b1723] sm:h-[480px]">
              <MapContainer
                center={[20, 10]}
                zoom={2}
                minZoom={2}
                maxZoom={12}
                zoomControl={false}
                className="h-full w-full"
                style={{ background: '#07111c' }}
              >
                <TileLayer
                  key={basemap}
                  url={base.url}
                  attribution={base.attribution}
                  className={base.className}
                  noWrap
                />

                <ZoomControl position="bottomright" />
                <MapClickHandler onPick={pickPoint} />
                <MapFocus selection={selection} />

                {cityList.map((region) => (
                  <CircleMarker
                    key={region.id}
                    center={[region.lat, region.lng]}
                    radius={selection.id === region.id ? 7 : 5}
                    pathOptions={{
                      color: '#d1fae5',
                      fillColor: '#34d399',
                      fillOpacity: 0.9,
                      weight: 1,
                    }}
                    eventHandlers={{
                      click: (event) => {
                        event.originalEvent.stopPropagation()
                        pickRegion(region)
                      },
                    }}
                  >
                    <Tooltip>
                      {region.name}
                      {region.country ? `, ${region.country}` : ''}
                    </Tooltip>
                  </CircleMarker>
                ))}

                <CircleMarker
                  center={[selection.lat, selection.lng]}
                  radius={10}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: '#10b981',
                    fillOpacity: 1,
                    weight: 2,
                  }}
                >
                  <Tooltip>{selection.name}</Tooltip>
                </CircleMarker>
              </MapContainer>

              <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-white/10 bg-[#081522]/90 px-3 py-2 backdrop-blur-xl">
                <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                  Active location
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  {selection.name}
                </p>
              </div>

              <div className="absolute bottom-4 left-4 z-[500] flex gap-1 rounded-lg border border-white/10 bg-[#081522]/90 p-1 backdrop-blur-xl">
                {Object.entries(BASEMAPS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBasemap(key)}
                    className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${
                      basemap === key
                        ? 'bg-emerald-400/15 text-emerald-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-white/[0.08] bg-[#0c1724] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Location controls
              </p>

              <h3 className="mt-2 font-display text-lg font-semibold text-white">
                Choose a region
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Select a supported region to load its climate records.
              </p>

              <div className="mt-5 space-y-2">
                {cityList.length ? (
                  cityList.map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => pickRegion(region)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                        selection.type === 'region' &&
                        selection.id === region.id
                          ? 'border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200'
                          : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-sm font-medium">{region.name}</span>
                      <span className="text-xs opacity-60">↗</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    Loading available regions…
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-white/[0.08] pt-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Selected coordinates
                </p>
                <p className="mt-2 font-mono text-xs text-slate-300">
                  {selection.lat.toFixed(4)}°, {selection.lng.toFixed(4)}°
                </p>
                <button
                  type="button"
                  onClick={() => setSelection(DEFAULT_SELECTION)}
                  className="mt-4 w-full rounded-lg border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-emerald-300/30 hover:text-emerald-300"
                >
                  Reset to Bengaluru
                </button>
              </div>
            </aside>
          </div>
        </section>

        {/* Historical analytics */}
        <section>
          <SectionHeading
            eyebrow="Historical climate records"
            title="Patterns over time"
            detail="Monthly averages and yearly trends"
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1724] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Monthly climate profile
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Average temperature and rainfall by month
                  </p>
                </div>
                <StatusTag>NASA POWER</StatusTag>
              </div>

              {loading && (
                <p className="py-12 text-center text-xs text-slate-500">
                  Loading climate records…
                </p>
              )}

              {!loading && charts && (
                <ClimateChart data={charts.monthly} />
              )}

              {!loading && !charts && (
                <p className="py-12 text-center text-xs text-slate-500">
                  No climate records available for this selection.
                </p>
              )}
            </div>

            <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1724] p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Annual temperature trend
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Mean temperature for complete calendar years
                  </p>
                </div>
                <StatusTag>NASA POWER</StatusTag>
              </div>

              {loading && (
                <p className="py-12 text-center text-xs text-slate-500">
                  Loading yearly trends…
                </p>
              )}

              {!loading && charts?.yearly.length > 0 && (
                <TrendChart data={charts.yearly} />
              )}

              {!loading && charts?.yearly.length === 0 && (
                <p className="py-12 text-center text-xs text-slate-500">
                  No complete years available in this date range.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Insights */}
        <section>
          <SectionHeading
            eyebrow="Data interpretation"
            title="What the records reveal"
            detail="Automatically derived from the selected period"
          />

          <div className="grid gap-3 md:grid-cols-2">
            {insights.length ? (
              insights.map((insight) => (
                <div
                  key={insight.title}
                  className="rounded-2xl border border-white/[0.08] bg-[#0c1724] p-5"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">
                      {insight.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {insight.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1724] p-5 text-sm text-slate-500">
                {loading
                  ? 'Analysing the selected climate records…'
                  : 'Insights will appear when climate records are available.'}
              </div>
            )}
          </div>
        </section>

        {/* Period and methodology */}
        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1724] p-5">
            <SectionHeading
              eyebrow="Time controls"
              title="Choose analysis period"
            />

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-[10px] uppercase tracking-wider text-slate-500">
                  Start year
                </span>
                <select
                  value={startYear}
                  onChange={(event) => changeStart(Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-[#101e2d] px-3 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] uppercase tracking-wider text-slate-500">
                  End year
                </span>
                <select
                  value={endYear}
                  onChange={(event) => changeEnd(Number(event.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-[#101e2d] px-3 py-3 text-sm text-white outline-none focus:border-emerald-300/50"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="mt-4 text-[11px] text-slate-500">
              Changing the period reloads the climate summary and historical
              time series.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1724] p-5">
            <SectionHeading
              eyebrow="Methodology"
              title="Know your data"
            />

            <div className="space-y-3 text-xs leading-5 text-slate-400">
              <p>
                <strong className="text-slate-200">Source:</strong>{' '}
                NASA POWER monthly point data.
              </p>
              <p>
                <strong className="text-slate-200">Temperature:</strong>{' '}
                Air temperature at 2 metres (T2M), not satellite land surface
                temperature.
              </p>
              <p>
                <strong className="text-slate-200">Spatial resolution:</strong>{' '}
                Approximately 0.5° × 0.625° grid cells, around 50 km. These
                values do not represent precise neighbourhood measurements.
              </p>
              <p>
                <strong className="text-slate-200">Rainfall:</strong>{' '}
                Monthly precipitation totals derived from NASA POWER daily
                precipitation rates.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.07] py-4 text-center text-[10px] tracking-wide text-slate-600">
          KIZUKI · SEE THE CHANGE. UNDERSTAND THE CAUSE. PREDICT THE FUTURE.
        </footer>
      </div>
    </div>
  )
}
