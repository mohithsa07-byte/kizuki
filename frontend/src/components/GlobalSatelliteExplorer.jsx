import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMapEvents
} from 'react-leaflet'
import {
  Satellite,
  MapPin,
  Cloud,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

const API_BASE = 'https://kizuki-eta.vercel.app/api'

const YEARS = Array.from(
  { length: 10 },
  (_, index) => 2025 - index
)

function MapClick({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: Number(event.latlng.lat.toFixed(4)),
        lng: Number(event.latlng.lng.toFixed(4))
      })
    }
  })
  return null
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">
        {value}
      </p>
    </div>
  )
}

export default function GlobalSatelliteExplorer({ onLocationChange }) {
  const [location, setLocation] = useState({
    lat: 12.9716,
    lng: 77.5946
  })

  const [year, setYear] = useState(2024)
  const [maxCloud, setMaxCloud] = useState(30)
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadScenes() {
      setLoading(true)
      setError('')
      setLoaded(false)
      setScenes([])

      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
        max_cloud: String(maxCloud)
      })

      try {
        const response = await fetch(
          `${API_BASE}/satellite/scenes?${params}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          let message = `Satellite API error ${response.status}`

          try {
            const body = await response.json()
            if (body.detail) message = String(body.detail)
          } catch {
            // Preserve the HTTP error.
          }

          throw new Error(message)
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setScenes(data.scenes || [])
          setLoaded(true)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Unable to load satellite scenes')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadScenes()
    return () => controller.abort()
  }, [
    location.lat,
    location.lng,
    year,
    maxCloud,
    refresh
  ])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Satellite className="text-emerald-400" size={22} />
            Global Satellite Explorer
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Discover real Sentinel-2 imagery anywhere on Earth.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefresh(v => v + 1)}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0c1825] p-4">
          <label className="text-xs text-slate-400">
            Observation year
          </label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-white/10 bg-[#152435] p-2 text-white"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0c1825] p-4">
          <label className="text-xs text-slate-400">
            Maximum scene cloud cover
          </label>
          <select
            value={maxCloud}
            onChange={e => setMaxCloud(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-white/10 bg-[#152435] p-2 text-white"
          >
            <option value={10}>10%</option>
            <option value={20}>20%</option>
            <option value={30}>30%</option>
            <option value={50}>50%</option>
            <option value={80}>80%</option>
          </select>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0c1825] p-4">
          <p className="text-xs text-slate-400">
            Selected coordinates
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
            <MapPin size={16} />
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1825]">
          <div className="h-[430px]">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              scrollWheelZoom
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClick onSelect={(point) => { setLocation(point); onLocationChange?.(point) }} />
              <CircleMarker
                center={[location.lat, location.lng]}
                radius={8}
                pathOptions={{
                  color: '#34d399',
                  fillColor: '#10b981',
                  fillOpacity: 0.7
                }}
              />
            </MapContainer>
          </div>
          <p className="p-3 text-xs text-slate-400">
            Click anywhere to search nearby satellite scenes.
            This is a geographic basemap, not an NDVI heatmap.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              label="Scenes found"
              value={loaded ? scenes.length : '—'}
            />
            <InfoCard
              label="Data source"
              value="Sentinel-2"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1825] p-4">
            <h3 className="text-sm font-semibold text-white">
              Satellite observations
            </h3>

            {loading && (
              <p className="mt-4 text-sm text-emerald-300">
                Searching satellite catalog...
              </p>
            )}

            {error && (
              <div className="mt-4 flex gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {loaded && scenes.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                No matching scenes were returned.
                Try a higher cloud threshold or another year.
              </p>
            )}

            <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto">
              {scenes.map(scene => (
                <div
                  key={scene.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-white">
                      <Calendar size={14} className="text-emerald-400" />
                      {scene.date?.slice(0, 10) || 'Unknown date'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Cloud size={14} />
                      {scene.cloud_cover_percent}%
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Platform: {scene.platform || 'Sentinel-2'}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {scene.red_band_available && scene.nir_band_available ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-emerald-300">
                          Red and NIR bands available
                        </span>
                      </>
                    ) : (
                      <span className="text-amber-300">
                        Required band availability unconfirmed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Source: Element 84 Earth Search, Sentinel-2 Level-2A.
        Cloud cover is reported for each scene, not necessarily
        the selected pixel. Scene discovery does not calculate
        NDVI or prove vegetation change.
      </p>
    </div>
  )
}
