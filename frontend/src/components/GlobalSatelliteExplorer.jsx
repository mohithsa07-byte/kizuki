import { useEffect, useState } from 'react'
import {
  MapContainer, TileLayer, CircleMarker,
  useMap, useMapEvents, ScaleControl, ImageOverlay
} from 'react-leaflet'
import {
  Satellite, MapPin, Cloud, Calendar,
  RefreshCw, AlertCircle, CheckCircle2,
  Search, Layers3, Crosshair, Map as MapIcon
} from 'lucide-react'

const API_BASE = 'https://kizuki-eta.vercel.app/api'
const START = { lat: 12.9716, lng: 77.5946 }
const YEARS = Array.from({ length: 10 }, (_, i) => 2025 - i)

const LAYERS = {
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles Â© Esri, Maxar, Earthstar Geographics and contributors'
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Â© OpenStreetMap contributors, SRTM | Â© OpenTopoMap (CC-BY-SA)'
  },
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'Â© OpenStreetMap contributors'
  }
}

const PC_TILES = 'https://planetarycomputer.microsoft.com/api/data/v1'

function getHistoricalOverlay(sceneId, location) {
  if (!sceneId) return null

  // Fixed geographic footprint centered on the selected point.
  // This is a local observation patch, not a global yearly mosaic.
  const delta = 0.009
  const south = Math.max(-85, location.lat - delta)
  const north = Math.min(85, location.lat + delta)
  const west = Math.max(-180, location.lng - delta)
  const east = Math.min(180, location.lng + delta)

  const bbox = [west, south, east, north].join(',')

  const params = new URLSearchParams({
    collection: 'sentinel-2-l2a',
    item: sceneId,
    assets: 'visual',
    asset_bidx: 'visual|1,2,3',
    nodata: '0'
  })

  return {
    url: `${PC_TILES}/item/bbox/${bbox}/700x500.png?${params}`,
    bounds: [[south, west], [north, east]]
  }
}
function SelectOnMap({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: Number(event.latlng.lat.toFixed(5)),
        lng: Number(event.latlng.lng.toFixed(5))
      })
    }
  })
  return null
}

function FlyToLocation({ location, targetZoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(
      [location.lat, location.lng],
      targetZoom,
      { duration: 1.1 }
    )
  }, [map, location.lat, location.lng, targetZoom])
  return null
}

function MapResize() {
  const map = useMap()
  useEffect(() => {
    const node = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(node)
    return () => observer.disconnect()
  }, [map])
  return null
}

