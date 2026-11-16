import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Tooltip
} from 'react-leaflet'
import {
  Thermometer,
  CloudRain,
  Layers3,
  Info
} from 'lucide-react'
import { apiGet } from '../services/api'

const LAT_EDGES = [-60, -30, 0, 30, 60]
const LON_EDGES = [-180, -120, -60, 0, 60, 120, 180]

const CELLS = []

for (let row = 0; row < LAT_EDGES.length - 1; row++) {
  for (let col = 0; col < LON_EDGES.length - 1; col++) {
    const south = LAT_EDGES[row]
    const north = LAT_EDGES[row + 1]
    const west = LON_EDGES[col]
    const east = LON_EDGES[col + 1]

    CELLS.push({
      id: `${row}-${col}`,
      south,
      north,
      west,
      east,
      lat: (south + north) / 2,
      lng: (west + east) / 2
    })
  }
}

const CACHE = new Map()

const PALETTES = {
  temperature: [
    '#4422bb',
    '#2755df',
    '#1da4ee',
    '#22c7bc',
    '#35c76b',
    '#d4cf36',
    '#f4a32e',
    '#ee5526',
    '#c32626'
  ],
  rainfall: [
    '#a7794d',
    '#c7a16d',
    '#e4c991',
    '#dce3a7',
    '#8ccf9b',
    '#3bafad',
    '#2987c6',
    '#354fc0',
    '#442a91'
  ]
}

function colorFor(value, layer) {
  if (value == null || !Number.isFinite(value)) return null

  const min = layer === 'temperature' ? -30 : 0
  const max = layer === 'temperature' ? 40 : 4000
  const colors = PALETTES[layer]

  const fraction = Math.max(
    0,
    Math.min(1, (value - min) / (max - min))
  )

  return colors[Math.min(
    colors.length - 1,
    Math.floor(fraction * colors.length)
  )]
}

function yearValues(points, year) {
  const rows = points.filter(
    p => Number(String(p.date).slice(0, 4)) === year
  )

  const temperatures = rows
    .map(p => p.temperature_c)
    .filter(v => typeof v === 'number' && Number.isFinite(v))

  const rainfall = rows
    .map(p => p.rainfall_mm)
    .filter(v => typeof v === 'number' && Number.isFinite(v))

  return {
    temperature: temperatures.length === 12
      ? temperatures.reduce((a, b) => a + b, 0) / 12
      : null,
    rainfall: rainfall.length === 12
      ? rainfall.reduce((a, b) => a + b, 0)
      : null
  }
}

function useGridData(beforeYear, afterYear) {
  const [state, setState] = useState({
    values: {},
    completed: 0,
    loading: true,
    errors: 0
  })

  useEffect(() => {
    let cancelled = false

    const start = Math.min(beforeYear, afterYear)
    const end = Math.max(beforeYear, afterYear)

    setState({
      values: {},
      completed: 0,
      loading: true,
      errors: 0
    })

    async function run() {
      const values = {}
      let completed = 0
      let errors = 0
      let next = 0

      async function worker() {
        while (next < CELLS.length && !cancelled) {
          const cell = CELLS[next++]
          const key = `${cell.id}:${start}:${end}`

          try {
            let data = CACHE.get(key)

            if (!data) {
              const params = new URLSearchParams({
                lat: cell.lat.toFixed(4),
                lng: cell.lng.toFixed(4),
                start_year: String(start),
                end_year: String(end)
              })

              data = await apiGet(
                `/api/climate/timeseries?${params}`
              )

              CACHE.set(key, data)
            }

            values[cell.id] = {
              before: yearValues(data.points || [], beforeYear),
              after: yearValues(data.points || [], afterYear),
              sample: data.is_sample === true
            }
          } catch {
            errors++
          }

          completed++

          if (!cancelled) {
            setState({
              values: { ...values },
              completed,
              loading: completed < CELLS.length,
              errors
            })
          }
        }
      }

      await Promise.all(
        Array.from({ length: 3 }, () => worker())
      )
    }

    run()

    return () => {
      cancelled = true
    }
  }, [beforeYear, afterYear])

  return state
}

