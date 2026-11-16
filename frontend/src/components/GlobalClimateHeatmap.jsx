import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  WMSTileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet'

const NASA_WMS =
  'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi'

const MODIS_LAYER =
  'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day'

function Camera({ location }) {
  const map = useMap()

  useEffect(() => {
    if (!location) return

    map.flyTo(
      [location.lat, location.lng],
      7,
      { duration: 1.3 }
    )
  }, [location?.lat, location?.lng, map])

  return null
}

function MapInteractions({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng)
    },
  })

  return null
}

function ClimateMap({ year, location, onSelect }) {
  const date = `${year}-07-15`

  return (
    <MapContainer
      center={[15, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={10}
      zoomControl={false}
      scrollWheelZoom
      doubleClickZoom
      className="h-full w-full"
      style={{ background: '#07131e' }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
        maxZoom={19}
      />

      <WMSTileLayer
        key={date}
        url={NASA_WMS}
        layers={MODIS_LAYER}
        format="image/png"
        transparent
        opacity={0.88}
        version="1.1.1"
        time={date}
        attribution="NASA GIBS / MODIS Terra"
      />

      <Camera location={location} />
      <MapInteractions onSelect={onSelect} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  )
}

export default function GlobalClimateHeatmap({ location, year: controlledYear, onYearChange }) {
  // KIZUKI PS15 CONNECTED TIMELINE: controlled by Climate Explorer when provided.
  const [localYear, setLocalYear] = useState(2024)
  const year = controlledYear ?? localYear
  const setYear = onYearChange ?? setLocalYear
  const [selected, setSelected] = useState(null)

  const focus = selected || location

  useEffect(() => {
    setSelected(null)
  }, [location?.lat, location?.lng])

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-300/15 bg-[#0a1926]">
      <div className="border-b border-white/10 p-5 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.23em] text-emerald-300">
          KIZUKI / PLANETARY OBSERVATORY
        </p>

        <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
          Global Satellite Temperature Map
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Explore real NASA MODIS daytime land-surface
          temperature imagery. Select a region or click
          anywhere to zoom into the observations.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label
            htmlFor="modis-year"
            className="text-xs text-slate-300"
          >
            Observation year
          </label>

          <select
            id="modis-year"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-[#102b39] px-4 py-2.5 text-sm text-white"
          >
            {Array.from(
              { length: 16 },
              (_, i) => 2010 + i
            ).map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <label htmlFor="modis-year-timeline" className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs text-slate-300">
            <span>Satellite timeline · {year}</span>
            <input
              id="modis-year-timeline"
              type="range"
              min="2010"
              max="2025"
              step="1"
              value={year}
              onChange={event => setYear(Number(event.target.value))}
              aria-label="Satellite observation year"
              className="w-full cursor-pointer accent-emerald-500"
            />
          </label>

          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200">
            July monthly observation
          </span>

          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:text-white"
          >
            Return to selected region
          </button>
        </div>
      </div>

      <div className="relative h-[440px] bg-[#07131e] sm:h-[610px]">
        <ClimateMap
          year={year}
          location={focus}
          onSelect={point => setSelected({
            lat: point.lat,
            lng: point.lng,
          })}
        />

        <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-white/10 bg-[#071521]/90 p-3 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-widest text-emerald-300">
            NASA EARTH OBSERVATION
          </p>
          <p className="mt-1 text-xs text-white">
            MODIS Terra · July {year}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-5 sm:p-7">
        <p className="text-sm font-semibold text-white">
          Daytime land-surface temperature
        </p>

        <p className="text-xs leading-6 text-slate-400">
          Colors are provided by NASA's published MODIS
          visualization. They represent land-surface
          temperature, not air temperature. White or
          transparent areas may indicate unavailable
          observations, clouds, or areas outside the
          product coverage.
        </p>

        <p className="text-xs leading-6 text-slate-500">
          Source: NASA Global Imagery Browse Services,
          MODIS Terra monthly daytime land-surface
          temperature. The selected month is July,
          not a calendar-year mean. Higher map zoom
          does not increase the satellite's native
          measurement resolution.
        </p>
      </div>
    </section>
  )
}