function Metric({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-[#19262d] p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words font-mono text-lg font-medium text-white">
        {value}
      </p>
    </div>
  )
}

export default function GlobalSatelliteExplorer({ onLocationChange }) {
  const [location, setLocation] = useState(START)
  const [targetZoom, setTargetZoom] = useState(4)
  const [layer, setLayer] = useState('satellite')
  const [year, setYear] = useState(2024)
  const [maxCloud, setMaxCloud] = useState(30)
  const [scenes, setScenes] = useState([])
  const [overlayFailed, setOverlayFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const historicalScene = scenes.find(scene => scene.id) || null
  const historicalOverlay =
    loaded && historicalScene
      ? getHistoricalOverlay(historicalScene.id, location)
      : null
  function selectLocation(point, zoom = 10) {
    const lat = Math.max(-85, Math.min(85, Number(point.lat)))
    const lng = Math.max(-180, Math.min(180, Number(point.lng)))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const next = {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5))
    }
    setLocation(next)
    setTargetZoom(zoom)
    onLocationChange?.(next)
  }

  async function findPlace(event) {
    event.preventDefault()
    if (!search.trim()) return

    setSearching(true)
    setSearchError('')

    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
      url.searchParams.set('name', search.trim())
      url.searchParams.set('count', '1')
      url.searchParams.set('language', 'en')
      url.searchParams.set('format', 'json')

      const response = await fetch(url)
      if (!response.ok) throw new Error('Place search is unavailable.')

      const data = await response.json()
      const place = data.results?.[0]

      if (!place) {
        throw new Error('No matching place found. Try a nearby city.')
      }

      selectLocation({
        lat: place.latitude,
        lng: place.longitude
      }, 10)
    } catch (err) {
      setSearchError(err.message || 'Unable to search')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadScenes() {
      setLoading(true)
      setError('')
      setLoaded(false)
      setScenes([])
      setOverlayFailed(false)

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
            if (body.detail) {
              message = typeof body.detail === 'string'
                ? body.detail
                : JSON.stringify(body.detail)
            }
          } catch {
            // Keep HTTP error
          }
          throw new Error(message)
        }

        const data = await response.json()
        if (!controller.signal.aborted) {
          setScenes(Array.isArray(data.scenes) ? data.scenes : [])
          setLoaded(true)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Unable to load scenes')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadScenes()
    return () => controller.abort()
  }, [location.lat, location.lng, year, maxCloud, refresh])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#79b7a5]">
            GEOSPATIAL WORKSPACE / 01
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            Satellite Explorer
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Explore the globe and discover Sentinel-2 observations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefresh(v => v + 1)}
          disabled={loading}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh scenes
        </button>
      </div>

      <form onSubmit={findPlace} className="flex min-w-0 gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/15 bg-[#19262d] px-3">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search a city or town worldwide"
            aria-label="Search location"
            className="min-h-11 w-full min-w-0 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="min-h-11 rounded-lg bg-[#79b7a5] px-4 text-sm font-semibold text-[#101820] disabled:opacity-50"
        >
          {searching ? 'Finding...' : 'Find'}
        </button>
      </form>

      {searchError && (
        <p role="alert" className="text-xs text-amber-300">
          {searchError}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="rounded-lg border border-white/10 bg-[#19262d] p-3">
          <span className="text-xs text-slate-400">Observation year</span>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="mt-2 w-full rounded-md border border-white/10 bg-[#101820] p-2 text-base text-white"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>

        <label className="rounded-lg border border-white/10 bg-[#19262d] p-3">
          <span className="text-xs text-slate-400">Maximum scene cloud cover</span>
          <select
            value={maxCloud}
            onChange={e => setMaxCloud(Number(e.target.value))}
            className="mt-2 w-full rounded-md border border-white/10 bg-[#101820] p-2 text-base text-white"
          >
            {[10, 20, 30, 50, 80].map(v => (
              <option key={v} value={v}>{v}%</option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-white/10 bg-[#19262d] p-3">
          <p className="text-xs text-slate-400">Selected point</p>
          <p className="mt-3 flex items-center gap-2 break-all font-mono text-xs text-[#79b7a5]">
            <MapPin size={15} className="shrink-0" />
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#19262d]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-3 sm:px-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Layers3 size={15} className="text-[#79b7a5]" />
              BASEMAP
            </div>

            <div className="flex flex-wrap gap-1">
              {Object.entries(LAYERS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLayer(key)}
                  aria-pressed={layer === key}
                  className={`min-h-9 rounded-md px-3 text-xs transition-colors ${
                    layer === key
                      ? 'bg-[#79b7a5] font-semibold text-[#101820]'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative h-[360px] w-full sm:h-[470px] lg:h-[560px]">
            <MapContainer
              center={[START.lat, START.lng]}
              zoom={4}
              minZoom={2}
              maxZoom={18}
              scrollWheelZoom={true}
              zoomControl
              style={{ height: '100%', width: '100%', background: '#101820' }}
            >
              <TileLayer
                key={layer}
                url={LAYERS[layer].url}
                attribution={LAYERS[layer].attribution}
                maxZoom={18}
                maxNativeZoom={layer === 'terrain' ? 17 : 18}
                className={layer === 'street' ? 'osm-dark' : ''}
              />
              {layer === 'satellite' &&
                historicalOverlay &&
                !overlayFailed && (
                  <ImageOverlay
                    key={`${historicalScene.id}-${year}-${location.lat}-${location.lng}`}
                    url={historicalOverlay.url}
                    bounds={historicalOverlay.bounds}
                    opacity={1}
                    zIndex={450}
                    eventHandlers={{
                      error: () => setOverlayFailed(true)
                    }}
                  />
                )}
              <SelectOnMap onSelect={point => selectLocation(point, targetZoom)} />
              <FlyToLocation location={location} targetZoom={targetZoom} />
              <MapResize />
              <ScaleControl position="bottomleft" imperial={false} />
              <CircleMarker
                center={[location.lat, location.lng]}
                radius={9}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: '#79b7a5',
                  fillOpacity: 0.95
                }}
              />
              <CircleMarker
                center={[location.lat, location.lng]}
                radius={19}
                pathOptions={{
                  color: '#79b7a5',
                  weight: 1,
                  fillOpacity: 0,
                  opacity: 0.8
                }}
              />
            </MapContainer>

            <div className="pointer-events-none absolute bottom-9 right-3 z-[500] rounded-md border border-white/20 bg-[#101820]/90 px-3 py-2 font-mono text-[10px] text-white">
              {location.lat.toFixed(4)}Â° / {location.lng.toFixed(4)}Â°
            </div>
          </div>

          {layer === 'satellite' && (
            <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">
              {loading ? (
                <span>Finding imagery for {year}...</span>
              ) : historicalOverlay && !overlayFailed ? (
                <span>
                  Historical Sentinel-2 image patch:
                  {' '}
                  <strong className="text-[#79b7a5]">
                    {historicalScene.date?.slice(0, 10) || year}
                  </strong>
                  {' · '}
                  Displayed near the selected coordinate.
                  The surrounding basemap is not historical.
                </span>
              ) : (
                <span>
                  Historical imagery unavailable for this selection.
                  The visible basemap is not imagery from {year}.
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Crosshair size={14} />
              Tap the map to select an observation point.
            </p>
            <button
              type="button"
              onClick={() => selectLocation(START, 4)}
              className="flex min-h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-xs text-slate-200 hover:bg-white/5"
            >
              <MapIcon size={14} />
              Reset view
            </button>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Scenes found"
              value={loaded ? scenes.length : loading ? '...' : 'â€”'}
            />
            <Metric label="Sensor" value="Sentinel-2" />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#19262d] p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                Satellite observations
              </h3>
              <Satellite size={17} className="text-[#79b7a5]" />
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Catalog results near the selected coordinate.
              Choose a different location or year to refresh.
            </p>

            {loading && (
              <p role="status" className="mt-4 text-sm text-[#79b7a5]">
                Searching Sentinel-2 catalog...
              </p>
            )}

            {error && (
              <div role="alert" className="mt-4 flex gap-2 rounded-md border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
                <AlertCircle size={16} className="shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}

            {loaded && scenes.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                No matching scenes. Try a different year or a higher cloud threshold.
              </p>
            )}

            <div className="mt-4 max-h-[490px] space-y-2 overflow-y-auto">
              {scenes.map(scene => (
                <div
                  key={scene.id}
                  className="rounded-lg border border-white/10 bg-[#101820] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-medium text-white">
                      <Calendar size={14} className="text-[#79b7a5]" />
                      {scene.date?.slice(0, 10) || 'Date unavailable'}
                    </span>

                    <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
                      <Cloud size={13} />
                      {scene.cloud_cover_percent == null
                        ? 'N/A'
                        : `${scene.cloud_cover_percent}%`}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {scene.platform || 'Sentinel-2'}
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    {scene.red_band_available && scene.nir_band_available ? (
                      <>
                        <CheckCircle2 size={14} className="text-[#79b7a5]" />
                        Red and NIR bands available
                      </>
                    ) : (
                      'Band availability unconfirmed'
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        Scene catalog: Element 84 Earth Search, Sentinel-2 Level-2A.
        Basemap imagery is for geographic context only, not a measured
        NDVI layer. Scene-level cloud cover does not establish cloud
        conditions at the selected pixel.
      </p>
    </section>
  )
}