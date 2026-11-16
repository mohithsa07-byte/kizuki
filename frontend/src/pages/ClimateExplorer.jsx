import SeaIceTrends from '../components/SeaIceTrends'
import ReportGenerator from '../components/ReportGenerator'
import SatelliteComparison from '../components/SatelliteComparison'
import GlobalClimateHeatmap from '../components/GlobalClimateHeatmap'
import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
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
  // KIZUKI PS15 CONNECTED TIMELINE
  const [year, setYear] = useState(2024)
  const [compareYear, setCompareYear] = useState(2018)
  const [layer, setLayer] = useState('temperature')
  const [basemap, setBasemap] = useState('dark')
  const [hemisphere, setHemisphere] = useState('arctic')

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
  const chartUnit = layer === 'temperature' ? 'Ã‚Â°C' : 'mm'

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
                Climate Observatory
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
              Observation parameters
            </h2>
          </div>

          {layer === 'sea-ice' && (
          <Panel>
            <p className="text-sm font-semibold text-white">Sea ice concentration Ã‚Â· satellite visualization</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              The map requests a NASA GIBS AMSR2 sea ice concentration image for the selected year.
              Arctic observations use September 15; Antarctic observations use February 15.
              The existing Leaflet map uses Web Mercator, which cannot display the poles themselves.
              Blank imagery may mean the selected layer/date is unavailable in this projection.
              This visualization does not calculate sea ice extent or a quantitative year-over-year trend.
            </p>
            <a href="https://worldview.earthdata.nasa.gov/" target="_blank" rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-emerald-300 hover:underline">
              Open NASA Worldview for native polar exploration
            </a>
          </Panel>
        )}

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

            <div className="space-y-3 md:col-span-2 xl:col-span-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="climate-year-timeline" className="text-xs font-semibold text-slate-300">
                  Interactive climate timeline
                </label>
                <output htmlFor="climate-year-timeline" className="text-sm font-semibold text-emerald-300">
                  {year}
                </output>
              </div>
              <input
                id="climate-year-timeline"
                type="range"
                min={YEARS[0]}
                max={YEARS[YEARS.length - 1]}
                step="1"
                value={year}
                onChange={event => setYear(Number(event.target.value))}
                aria-label="Climate observation year"
                className="w-full cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{YEARS[0]}</span>
                <span>Drag to update selected-year statistics and charts</span>
                <span>{YEARS[YEARS.length - 1]}</span>
              </div>
            </div>

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
                <option value="sea-ice">Sea ice concentration</option>
              </select>
            </label>
            {layer === 'sea-ice' && (
              <label className="space-y-2">
                <span className="text-xs text-slate-400">Polar region</span>
                <select className={SELECT_STYLE} value={hemisphere} onChange={e => setHemisphere(e.target.value)}>
                  <option value="arctic">Arctic Ã‚Â· September</option>
                  <option value="antarctic">Antarctic Ã‚Â· February</option>
                </select>
              </label>
            )}
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
                    : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                }
                attribution={
                  basemap === 'satellite'
                    ? 'Tiles Ã‚Â© Esri'
                    : 'Ã‚Â© OpenStreetMap contributors'
                }
                className=''
              />

              {/* KIZUKI PS15 VERIFIED MAP LAYER: NASA MODIS Terra July daytime
                  land-surface temperature; NOT NASA POWER air temperature. */}
              {layer === 'temperature' && (
                <WMSTileLayer
                  key={`modis-${year}`}
                  url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                  layers="MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day"
                  format="image/png" transparent opacity={0.82}
                  version="1.1.1" time={`${year}-07-15`}
                  attribution="NASA GIBS Ã‚Â· MODIS Terra July daytime LST"
                />
              )}

              {layer === 'sea-ice' && (
                <WMSTileLayer
                  key={`sea-ice-${hemisphere}-${year}`}
                  url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
                  layers="AMSRU2_Sea_Ice_Concentration_12km"
                  format="image/png"
                  transparent
                  opacity={0.9}
                  version="1.1.1"
                  time={`${year}-${hemisphere === 'arctic' ? '09-15' : '02-15'}`}
                  attribution="NASA GIBS / AMSR2 sea ice concentration"
                />
              )}

              {/* KIZUKI GEOGRAPHICAL LABELS */}
              <TileLayer
                url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                attribution="Labels © Esri"
                opacity={1}
                zIndex={450}
              />
              <ZoomControl position="bottomright" />

              <MapEvents onSelect={setLocation} />
              {layer === 'sea-ice' ? (
                <MapCamera location={{lat: hemisphere === 'arctic' ? 78 : -75, lng: 0}} />
              ) : (
                <MapCamera location={location} />
              )}

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

            {/* KIZUKI MAP LEGEND */}
            <div className="absolute bottom-16 right-4 z-[500] w-56 max-h-[65%] overflow-y-auto rounded-2xl border border-emerald-300/20 bg-[#071521]/95 p-4 shadow-2xl backdrop-blur-xl">

              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                Colour interpretation
              </p>

              {layer === 'temperature' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">
                    Land surface temperature
                  </p>

                  <p className="text-[11px] text-slate-300">
                    Read the NASA colour scale below to match
                    map colours with temperature values.
                  </p>

                  <img
                    src="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day"
                    alt="NASA MODIS land surface temperature colour scale"
                    className="max-h-52 max-w-full object-contain"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling.style.display = 'block'
                    }}
                  />

                  <p style={{display:'none'}} className="text-xs text-amber-300">
                    Official temperature colour scale unavailable.
                    Numerical colour meanings cannot be verified.
                  </p>

                  <p className="text-[11px] leading-5 text-slate-400">
                    Temperature refers to the land surface,
                    not the surrounding air.
                  </p>
                </div>
              )}

              {layer === 'sea-ice' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white">
                    Sea ice concentration
                  </p>

                  <p className="text-[11px] text-slate-300">
                    Concentration measures how much of an
                    observed ocean area is covered by ice.
                  </p>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-slate-600"/>
                      <span>0% â€” Open water</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-slate-500"/>
                      <span>1â€“14% â€” Sparse ice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-slate-400"/>
                      <span>15â€“49% â€” Partial ice cover</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-slate-300"/>
                      <span>50â€“79% â€” Substantial ice cover</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-white"/>
                      <span>80â€“100% â€” Dense ice cover</span>
                    </div>
                  </div>

                  <p className="text-[10px] leading-4 text-amber-200">
                    The swatches above are illustrative concentration
                    categories, not verified NASA map colours.
                  </p>

                  <img
                    src="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=AMSRU2_Sea_Ice_Concentration_12km"
                    alt="Official NASA sea ice concentration colour legend"
                    className="max-h-44 max-w-full object-contain"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling.style.display = 'block'
                    }}
                  />

                  <p style={{display:'none'}} className="text-[11px] text-amber-300">
                    Official satellite colour scale unavailable.
                  </p>
                </div>
              )}

              {layer === 'rainfall' && (
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="font-semibold text-white">
                    Annual precipitation
                  </p>
                  <p>
                    Measured in millimetres (mm).
                    Higher values indicate more rainfall.
                  </p>
                  <p className="text-slate-400">
                    No coloured rainfall raster is currently
                    displayed on this map.
                  </p>
                </div>
              )}

              <p className="mt-4 border-t border-white/10 pt-3 text-[10px] text-slate-500">
                Satellite source: NASA GIBS
              </p>
            </div>
            <div className="pointer-events-none absolute right-4 top-4 z-[500] max-w-[220px] rounded-xl border border-white/10 bg-[#071521]/90 px-3 py-2 backdrop-blur-xl">
              <p className="text-xs font-semibold text-white">
                {layer === 'temperature' ? `Satellite surface temperature Ã‚Â· July ${year}` : layer === 'sea-ice' ? `Sea ice concentration Ã‚Â· ${hemisphere === 'arctic' ? 'September' : 'February'} ${year}` : `Annual rainfall Ã‚Â· ${year}`}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">
                {layer === 'temperature'
                  ? 'NASA MODIS imagery; surface temperature, not 2 m air temperature.'
                  : layer === 'sea-ice'
                    ? 'NASA AMSR2 imagery (12 km). Polar areas may not render fully in Web Mercator.'
                    : 'NASA POWER rainfall is shown for the selected location, not as a global rainfall raster.'}
              </p>
            </div>

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
              Observation station
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
                  Mean air temperature Ã‚Â· {year}
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {climate.loading ? '...' : display(current?.temp, 2)}
                  <span className="ml-2 text-sm text-emerald-300">Ã‚Â°C</span>
                </p>
              </div>

              <div className="border-b border-white/10 pb-5">
                <p className="text-xs text-slate-400">
                  Annual precipitation Ã‚Â· {year}
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
              Climate values represent NASA POWER gridded historical
              estimates, not street-level sensors. With Temperature
              selected, the map additionally shows a July NASA MODIS
              land-surface-temperature satellite layer for {year}.
              This differs from annual mean air temperature in the
              charts. Rainfall remains a location-based statistic;
              no rainfall raster is implied.
            </p>
          </Panel>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Thermometer}
            title={`Temperature Ã‚Â· ${year}`}
            value={climate.loading ? '...' : display(current?.temp, 2)}
            unit="Ã‚Â°C"
            detail="Annual mean air temperature at 2 metres"
          />

          <Metric
            icon={CloudRain}
            title={`Rainfall Ã‚Â· ${year}`}
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
            unit="Ã‚Â°C"
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
                Time-series intelligence
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold text-white">
                {layer === 'temperature'
                  ? 'Annual temperature trend'
                  : layer === 'sea-ice'
                    ? 'Annual precipitation trend (separate climate context)'
                    : 'Annual precipitation trend'}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                {location.name} Ã‚Â· {start}Ã¢â‚¬â€œ{end}
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

        <SeaIceTrends
          year={year}
          compareYear={compareYear}
        />
        <ReportGenerator
          location={location}
          startYear={start}
          endYear={end}
        />

        <SatelliteComparison
          location={location}
          beforeYear={compareYear}
          afterYear={year}
        />

        <GlobalClimateHeatmap location={location} year={year} onYearChange={setYear} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5">
          <p className="text-xs text-slate-500">
            KIZUKI Ã‚Â· See the change. Understand the cause.
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
