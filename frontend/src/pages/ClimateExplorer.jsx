import SatelliteComparison from '../components/SatelliteComparison'
import GlobalClimateHeatmap from '../components/GlobalClimateHeatmap'
import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
  ZoomControl
} from 'react-leaflet'
import { Link } from 'react-router-dom'
import {
  Globe2,
  Thermometer,
  CloudRain,
  MapPin,
  Satellite,
  ArrowUpRight,
  CalendarDays
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts'
import useApi from '../hooks/useApi'

const DEFAULT = {
  id: 'bengaluru-urban',
  name: 'Bengaluru',
  lat: 12.9716,
  lng: 77.5946
}

const YEARS = Array.from(
  { length: 16 },
  (_, i) => 2010 + i
)

const SELECT_STYLE =
  'w-full appearance-none rounded-xl border border-white/10 bg-[#112331] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60'

function MapEvents({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        id: null,
        name: 'Custom location',
        lat: event.latlng.lat,
        lng: event.latlng.lng
      })
    }
  })

  return null
}

function MapCamera({ location }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(
      [location.lat, location.lng],
      Math.max(map.getZoom(), 4),
      { duration: 1 }
    )
  }, [location.lat, location.lng, map])

  return null
}

function Panel({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-[#0c1a28] p-5 ${className}`}
    >
      {children}
    </div>
  )
}

function Metric({ icon: Icon, title, value, unit, detail }) {
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
          {title}
        </p>
        <Icon size={19} className="text-emerald-300" />
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold text-white">
          {value}
        </span>
        <span className="text-sm text-emerald-300">
          {unit}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {detail}
      </p>
    </Panel>
  )
}

function summarizeYear(points, year) {
  const rows = points.filter(
    point => Number(String(point.date).slice(0, 4)) === year
  )

  const temps = rows
    .map(point => point.temperature_c)
    .filter(value => typeof value === 'number' && Number.isFinite(value))

  const rain = rows
    .map(point => point.rainfall_mm)
    .filter(value => typeof value === 'number' && Number.isFinite(value))

  return {
    year,
    temp: temps.length === 12
      ? Number((temps.reduce((a, b) => a + b, 0) / 12).toFixed(2))
      : null,
    rain: rain.length === 12
      ? Number(rain.reduce((a, b) => a + b, 0).toFixed(1))
      : null
  }
}

function display(value, digits = 1) {
  return value == null ? 'N/A' : Number(value).toFixed(digits)
}

