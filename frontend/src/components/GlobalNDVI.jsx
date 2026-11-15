import { useState } from 'react'
import { Satellite, Leaf, AlertCircle } from 'lucide-react'

const API = 'https://kizuki-eta.vercel.app/api'

export default function GlobalNDVI() {
  const [lat, setLat] = useState('12.9716')
  const [lng, setLng] = useState('77.5946')
  const [year, setYear] = useState('2024')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function analyze() {
    setLoading(true)
    setError('')
    setData(null)

    try {
      const params = new URLSearchParams({
        lat,
        lng,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
        max_cloud: '30'
      })

      const response = await fetch(
        `${API}/satellite/ndvi?${params}`
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail || { status: response.status })
        )
      }

      setData(result)
    } catch (err) {
      setError(err.message || 'Satellite request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-[#0c1825] p-6">
      <div className="flex items-center gap-3">
        <Satellite className="text-emerald-400" />
        <div>
          <h2 className="text-xl font-semibold text-white">
            Global NDVI Measurement
          </h2>
          <p className="text-xs text-slate-400">
            Experimental Sentinel-2 pixel analysis
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <input
          type="number"
          step="any"
          min="-89.99"
          max="89.99"
          value={lat}
          onChange={e => setLat(e.target.value)}
          placeholder="Latitude"
          className="rounded-xl border border-white/10 bg-[#152435] p-3 text-white"
        />

        <input
          type="number"
          step="any"
          min="-180"
          max="180"
          value={lng}
          onChange={e => setLng(e.target.value)}
          placeholder="Longitude"
          className="rounded-xl border border-white/10 bg-[#152435] p-3 text-white"
        />

        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#152435] p-3 text-white"
        >
          {Array.from({ length: 10 }, (_, i) => 2025 - i)
            .map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
        </select>

        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Calculate NDVI'}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {data && (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 text-emerald-300">
            <Leaf size={18} />
            Satellite measurement
          </div>

          <p className="mt-4 text-4xl font-semibold text-white">
            {data.mean_ndvi == null
              ? 'N/A'
              : Number(data.mean_ndvi).toFixed(4)}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {data.note}
          </p>

          {data.scene_date && (
            <p className="mt-3 text-xs text-slate-500">
              Scene: {data.scene_date.slice(0, 10)}
              {' · '}
              Valid pixels: {data.valid_pixels ?? 0}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

