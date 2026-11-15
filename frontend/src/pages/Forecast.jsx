import ForecastWorldMap from '../components/ForecastWorldMap'
import { useMemo, useState } from 'react'
import {
  BrainCircuit, Thermometer, CloudRain,
  CalendarRange, ShieldAlert, Activity,
  TrendingUp, Database, RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer, ComposedChart, Area,
  Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine
} from 'recharts'
import useApi from '../hooks/useApi'

const FIRST_YEAR = 1995
const LAST_YEAR = 2025

const selectStyle =
  'w-full rounded-xl border border-white/10 bg-[#102533] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50'

const fallbackRegions = [
  { id: 'bengaluru-urban', name: 'Bengaluru' }
]

function annualize(points) {
  const grouped = new Map()

  for (const point of points) {
    const year = Number(String(point.date).slice(0, 4))
    if (!Number.isInteger(year)) continue

    if (!grouped.has(year)) grouped.set(year, {
      year, temperatures: [], rainfall: []
    })

    const row = grouped.get(year)

    if (Number.isFinite(point.temperature_c)) {
      row.temperatures.push(point.temperature_c)
    }

    if (Number.isFinite(point.rainfall_mm)) {
      row.rainfall.push(point.rainfall_mm)
    }
  }

  return [...grouped.values()]
    .sort((a, b) => a.year - b.year)
    .map(row => ({
      year: row.year,
      temp: row.temperatures.length === 12
        ? row.temperatures.reduce((a, b) => a + b, 0) / 12
        : null,
      rain: row.rainfall.length === 12
        ? row.rainfall.reduce((a, b) => a + b, 0)
        : null
    }))
}

function fitTrend(rows, field) {
  const valid = rows.filter(
    row => Number.isFinite(row[field])
  )

  if (valid.length < 15) return null

  const origin = valid[0].year
  const xs = valid.map(row => row.year - origin)
  const ys = valid.map(row => row[field])

  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n

  const covariance = xs.reduce(
    (sum, x, i) => sum + (x - mx) * (ys[i] - my),
    0
  )

  const variance = xs.reduce(
    (sum, x) => sum + (x - mx) ** 2,
    0
  )

  // Mild slope regularization to limit noisy extrapolation.
  const slope = covariance / (variance + 50)
  const intercept = my - slope * mx

  const predict = year =>
    intercept + slope * (year - origin)

  const residuals = valid.map(
    row => row[field] - predict(row.year)
  )

  const residualSD = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) /
    Math.max(1, n - 2)
  )

  return {
    predict,
    slope,
    residualSD,
    count: n,
    firstYear: valid[0].year,
    lastYear: valid[valid.length - 1].year,
    lastObserved: valid[valid.length - 1][field]
  }
}

function buildProjection(rows, variable, horizon, sensitivity) {
  const field = variable === 'temperature' ? 'temp' : 'rain'
  const model = fitTrend(rows, field)

  if (!model) return null

  const last = model.lastYear

  const history = rows.map(row => ({
    year: row.year,
    observed: row[field],
    baseline: null,
    sensitivity: null,
    lower: null,
    upper: null,
    envelope: null
  }))

  const future = []

  for (let year = last; year <= horizon; year++) {
    const elapsed = year - last
    const baseline = model.predict(year)

    // A transparent sensitivity adjustment, not an SSP pathway.
    const sensitivityShift = variable === 'temperature'
      ? sensitivity * elapsed / 10
      : sensitivity * elapsed / 10

    const alternative = baseline + sensitivityShift

    // Heuristic error envelope, not a calibrated confidence interval.
    const spread = model.residualSD *
      (1 + elapsed / 20)

    const lower = variable === 'rainfall'
      ? Math.max(0, baseline - spread)
      : baseline - spread

    const upper = baseline + spread

    future.push({
      year,
      observed: year === last ? model.lastObserved : null,
      baseline,
      sensitivity: alternative,
      lower,
      upper,
      envelope: [lower, upper]
    })
  }

  return {
    model,
    data: [
      ...history.filter(row => row.year < last),
      ...future
    ],
    last,
    target: future[future.length - 1]
  }
}

