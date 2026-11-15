import { useState } from 'react'
import {
  ArrowLeftRight, CalendarDays, Leaf,
  Satellite, RefreshCw, MapPin
} from 'lucide-react'

const API = 'https://kizuki-eta.vercel.app/api'
const PC = 'https://planetarycomputer.microsoft.com/api/data/v1'
const YEARS = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - i
)

function getImageUrl(sceneId, location) {
  if (!sceneId) return ''

  // Both images use exactly the same geographic bounding box.
  const delta = 0.009
  const west = Math.max(-180, location.lng - delta)
  const east = Math.min(180, location.lng + delta)
  const south = Math.max(-90, location.lat - delta)
  const north = Math.min(90, location.lat + delta)

  const bbox = [west, south, east, north].join(',')
  const params = new URLSearchParams({
    collection: 'sentinel-2-l2a',
    item: sceneId,
    assets: 'visual',
    asset_bidx: 'visual|1,2,3',
    nodata: '0'
  })

  return `${PC}/item/bbox/${bbox}/700x500.png?${params}`
}

async function getMeasurement(location, year) {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
    max_cloud: '30'
  })

  const response = await fetch(
    `${API}/satellite/ndvi?${params}`
  )

  const data = await response.json()

  if (!response.ok) {
    const detail = data.detail
    throw new Error(
      typeof detail === 'string'
        ? detail
        : detail?.message || `API error ${response.status}`
    )
  }

  return data
}

function SatellitePanel({ title, year, data, location }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = data?.scene_id
    ? getImageUrl(data.scene_id, location)
    : ''

  const ndvi = data?.mean_ndvi

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1c29]">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-400">
            {title}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            {year}
          </h3>
        </div>
        <Satellite size={22} className="text-emerald-400" />
      </div>

      <div className="relative flex aspect-[7/5] items-center justify-center bg-[#07111b]">
        {imageUrl && !imageFailed ? (
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`Sentinel-2 image for ${year}`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
            onLoad={() => setImageFailed(false)}
          />
        ) : (
          <div className="px-6 text-center">
            <Satellite
              size={32}
              className="mx-auto mb-3 text-slate-500"
            />
            <p className="text-sm text-slate-300">
              {imageFailed
                ? 'Satellite image service unavailable'
                : 'No satellite image available'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              No replacement imagery is displayed.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <Leaf size={16} />
            Point NDVI
          </span>
          <span className="text-2xl font-semibold text-emerald-300">
            {ndvi == null ? 'N/A' : Number(ndvi).toFixed(4)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CalendarDays size={14} />
          Observation: {data?.scene_date?.slice(0, 10) || 'Unavailable'}
        </div>

        {data?.scene_cloud_percent != null && (
          <p className="text-xs text-slate-500">
            Scene cloud cover: {Number(data.scene_cloud_percent).toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  )
}

export default function EarthTimeMachine({ location }) {
  const [beforeYear, setBeforeYear] = useState(2018)
  const [afterYear, setAfterYear] = useState(2024)
  const [before, setBefore] = useState(null)
  const [after, setAfter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultKey, setResultKey] = useState('')
  const [requestId, setRequestId] = useState(0)

  const selectionKey = [
    location.lat, location.lng, beforeYear, afterYear
  ].join(':')

  const current = resultKey === selectionKey
  const validComparison =
    current &&
    before?.mean_ndvi != null &&
    after?.mean_ndvi != null

  const difference = validComparison
    ? after.mean_ndvi - before.mean_ndvi
    : null

  async function compare() {
    if (beforeYear >= afterYear) {
      setError('Choose an earlier year for BEFORE.')
      return
    }

    const id = requestId + 1
    setRequestId(id)
    setLoading(true)
    setError('')
    setBefore(null)
    setAfter(null)
    setResultKey('')

    try {
      const [a, b] = await Promise.all([
        getMeasurement(location, beforeYear),
        getMeasurement(location, afterYear)
      ])

      setBefore(a)
      setAfter(b)
      setResultKey(selectionKey)
    } catch (err) {
      setError(err.message || 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-emerald-400/20 bg-[#081521] p-5 md:p-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
          KIZUKI / EARTH TIME MACHINE
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
          Witness Earth Change
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Select a place on the map above and compare historical
          satellite observations at the same location.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-emerald-300">
        <MapPin size={17} />
        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
        <label className="space-y-2 text-xs text-slate-400">
          <span>Before year</span>
          <select
            value={beforeYear}
            onChange={e => setBeforeYear(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#152435] p-3 text-white"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        <ArrowLeftRight className="mb-3 hidden text-emerald-400 md:block" />

        <label className="space-y-2 text-xs text-slate-400">
          <span>After year</span>
          <select
            value={afterYear}
            onChange={e => setAfterYear(Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-[#152435] p-3 text-white"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={compare}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-[#07131a] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing...' : 'Compare'}
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {current && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <SatellitePanel
              key={`before-${selectionKey}`}
              title="Before"
              year={beforeYear}
              data={before}
              location={location}
            />
            <SatellitePanel
              key={`after-${selectionKey}`}
              title="After"
              year={afterYear}
              data={after}
              location={location}
            />
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
            <p className="text-sm text-slate-400">
              Point vegetation index change
            </p>

            <p className="mt-2 text-4xl font-semibold text-white">
              {difference == null
                ? 'N/A'
                : `${difference >= 0 ? '+' : ''}${difference.toFixed(4)}`}
            </p>

            <p className="mt-3 text-sm text-slate-300">
              {difference == null
                ? 'No comparable valid NDVI measurements were available.'
                : difference > 0.03
                  ? 'Higher vegetation index at this point in the later observation.'
                  : difference < -0.03
                    ? 'Lower vegetation index at this point in the later observation.'
                    : 'Small NDVI difference at this point.'}
            </p>
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Sentinel-2 L2A imagery and point NDVI. Observations
        may fall in different seasons. NDVI differences alone
        do not establish deforestation or climate causation.
        Measurements are preliminary pending radiometric
        calibration validation. Image availability depends
        on the external satellite imagery service.
      </p>
    </section>
  )
}