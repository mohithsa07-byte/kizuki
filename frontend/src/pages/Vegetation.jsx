
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Leaf,
  MapPin,
  RefreshCw,
  Satellite
} from 'lucide-react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents
} from 'react-leaflet'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import PageHeader from '../components/PageHeader'

// KIZUKI API
const API_BASE = 'https://kizuki-eta.vercel.app/api'

const YEARS = Array.from(
  { length: 11 },
  (_, index) => 2015 + index
)

const selectClass =
  'w-full rounded-xl border border-white/10 bg-[#101d2b] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400'

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0c1825]/90 p-5 shadow-xl">
      <h2 className="text-base font-semibold text-white">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      )}

      <div className="mt-5">{children}</div>
    </section>
  )
}

function Metric({
  title,
  value,
  detail,
  icon: Icon,
  color = 'text-emerald-400'
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1825] p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {title}
        </span>
        <Icon size={19} className={color} />
      </div>

      <div className={`mt-4 text-3xl font-semibold ${color}`}>
        {value}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  )
}

function LocationPicker({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({
        lat: Number(event.latlng.lat.toFixed(4)),
        lng: Number(event.latlng.lng.toFixed(4))
      })
    }
  })

  return null
}

function meanForYear(points, year) {
  const values = points
    .filter(
      point =>
        point.date?.startsWith(`${year}-`) &&
        point.used === true &&
        typeof point.ndvi === 'number'
    )
    .map(point => point.ndvi)

  if (!values.length) return null

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  )
}

function validCountForYear(points, year) {
  return points.filter(
    point =>
      point.date?.startsWith(`${year}-`) &&
      point.used === true &&
      typeof point.ndvi === 'number'
  ).length
}

