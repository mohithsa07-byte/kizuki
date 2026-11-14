import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, ZoomControl } from 'react-leaflet'
import ClimateChart from '../charts/ClimateChart'
import TrendChart from '../charts/TrendChart'
import useApi from '../hooks/useApi'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i)
const CENTER = [12.9716, 77.5946]

const BASEMAPS = {
  dark: {
    label: 'Dark map',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    className: 'osm-dark',
  },
  satellite: {
    label: 'Satellite imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
}

// Legend scale: fixed range so colours mean the same thing every time.
const SCALE_MIN = 18
const SCALE_MAX = 32
const STOPS = ['#1d4ed8', '#2dd4bf', '#34d399', '#facc15', '#f97316', '#ef4444']

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function tempColor(value) {
  if (value === null || value === undefined) return '#94a3b8'
  const norm = Math.min(1, Math.max(0, (value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)))
  const pos = norm * (STOPS.length - 1)
  const i = Math.min(STOPS.length - 2, Math.floor(pos))
  const f = pos - i
  const a = hexToRgb(STOPS[i])
  const b = hexToRgb(STOPS[i + 1])
  const mix = a.map((v, k) => Math.round(v + (b[k] - v) * f))
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function buildCharts(points) {
  const monthly = MONTHS.map((month, i) => {
    const rows = points.filter((p) => Number(p.date.slice(5)) === i + 1)
    const temp = mean(rows.filter((r) => r.temperature_c !== null).map((r) => r.temperature_c))
    const rain = mean(rows.filter((r) => r.rainfall_mm !== null).map((r) => r.rainfall_mm))
    return {
      month,
      temp: temp === null ? null : Number(temp.toFixed(2)),
      rain: rain === null ? null : Number(rain.toFixed(1)),
    }
  })

  const byYear = {}
  points.forEach((p) => {
    const year = p.date.slice(0, 4)
    byYear[year] = byYear[year] || []
    if (p.temperature_c !== null) byYear[year].push(p.temperature_c)
  })
  // Only complete years (12 valid months) are used for the yearly mean.
  const yearly = Object.entries(byYear)
    .filter(([, temps]) => temps.length === 12)
    .map(([year, temps]) => ({ year: Number(year), temp: Number(mean(temps).toFixed(2)) }))

  return { monthly, yearly }
}

function buildInsights(monthly) {
  const withTemp = monthly.filter((m) => m.temp !== null)
  const withRain = monthly.filter((m) => m.rain !== null)
  const insights = []
  if (withTemp.length) {
    const hottest = withTemp.reduce((a, b) => (b.temp > a.temp ? b : a))
    const coolest = withTemp.reduce((a, b) => (b.temp < a.temp ? b : a))
    insights.push(`Hottest month on average: ${hottest.month} (${hottest.temp} °C). Coolest: ${coolest.month} (${coolest.temp} °C).`)
  }
  if (withRain.length) {
    const wettest = withRain.reduce((a, b) => (b.rain > a.rain ? b : a))
    insights.push(`Wettest month on average: ${wettest.month} (${wettest.rain} mm).`)
  }
  return insights
}

const TONES = {
  real: 'text-emerald-glow border-emerald-glow/30 bg-emerald-glow/10',
  sample: 'text-amber-300 border-amber-300/30 bg-amber-300/10',
  off: 'text-gray-400 border-white/10 bg-white/5',
}

function Tag({ tone, children }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONES[tone]}`}>
      {children}
    </span>
  )
}

function Kpi({ label, value, unit, tag, tone }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-white">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-emerald-glow">{unit}</span>}
      </p>
      <div className="mt-1.5"><Tag tone={tone}>{tag}</Tag></div>
    </div>
  )
}

function LayerRow({ label, hint, checked, onChange, disabled, tag, tone }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
        disabled
          ? 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-70'
          : checked
            ? 'border-emerald-glow/40 bg-emerald-glow/10'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-100">{label}</span>
        {hint && <span className="block text-[11px] text-gray-500">{hint}</span>}
      </span>
      {tag ? (
        <Tag tone={tone}>{tag}</Tag>
      ) : (
        <span className={`h-4 w-4 shrink-0 rounded-full border ${checked ? 'border-emerald-glow bg-emerald-glow' : 'border-gray-500'}`} />
      )}
    </button>
  )
}

const selectClass =
  'rounded-md border border-white/10 bg-navy-900/90 px-2 py-1 text-xs text-gray-200 outline-none focus:border-emerald-glow/50'

export default function Overview() {
  const [startYear, setStartYear] = useState(2016)
  const [endYear, setEndYear] = useState(2023)
  const [basemap, setBasemap] = useState('dark')
  const [showCell, setShowCell] = useState(true)
  const regionId = 'bengaluru-urban'

  const query = `region_id=${regionId}&start_year=${startYear}&end_year=${endYear}`
  const summary = useApi(`/api/climate/summary?${query}`)
  const series = useApi(`/api/climate/timeseries?${query}`)

  const charts = useMemo(
    () => (series.data ? buildCharts(series.data.points) : null),
    [series.data],
  )
  const insights = charts ? buildInsights(charts.monthly) : []

  const loading = summary.loading || series.loading
  const error = summary.error || series.error

  function changeStart(value) {
    setStartYear(value)
    if (value > endYear) setEndYear(value)
  }
  function changeEnd(value) {
    setEndYear(value)
    if (value < startYear) setStartYear(value)
  }

  const s = summary.data
  const temp = s && s.mean_temperature_c !== null ? s.mean_temperature_c : null
  const rain = s && s.mean_annual_rainfall_mm !== null ? s.mean_annual_rainfall_mm : null
  const cellColor = tempColor(temp)
  const base = BASEMAPS[basemap]

  const trackLeft = ((startYear - YEARS[0]) / (YEARS.length - 1)) * 100
  const trackWidth = Math.max(2, ((endYear - startYear) / (YEARS.length - 1)) * 100)
  const markerLeft = ((startYear - YEARS[0]) / (YEARS.length - 1)) * 100

  return (
    <div className="absolute inset-0">
      <MapContainer center={CENTER} zoom={8} zoomControl={false} className="h-full w-full" style={{ background: '#060b16' }}>
        <TileLayer key={basemap} url={base.url} attribution={base.attribution} className={base.className} />
        <ZoomControl position="bottomright" />
        {showCell && (
          <Circle
            center={CENTER}
            radius={25000}
            pathOptions={{ color: cellColor, fillColor: cellColor, fillOpacity: 0.35, weight: 2 }}
          >
            <Tooltip sticky>
              Bengaluru Urban · approximate NASA POWER grid cell
              {temp !== null ? ` · ${temp} °C mean air temperature` : ''}
            </Tooltip>
          </Circle>
        )}
        <CircleMarker center={CENTER} radius={6} pathOptions={{ color: '#ffffff', fillColor: '#34d399', fillOpacity: 1, weight: 2 }}>
          <Tooltip>Bengaluru Urban (query point)</Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Floating panels */}
      <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col gap-3 p-3">
        {/* KPI strip */}
        <div className="glass-panel-strong pointer-events-auto flex max-w-3xl divide-x divide-white/10 self-start overflow-hidden rounded-2xl">
          <Kpi label="Avg temperature" value={temp !== null ? temp : s ? 'N/A' : '...'} unit="°C" tag={s ? 'NASA POWER' : 'Loading'} tone={s ? 'real' : 'off'} />
          <Kpi label="Annual rainfall" value={rain !== null ? rain : s ? 'N/A' : '...'} unit="mm" tag={s ? 'NASA POWER' : 'Loading'} tone={s ? 'real' : 'off'} />
          <Kpi label="Vegetation (NDVI)" value="0.42" unit="" tag="Sample" tone="sample" />
          <Kpi label="Air quality" value="N/A" unit="" tag="Not connected" tone="off" />
        </div>

        {error && (
          <div className="glass-panel-strong pointer-events-auto max-w-xl self-start rounded-xl border-red-400/30 p-3 text-sm text-red-200">
            Could not load climate data: {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1 justify-between gap-3">
          {/* Left: region and analytics */}
          <aside className="glass-panel pointer-events-auto hidden w-[340px] shrink-0 flex-col overflow-hidden rounded-2xl lg:flex">
            <div className="border-b border-white/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-glow">Region</p>
              <h1 className="mt-1 font-display text-xl font-semibold text-white">Bengaluru Urban</h1>
              <p className="text-xs text-gray-400">Karnataka, India · {startYear} to {endYear}</p>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
              {loading && !error && <p className="text-sm text-gray-400">Loading from NASA POWER...</p>}
              {charts && !error && (
                <>
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white">Monthly temperature and rainfall</h2>
                      <Tag tone="real">NASA POWER</Tag>
                    </div>
                    <ClimateChart data={charts.monthly} />
                  </section>
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white">Yearly mean temperature</h2>
                      <Tag tone="real">NASA POWER</Tag>
                    </div>
                    {charts.yearly.length > 0 ? (
                      <TrendChart data={charts.yearly} />
                    ) : (
                      <p className="text-sm text-gray-500">No complete years in this range.</p>
                    )}
                  </section>
                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-white">Insights</h2>
                    <ul className="space-y-2">
                      {insights.map((text) => (
                        <li key={text} className="flex gap-2 text-xs text-gray-300">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-glow" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </div>
          </aside>

          {/* Right: layers and data */}
          <aside className="glass-panel pointer-events-auto hidden w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl xl:flex">
            <div className="border-b border-white/10 p-4">
              <h2 className="font-display text-base font-semibold text-white">Map layers and data</h2>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Basemap</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(BASEMAPS).map(([key, b]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBasemap(key)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        basemap === key ? 'border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow' : 'border-white/10 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </section>
              <section className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Data layers</p>
                <LayerRow label="Air temperature (grid cell)" hint="NASA POWER T2M, about 50 km cell" checked={showCell} onChange={setShowCell} />
                <LayerRow label="Vegetation (NDVI)" hint="Needs Sentinel-2 processing" disabled tag="Not connected" tone="off" />
                <LayerRow label="Land surface temperature" hint="Satellite LST, different from air temperature" disabled tag="Not connected" tone="off" />
                <LayerRow label="Air quality" hint="No reliable source yet" disabled tag="Not connected" tone="off" />
              </section>
              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">About this data</p>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li>Values come from a gridded model product, not a weather station. City-scale differences are not resolved.</li>
                  <li>{s ? s.temperature_note : 'Air temperature at 2 m from NASA POWER.'}</li>
                  <li>The circle on the map is an approximate cell outline. It is not a measured boundary.</li>
                  <li>The NDVI value above is sample data.</li>
                </ul>
              </section>
            </div>
          </aside>
        </div>

        {/* Bottom: legend and timeline */}
        <div className="glass-panel-strong pointer-events-auto mx-auto w-full max-w-3xl rounded-2xl p-3 sm:p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="sm:w-1/3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Mean air temperature</p>
              <div className="legend-bar" />
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>{SCALE_MIN} °C</span>
                <span>{SCALE_MAX} °C</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Period</p>
                <div className="flex items-center gap-2">
                  <select className={selectClass} value={startYear} onChange={(e) => changeStart(Number(e.target.value))}>
                    {YEARS.map((y) => <option key={y}>{y}</option>)}
                  </select>
                  <span className="text-xs text-gray-500">to</span>
                  <select className={selectClass} value={endYear} onChange={(e) => changeEnd(Number(e.target.value))}>
                    {YEARS.map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-white/10">
                <div
                  className="absolute top-0 h-2 rounded-full bg-gradient-to-r from-emerald-glow to-teal-glow"
                  style={{ left: `${trackLeft}%`, width: `${Math.min(trackWidth, 100 - trackLeft)}%` }}
                />
                <div
                  className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-emerald-glow"
                  style={{ left: `${markerLeft}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                <span>{YEARS[0]}</span>
                <span>{YEARS[YEARS.length - 1]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}