function formatValue(value, layer) {
  if (value == null) return 'Unavailable'

  return layer === 'temperature'
    ? `${value.toFixed(1)} °C`
    : `${value.toFixed(0)} mm/year`
}

function HeatCell({
  cell,
  value,
  year,
  layer,
  west,
  east
}) {
  if (value == null || east <= west) return null

  const color = colorFor(value, layer)

  return (
    <Rectangle
      bounds={[
        [cell.south, west],
        [cell.north, east]
      ]}
      pathOptions={{
        color: '#08111d',
        weight: 0.7,
        fillColor: color,
        fillOpacity: 0.78,
        interactive: true
      }}
    >
      <Tooltip sticky>
        <div>
          <strong>{year} sampled cell</strong>
          <div>{formatValue(value, layer)}</div>
          <div>
            Sample centre: {cell.lat}°, {cell.lng}°
          </div>
          <div>
            Cell coverage is illustrative, not a
            measured area-wide average.
          </div>
        </div>
      </Tooltip>
    </Rectangle>
  )
}

export default function GlobalClimateHeatmap() {
  const [layer, setLayer] = useState('temperature')
  const [beforeYear, setBeforeYear] = useState(2016)
  const [afterYear, setAfterYear] = useState(2024)
  const [reveal, setReveal] = useState(50)
  const [selectedCell, setSelectedCell] = useState(null)

  const grid = useGridData(beforeYear, afterYear)

  const splitLongitude = -180 + reveal * 3.6

  const years = useMemo(
    () => Array.from({ length: 16 }, (_, i) => 2010 + i),
    []
  )

  const anySample = Object.values(grid.values).some(
    item => item.sample
  )

  const selected = selectedCell
    ? grid.values[selectedCell.id]
    : null

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-300/15 bg-[#0a1926]">
      <div className="border-b border-white/10 p-5 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-emerald-300">
          KIZUKI / PLANETARY COMPARISON
        </p>

        <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
          Global Climate Heatmaps
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Compare temperature and precipitation between two
          historical years using geographically sampled NASA
          POWER climate records.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLayer('temperature')}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
              layer === 'temperature'
                ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-200'
                : 'border-white/10 text-slate-400'
            }`}
          >
            <Thermometer size={16} />
            Temperature
          </button>

          <button
            type="button"
            onClick={() => setLayer('rainfall')}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
              layer === 'rainfall'
                ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-200'
                : 'border-white/10 text-slate-400'
            }`}
          >
            <CloudRain size={16} />
            Rainfall
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-400">
            Before year
            <select
              value={beforeYear}
              onChange={e => setBeforeYear(Number(e.target.value))}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#102b39] px-4 py-3 text-white"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>

          <label className="text-xs text-slate-400">
            After year
            <select
              value={afterYear}
              onChange={e => setAfterYear(Number(e.target.value))}
              className="mt-2 block w-full rounded-xl border border-white/10 bg-[#102b39] px-4 py-3 text-white"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="relative h-[340px] bg-[#06111c] sm:h-[510px]">
        <MapContainer
          center={[10, 0]}
          zoom={2}
          minZoom={2}
          maxZoom={2}
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          attributionControl={true}
          className="h-full w-full"
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            className="osm-dark"
            noWrap
          />

          {CELLS.map(cell => {
            const result = grid.values[cell.id]

            if (!result) return null

            const before = result.before[layer]
            const after = result.after[layer]

            return (
              <ReactFragmentCell
                key={cell.id}
                cell={cell}
                before={before}
                after={after}
                beforeYear={beforeYear}
                afterYear={afterYear}
                layer={layer}
                split={splitLongitude}
                onSelect={() => setSelectedCell(cell)}
              />
            )
          })}
        </MapContainer>

        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg border border-white/10 bg-[#071521]/90 px-3 py-2 text-xs text-white">
          {beforeYear} ← Before | After → {afterYear}
        </div>

        <div className="pointer-events-none absolute bottom-8 right-3 z-[500] rounded-lg border border-white/10 bg-[#071521]/90 px-3 py-2 text-xs text-slate-200">
          {grid.completed}/{CELLS.length} samples loaded
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-7">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">
              Drag to compare years
            </p>
            <span className="font-mono text-xs text-emerald-300">
              {reveal}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={reveal}
            onChange={e => setReveal(Number(e.target.value))}
            className="mt-4 w-full accent-emerald-400"
            aria-label="Move geographic comparison boundary"
          />

          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>Before: {beforeYear}</span>
            <span>After: {afterYear}</span>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            The slider moves a geographic west-to-east
            comparison boundary. It does not alter the
            underlying climate values.
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-300">
            <Layers3 size={15} className="text-emerald-300" />
            {layer === 'temperature'
              ? 'Annual mean air temperature (°C)'
              : 'Annual precipitation (mm)'}
          </div>

          <div className="flex h-3 overflow-hidden rounded-full">
            {PALETTES[layer].map(color => (
              <div
                key={color}
                className="flex-1"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-400">
            <span>
              {layer === 'temperature' ? '-30 °C' : '0 mm'}
            </span>
            <span>
              {layer === 'temperature' ? '40+ °C' : '4000+ mm'}
            </span>
          </div>
        </div>

        {selected && (
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4">
            <p className="text-xs font-semibold text-emerald-300">
              Selected sampling cell
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">{beforeYear}</p>
                <p className="mt-1 font-semibold text-white">
                  {formatValue(selected.before[layer], layer)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">{afterYear}</p>
                <p className="mt-1 font-semibold text-white">
                  {formatValue(selected.after[layer], layer)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-emerald-300" />
          <div className="space-y-2 text-xs leading-6 text-slate-400">
            <p>
              Each colored cell uses one NASA POWER sample
              at its centre. The color is not a measured
              average for the entire cell.
            </p>
            <p>
              This is a coarse geographic sampling
              visualization, not a continuous global raster.
              The grid excludes polar latitudes beyond
              60° north and south.
            </p>
            <p>
              Data source: {anySample ? 'sample dataset' : 'NASA POWER when available'}.
              {grid.errors > 0
                ? ` ${grid.errors} requests failed; affected cells remain uncolored.`
                : ''}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReactFragmentCell({
  cell,
  before,
  after,
  beforeYear,
  afterYear,
  layer,
  split,
  onSelect
}) {
  const leftEast = Math.min(cell.east, split)
  const rightWest = Math.max(cell.west, split)

  return (
    <>
      {leftEast > cell.west && (
        <Rectangle
          bounds={[
            [cell.south, cell.west],
            [cell.north, leftEast]
          ]}
          pathOptions={{
            color: '#08111d',
            weight: 0.7,
            fillColor: colorFor(before, layer) || '#374151',
            fillOpacity: before == null ? 0 : 0.78
          }}
          eventHandlers={{ click: onSelect }}
        >
          <Tooltip>
            {beforeYear}: {formatValue(before, layer)}
          </Tooltip>
        </Rectangle>
      )}

      {cell.east > rightWest && (
        <Rectangle
          bounds={[
            [cell.south, rightWest],
            [cell.north, cell.east]
          ]}
          pathOptions={{
            color: '#08111d',
            weight: 0.7,
            fillColor: colorFor(after, layer) || '#374151',
            fillOpacity: after == null ? 0 : 0.78
          }}
          eventHandlers={{ click: onSelect }}
        >
          <Tooltip>
            {afterYear}: {formatValue(after, layer)}
          </Tooltip>
        </Rectangle>
      )}
    </>
  )
}