async function fetchYearNDVI(location, year, signal) {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`
  })

  const response = await fetch(
    `${API_BASE}/ndvi/timeseries?${params.toString()}`,
    { signal }
  )

  if (!response.ok) {
    let message = `NDVI API error: ${response.status}`

    try {
      const body = await response.json()
      if (body.detail) {
        message = String(body.detail)
      }
    } catch {
      // Keep HTTP error message.
    }

    throw new Error(message)
  }

  return response.json()
}

export default function Vegetation() {
  const [location, setLocation] = useState({
    lat: 12.9716,
    lng: 77.5946
  })

  const [yearA, setYearA] = useState(2022)
  const [yearB, setYearB] = useState(2023)

  const [beforeData, setBeforeData] = useState(null)
  const [afterData, setAfterData] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setLoading(true)
      setError('')
      setBeforeData(null)
      setAfterData(null)

      try {
        const [beforeResult, afterResult] =
          await Promise.all([
            fetchYearNDVI(location, yearA, controller.signal),
            yearA === yearB
              ? fetchYearNDVI(location, yearA, controller.signal)
              : fetchYearNDVI(location, yearB, controller.signal)
          ])

        if (!controller.signal.aborted) {
          setBeforeData(beforeResult)
          setAfterData(afterResult)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.message || 'Unable to retrieve satellite data'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => controller.abort()
  }, [
    location.lat,
    location.lng,
    yearA,
    yearB,
    refresh
  ])

  const beforePoints = useMemo(
    () => beforeData?.points || [],
    [beforeData]
  )

  const afterPoints = useMemo(
    () => afterData?.points || [],
    [afterData]
  )

  const before = useMemo(
    () => meanForYear(beforePoints, yearA),
    [beforePoints, yearA]
  )

  const after = useMemo(
    () => meanForYear(afterPoints, yearB),
    [afterPoints, yearB]
  )

  const difference =
    before !== null && after !== null
      ? after - before
      : null

  const relative =
    difference !== null && before !== 0
      ? (difference / Math.abs(before)) * 100
      : null

  const chartData = useMemo(() => {
    const combined = [
      ...beforePoints,
      ...(yearA === yearB ? [] : afterPoints)
    ]

    return combined
      .map(point => ({
        date: point.date,
        ndvi: point.used ? point.ndvi : null
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [beforePoints, afterPoints, yearA, yearB])

  const totalValid =
    validCountForYear(beforePoints, yearA) +
    (yearA === yearB
      ? 0
      : validCountForYear(afterPoints, yearB))

  const totalDropped =
    (beforeData?.dropped_count || 0) +
    (yearA === yearB
      ? 0
      : afterData?.dropped_count || 0)

  const formatNDVI = value =>
    value === null ? 'N/A' : value.toFixed(3)

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Vegetation Intelligence"
        description="Explore real satellite-derived vegetation greenness using NASA MODIS observations."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-300">
          <Satellite size={15} />
          NASA MODIS · 250 m · 16-day composites
        </div>

        <button
          type="button"
          onClick={() => setRefresh(value => value + 1)}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
        >
          <RefreshCw size={15} />
          Refresh data
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Observation A"
          subtitle="Baseline year"
        >
          <select
            className={selectClass}
            value={yearA}
            onChange={event =>
              setYearA(Number(event.target.value))
            }
          >
            {YEARS.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Panel>

        <Panel
          title="Observation B"
          subtitle="Comparison year"
        >
          <select
            className={selectClass}
            value={yearB}
            onChange={event =>
              setYearB(Number(event.target.value))
            }
          >
            {YEARS.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </Panel>

        <Panel
          title="Selected location"
          subtitle="Click the map to change location"
        >
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <MapPin size={17} />
            {location.lat.toFixed(4)},
            {' '}
            {location.lng.toFixed(4)}
          </div>
        </Panel>
      </div>

      {loading && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-300">
          Fetching satellite observations...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Metric
          title={`Mean NDVI · ${yearA}`}
          value={formatNDVI(before)}
          detail="Mean of quality-approved observations"
          icon={Leaf}
        />

        <Metric
          title={`Mean NDVI · ${yearB}`}
          value={formatNDVI(after)}
          detail="Mean of quality-approved observations"
          icon={Activity}
          color="text-cyan-300"
        />

        <Metric
          title="NDVI difference"
          value={
            difference === null
              ? 'N/A'
              : `${difference >= 0 ? '+' : ''}${difference.toFixed(3)}`
          }
          detail={
            relative === null
              ? 'Insufficient comparable data'
              : `${relative >= 0 ? '+' : ''}${relative.toFixed(1)}% relative change`
          }
          icon={
            difference !== null && difference < 0
              ? ArrowDownRight
              : ArrowUpRight
          }
          color={
            difference !== null && difference < 0
              ? 'text-orange-400'
              : 'text-emerald-400'
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Satellite observation point"
          subtitle="Click anywhere on the map to select a MODIS observation pixel."
        >
          <div className="h-[350px] overflow-hidden rounded-xl">
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={10}
              scrollWheelZoom
              style={{
                height: '100%',
                width: '100%'
              }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <LocationPicker onPick={setLocation} />

              <CircleMarker
                center={[location.lat, location.lng]}
                radius={9}
                pathOptions={{
                  color: '#34d399',
                  fillColor: '#10b981',
                  fillOpacity: 0.65
                }}
              />
            </MapContainer>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            The map identifies the selected observation
            location. It is not an NDVI raster map.
          </p>
        </Panel>

        <Panel
          title="NDVI observation history"
          subtitle="Good-quality MODIS observations from the selected years."
        >
          <div className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#ffffff12" />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 10
                    }}
                    minTickGap={35}
                  />

                  <YAxis
                    domain={[-0.2, 1]}
                    tick={{
                      fill: '#94a3b8',
                      fontSize: 11
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: '#0c1825',
                      border: '1px solid #ffffff20',
                      borderRadius: 12
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="ndvi"
                    stroke="#34d399"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {loading
                  ? 'Loading observations...'
                  : 'No observations available'}
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Satellite data quality"
        subtitle="Source transparency and scientific methodology"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            title="Valid observations"
            value={beforeData ? totalValid : '—'}
            detail="Good-quality observations"
            icon={Leaf}
          />

          <Metric
            title="Excluded observations"
            value={beforeData ? totalDropped : '—'}
            detail="Filtered or missing observations"
            icon={Info}
            color="text-orange-300"
          />

          <Metric
            title="Spatial resolution"
            value={
              beforeData
                ? `${beforeData.resolution_m} m`
                : '—'
            }
            detail="Single MODIS pixel"
            icon={Satellite}
            color="text-cyan-300"
          />
        </div>

        <div className="mt-5 space-y-2 text-xs leading-relaxed text-slate-400">
          <p>
            Source: {beforeData?.source ||
              'NASA MODIS via ORNL DAAC'}
          </p>

          <p>
            NDVI = (NIR − Red) / (NIR + Red).
          </p>

          <p>
            Annual averages are calculated from
            available good-quality observations.
            Uneven seasonal coverage can affect comparisons.
          </p>

          <p>
            NDVI measures vegetation greenness,
            not direct tree count, biodiversity or forest area.
            Changes do not establish their cause.
          </p>

          {beforeData?.notes?.map((note, index) => (
            <p key={index}>{note}</p>
          ))}
        </div>
      </Panel>
    </div>
  )
}