export default function ClimateExplorer() {
  const [location, setLocation] = useState(DEFAULT)
  const [year, setYear] = useState(2024)
  const [compareYear, setCompareYear] = useState(2018)
  const [layer, setLayer] = useState('temperature')
  const [basemap, setBasemap] = useState('dark')

  const regions = useApi('/api/regions')
  const places = Array.isArray(regions.data) ? regions.data : []

  const start = Math.min(year, compareYear)
  const end = Math.max(year, compareYear)

  const locationQuery = location.id
    ? `region_id=${encodeURIComponent(location.id)}`
    : `lat=${location.lat.toFixed(4)}&lng=${location.lng.toFixed(4)}`

  const climate = useApi(
    `/api/climate/timeseries?${locationQuery}&start_year=${start}&end_year=${end}`
  )

  const yearly = useMemo(() => {
    const points = Array.isArray(climate.data?.points)
      ? climate.data.points
      : []

    return Array.from(
      { length: end - start + 1 },
      (_, index) => summarizeYear(points, start + index)
    )
  }, [climate.data, start, end])

  const current = yearly.find(row => row.year === year)
  const previous = yearly.find(row => row.year === compareYear)

  const tempChange =
    current?.temp != null && previous?.temp != null
      ? current.temp - previous.temp
      : null

  const rainChange =
    current?.rain != null && previous?.rain != null
      ? current.rain - previous.rain
      : null

  const chartKey = layer === 'temperature' ? 'temp' : 'rain'
  const chartUnit = layer === 'temperature' ? '°C' : 'mm'

  const sourceLabel = climate.data?.is_sample
    ? 'Sample dataset'
    : climate.data?.source || 'NASA POWER'

  return (
    <div className="min-h-screen bg-[#07111c] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        <section className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#102b36] via-[#0a1b29] to-[#07131e] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-[90px]" />

          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                <Globe2 size={17} />
                KIZUKI / GEOSPATIAL INTELLIGENCE
              </p>

              <h1 className="mt-4 font-display text-3xl font-semibold text-white sm:text-5xl">
                Climate Explorer
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Investigate historical temperature and rainfall
                anywhere on Earth using NASA POWER climate records.
                Compare years, select a city, or explore the map.
              </p>
            </div>

            <Link
              to="/vegetation"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-300/20"
            >
              <Satellite size={16} />
              Satellite Explorer
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>

        <Panel>
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays size={18} className="text-emerald-300" />
            <h2 className="font-semibold text-white">
              Exploration controls
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs text-slate-400">
                Select region
              </span>
              <select
                className={SELECT_STYLE}
                value={location.id || ''}
                onChange={event => {
                  const found = places.find(
                    place => place.id === event.target.value
                  )
                  if (found) setLocation(found)
                }}
              >
                {!location.id && (
                  <option value="">Custom map location</option>
                )}
                {places.length === 0 && (
                  <option value={location.id || ''}>
                    Loading regions...
                  </option>
                )}
                {places.map(place => (
                  <option key={place.id} value={place.id}>
                    {place.name}, {place.country}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs text-slate-400">
                Observation year
              </span>
              <select
                className={SELECT_STYLE}
                value={year}
                onChange={event => setYear(Number(event.target.value))}
              >
                {YEARS.map(value => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs text-slate-400">
                Compare against
              </span>
              <select
                className={SELECT_STYLE}
                value={compareYear}
                onChange={event => setCompareYear(Number(event.target.value))}
              >
                {YEARS.map(value => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs text-slate-400">
                Climate variable
              </span>
              <select
                className={SELECT_STYLE}
                value={layer}
                onChange={event => setLayer(event.target.value)}
              >
                <option value="temperature">Temperature</option>
                <option value="rainfall">Rainfall</option>
              </select>
            </label>
          </div>
        </Panel>

        {climate.error && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            Climate API error: {climate.error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="relative h-[430px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1723] sm:h-[540px]">
            <MapContainer
              center={[20, 10]}
              zoom={2}
              minZoom={2}
              maxZoom={13}
              zoomControl={false}
              className="h-full w-full"
            >
              <TileLayer
                key={basemap}
                url={
                  basemap === 'satellite'
                    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    : 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                }
                attribution={
                  basemap === 'satellite'
                    ? 'Tiles © Esri'
                    : '© OpenStreetMap contributors'
                }
                className={basemap === 'dark' ? 'osm-dark' : ''}
              />

              <ZoomControl position="bottomright" />

              <MapEvents onSelect={setLocation} />
              <MapCamera location={location} />

              {places.map(place => (
                <CircleMarker
                  key={place.id}
                  center={[place.lat, place.lng]}
                  radius={location.id === place.id ? 8 : 5}
                  pathOptions={{
                    color: '#d1fae5',
                    fillColor: '#34d399',
                    fillOpacity: 0.8,
                    weight: 1
                  }}
                  eventHandlers={{
                    click: event => {
                      event.originalEvent?.stopPropagation()
                      setLocation(place)
                    }
                  }}
                >
                  <Tooltip>
                    {place.name}, {place.country}
                  </Tooltip>
                </CircleMarker>
              ))}

              <CircleMarker
                center={[location.lat, location.lng]}
                radius={11}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#10b981',
                  fillOpacity: 0.95,
                  weight: 2
                }}
              >
                <Tooltip>{location.name}</Tooltip>
              </CircleMarker>
            </MapContainer>

            <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-white/10 bg-[#071521]/90 px-4 py-3 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-widest text-emerald-300">
                Selected location
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {location.name}
              </p>
            </div>

            <div className="absolute bottom-4 left-4 z-[500] flex gap-1 rounded-xl border border-white/10 bg-[#071521]/90 p-1 backdrop-blur-xl">
              {['dark', 'satellite'].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBasemap(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${
                    basemap === value
                      ? 'bg-emerald-400/20 text-emerald-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <Panel>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Location intelligence
            </p>

            <h2 className="mt-3 font-display text-2xl font-semibold text-white">
              {location.name}
            </h2>

            <p className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-400">
              <MapPin size={14} />
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>

            <div className="mt-7 space-y-5">
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs text-slate-400">
                  Mean air temperature · {year}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {climate.loading ? '...' : display(current?.temp, 2)}
                  <span className="ml-2 text-sm text-emerald-300">°C</span>
                </p>
              </div>

              <div className="border-b border-white/10 pb-5">
                <p className="text-xs text-slate-400">
                  Annual precipitation · {year}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {climate.loading ? '...' : display(current?.rain)}
                  <span className="ml-2 text-sm text-emerald-300">mm</span>
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Data source
                </p>
                <p className="mt-2 text-sm font-semibold text-emerald-300">
                  {sourceLabel}
                </p>
              </div>
            </div>

            <p className="mt-7 text-xs leading-6 text-slate-500">
              Climate values represent NASA POWER gridded
              historical estimates, not precise street-level
              sensor measurements. Map markers identify
              supported locations; they are not a global
              temperature or rainfall heatmap.
            </p>
          </Panel>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Thermometer}
            title={`Temperature · ${year}`}
            value={climate.loading ? '...' : display(current?.temp, 2)}
            unit="°C"
            detail="Annual mean air temperature at 2 metres"
          />

          <Metric
            icon={CloudRain}
            title={`Rainfall · ${year}`}
            value={climate.loading ? '...' : display(current?.rain)}
            unit="mm"
            detail="Total precipitation over the calendar year"
          />

          <Metric
            icon={Thermometer}
            title="Temperature difference"
            value={
              climate.loading
                ? '...'
                : tempChange == null
                  ? 'N/A'
                  : `${tempChange > 0 ? '+' : ''}${tempChange.toFixed(2)}`
            }
            unit="°C"
            detail={`${year} minus ${compareYear}`}
          />

          <Metric
            icon={CloudRain}
            title="Rainfall difference"
            value={
              climate.loading
                ? '...'
                : rainChange == null
                  ? 'N/A'
                  : `${rainChange > 0 ? '+' : ''}${rainChange.toFixed(1)}`
            }
            unit="mm"
            detail={`${year} minus ${compareYear}`}
          />
        </div>

        <Panel>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Historical analysis
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-white">
                {layer === 'temperature'
                  ? 'Annual temperature trend'
                  : 'Annual precipitation trend'}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                {location.name} · {start}–{end}
              </p>
            </div>

            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-300">
              {sourceLabel}
            </span>
          </div>

          {climate.loading ? (
            <div className="flex h-[310px] items-center justify-center text-sm text-slate-400">
              Loading historical climate records...
            </div>
          ) : yearly.some(row => row[chartKey] != null) ? (
            <div className="h-[310px] w-full">
              <ResponsiveContainer className="kizuki-scientific-chart" width="100%" height="100%">
                <LineChart
                  data={yearly}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke="#263747"
                    strokeDasharray="4 5"
                  />
                  <XAxis
                    dataKey="year"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                    unit={chartUnit}
                    width={65}
                    domain={['auto', 'auto']}
                  />
                  <ChartTooltip
                    contentStyle={{
                      background: '#0b1b29',
                      border: '1px solid #274553',
                      borderRadius: 12,
                      color: '#ffffff'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={chartKey}
                    name={
                      layer === 'temperature'
                        ? 'Mean temperature'
                        : 'Annual rainfall'
                    }
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[310px] items-center justify-center text-sm text-slate-400">
              No complete annual records available.
            </div>
          )}

          <p className="mt-4 text-xs leading-6 text-slate-500">
            This chart uses complete calendar years only.
            Differences between two selected years do not
            by themselves establish a long-term climate trend.
          </p>
        </Panel>

        <SatelliteComparison
          location={location}
          beforeYear={compareYear}
          afterYear={year}
        />

        <GlobalClimateHeatmap />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5">
          <p className="text-xs text-slate-500">
            KIZUKI · See the change. Understand the cause.
          </p>
          <Link
            to="/vegetation"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Continue to satellite vegetation analysis
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}