function number(value, digits = 1) {
  return Number.isFinite(value)
    ? value.toFixed(digits)
    : 'N/A'
}

function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/[0.08] bg-[#0d1d2b] p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

function Stat({ icon: Icon, label, value, detail }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          {label}
        </p>
        <Icon size={18} className="text-emerald-300" />
      </div>
      <p className="mt-4 text-2xl font-semibold text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        {detail}
      </p>
    </Panel>
  )
}

export default function Forecast() {
  // WORLDWIDE_FORECAST_V1
  const [location, setLocation] = useState({
    id: 'bengaluru-urban',
    name: 'Bengaluru',
    lat: 12.9716,
    lng: 77.5946
  })

  const [latitudeInput, setLatitudeInput] = useState('12.9716')
  const [longitudeInput, setLongitudeInput] = useState('77.5946')

  function selectLocation(next) {
    setLocation(next)
    setLatitudeInput(String(next.lat))
    setLongitudeInput(String(next.lng))
  }

  function pickMapLocation(lat, lng) {
    selectLocation({
      id: null,
      name: 'Custom location',
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4))
    })
  }

  function applyCoordinates() {
    const lat = Number(latitudeInput)
    const lng = Number(longitudeInput)

    if (
      latitudeInput.trim() === '' ||
      longitudeInput.trim() === '' ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180
    ) {
      alert('Enter valid latitude (-90 to 90) and longitude (-180 to 180).')
      return
    }

    pickMapLocation(lat, lng)
  }
  const [variable, setVariable] = useState('temperature')
  const [horizon, setHorizon] = useState(2040)
  const [sensitivity, setSensitivity] = useState(0.2)

  const regions = useApi('/api/regions')
  const regionList = Array.isArray(regions.data)
    ? regions.data
    : fallbackRegions

  const locationQuery = location.id
    ? `region_id=${encodeURIComponent(location.id)}`
    : `lat=${location.lat.toFixed(4)}&lng=${location.lng.toFixed(4)}`

  const climate = useApi(
    `/api/climate/timeseries?${locationQuery}&start_year=${FIRST_YEAR}&end_year=${LAST_YEAR}`
  )

  const annual = useMemo(
    () => annualize(climate.data?.points || []),
    [climate.data]
  )

  const projection = useMemo(
    () => buildProjection(
      annual, variable, horizon, sensitivity
    ),
    [annual, variable, horizon, sensitivity]
  )

  const selectedRegion = location

  const unit = variable === 'temperature' ? '°C' : 'mm'
  const decimals = variable === 'temperature' ? 2 : 0

  const isSample = climate.data?.is_sample === true

  const change = projection
    ? projection.target.baseline -
      projection.model.lastObserved
    : null

  const isValid = projection && !isSample

  return (
    <div className="min-h-screen space-y-6 bg-[#07111c] px-4 py-6 text-white sm:px-7">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#10313a] via-[#0a202d] to-[#071521] p-7 sm:p-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-400/10 blur-[80px]" />

        <div className="relative">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <BrainCircuit size={18} />
            KIZUKI / PREDICTIVE INTELLIGENCE
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Climate Forecast Lab
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Explore statistical extrapolations of historical
            temperature and precipitation. Investigate how
            trend assumptions affect possible future values.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-2 text-xs text-emerald-200">
            <Database size={15} />
            NASA POWER historical inputs
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            WORLDWIDE FORECAST COVERAGE
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Choose anywhere on Earth
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Click the map, choose a city preset, or enter coordinates.
            Historical records are retrieved for the corresponding
            NASA POWER grid cell.
          </p>
        </div>

        <ForecastWorldMap
          location={location}
          onPick={pickMapLocation}
        />

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0d1d2b] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-2">
            <span className="text-xs text-slate-400">
              Latitude
            </span>
            <input
              type="number"
              min="-90"
              max="90"
              step="any"
              value={latitudeInput}
              onChange={e => setLatitudeInput(e.target.value)}
              className={selectStyle}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs text-slate-400">
              Longitude
            </span>
            <input
              type="number"
              min="-180"
              max="180"
              step="any"
              value={longitudeInput}
              onChange={e => setLongitudeInput(e.target.value)}
              className={selectStyle}
            />
          </label>

          <button
            type="button"
            onClick={applyCoordinates}
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#071521] transition hover:bg-emerald-300"
          >
            Analyze location
          </button>
        </div>

        <p className="text-xs leading-6 text-slate-500">
          Worldwide coordinate queries are supported by the backend.
          Coverage and accuracy depend on NASA POWER availability.
          Its gridded estimates are approximately 50 km scale,
          not street-level measurements.
        </p>
      </section>
      <Panel>
        <div className="mb-5 flex items-center gap-2">
          <Activity size={18} className="text-emerald-300" />
          <h2 className="font-semibold">Prediction controls</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs text-slate-400">
              Forecast location
            </span>
            <select
              className={selectStyle}
              value={location.id || ''}
              onChange={e => {
                const region = regionList.find(
                  item => item.id === e.target.value
                )
                if (region) selectLocation(region)
              }}
            >
              {!location.id && (
                <option value="">Custom map location</option>
              )}
              {regionList.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}, {region.country || ''}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs text-slate-400">
              Climate variable
            </span>
            <select
              className={selectStyle}
              value={variable}
              onChange={e => {
                setVariable(e.target.value)
                setSensitivity(
                  e.target.value === 'temperature' ? 0.2 : 20
                )
              }}
            >
              <option value="temperature">Temperature</option>
              <option value="rainfall">Annual rainfall</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs text-slate-400">
              Projection horizon
            </span>
            <select
              className={selectStyle}
              value={horizon}
              onChange={e => setHorizon(Number(e.target.value))}
            >
              <option value={2030}>2030</option>
              <option value={2040}>2040</option>
              <option value={2050}>2050</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs text-slate-400">
              Alternative trend adjustment per decade
            </span>
            <select
              className={selectStyle}
              value={sensitivity}
              onChange={e => setSensitivity(Number(e.target.value))}
            >
              {variable === 'temperature' ? (
                <>
                  <option value={0.1}>+0.1 °C / decade</option>
                  <option value={0.2}>+0.2 °C / decade</option>
                  <option value={0.4}>+0.4 °C / decade</option>
                </>
              ) : (
                <>
                  <option value={10}>+10 mm / decade</option>
                  <option value={20}>+20 mm / decade</option>
                  <option value={50}>+50 mm / decade</option>
                </>
              )}
            </select>
          </label>
        </div>
      </Panel>

      {climate.error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          Climate data error: {climate.error}
        </div>
      )}

      {isSample && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
          The backend identified these records as sample data.
          Forecast outputs are not presented as real observations.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={CalendarRange}
          label="Historical coverage"
          value={projection
            ? `${projection.model.firstYear}–${projection.last}`
            : 'N/A'}
          detail="Complete calendar-year records used by the model"
        />
        <Stat
          icon={Thermometer}
          label={`Last observed ${variable}`}
          value={isValid
            ? `${number(projection.model.lastObserved, decimals)} ${unit}`
            : 'N/A'}
          detail={`Annual value for ${projection?.last || 'the last available year'}`}
        />
        <Stat
          icon={TrendingUp}
          label={`Baseline projection · ${horizon}`}
          value={isValid
            ? `${number(projection.target.baseline, decimals)} ${unit}`
            : 'N/A'}
          detail="Regularized linear trend extrapolation"
        />
        <Stat
          icon={Activity}
          label="Projected difference"
          value={isValid
            ? `${change >= 0 ? '+' : ''}${number(change, decimals)} ${unit}`
            : 'N/A'}
          detail="Projected baseline minus last observed year"
        />
      </div>

      <Panel>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Historical and projected climate
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {selectedRegion?.name || 'Selected region'} · {variable}
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Historical records through 2025 · exploratory projection to {horizon}
            </p>
          </div>

          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-300">
            Statistical baseline
          </span>
        </div>

        {climate.loading ? (
          <div className="flex h-[370px] items-center justify-center gap-3 text-sm text-slate-400">
            <RefreshCw size={17} className="animate-spin" />
            Loading NASA POWER observations...
          </div>
        ) : isValid ? (
          <div className="h-[370px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={projection.data}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  stroke="#243846"
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
                  width={65}
                  domain={['auto', 'auto']}
                  tickFormatter={value => `${Number(value).toFixed(0)}`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (Array.isArray(value)) {
                      return [
                        value.map(v => number(v, decimals)).join(' – ') + ` ${unit}`,
                        name
                      ]
                    }
                    return [`${number(Number(value), decimals)} ${unit}`, name]
                  }}
                  contentStyle={{
                    background: '#0b1c29',
                    border: '1px solid #31505c',
                    borderRadius: 12,
                    color: '#fff'
                  }}
                />
                <Legend />
                <ReferenceLine
                  x={projection.last}
                  stroke="#94a3b8"
                  strokeDasharray="3 5"
                />
                <Area
                  type="monotone"
                  dataKey="envelope"
                  name="Heuristic error envelope"
                  stroke="none"
                  fill="#2dd4bf"
                  fillOpacity={0.15}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="observed"
                  name="Observed annual value"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="Trend baseline"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="sensitivity"
                  name="Adjusted trend"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="3 5"
                  dot={false}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[370px] items-center justify-center text-center text-sm text-slate-400">
            {climate.error
              ? 'Unable to load historical climate data.'
              : 'Insufficient complete, non-sample historical records for projection.'}
          </div>
        )}

        <p className="mt-5 text-xs leading-6 text-slate-500">
          Green: historical NASA POWER estimates. Blue:
          regularized linear extrapolation. Amber: user-selected
          trend sensitivity. Shaded region: a heuristic
          residual-based error envelope, not a statistically
          calibrated prediction interval.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-2">
            <BrainCircuit size={19} className="text-emerald-300" />
            <h3 className="font-semibold">How the model works</h3>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-400">
            <p>
              The model aggregates monthly NASA POWER
              observations into complete annual records.
              Temperature is averaged; monthly rainfall
              totals are summed.
            </p>
            <p>
              A linear trend is fitted using least squares
              with mild slope regularization. The trend is
              extended into future years.
            </p>
            <p>
              The alternative line applies an additional
              user-selected change per decade. This is a
              sensitivity test, not an emissions scenario.
            </p>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2">
            <ShieldAlert size={19} className="text-amber-300" />
            <h3 className="font-semibold">Scientific limitations</h3>
          </div>

          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-400">
            <p>
              These are exploratory statistical projections,
              not validated AI forecasts, IPCC scenarios,
              or physically simulated climate predictions.
            </p>
            <p>
              The shaded range uses historical residual
              variation and an arbitrary growth rule. It
              should not be interpreted as a 95% confidence
              or prediction interval.
            </p>
            <p>
              Long-term rainfall and local temperature can
              behave nonlinearly. Use CMIP6 projections and
              model validation before making planning or
              policy decisions.
            </p>
          </div>
        </Panel>
      </div>

      <div className="border-t border-white/10 py-5 text-xs text-slate-500">
        KIZUKI Forecast Lab · NASA POWER historical climate data ·
        Exploratory trend analysis
      </div>
    </div>
  )
}