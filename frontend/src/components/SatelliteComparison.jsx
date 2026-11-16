import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { apiGet } from '../services/api'

function Focus({ lat, lng }) {
  const map = useMap()

  useEffect(() => {
    map.setView([lat, lng], 12)
  }, [lat, lng, map])

  return null
}

function SatelliteView({ scene, lat, lng, title, year }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1926]">
      <div className="border-b border-white/10 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
          {title} / {year}
        </p>

        {scene ? (
          <>
            <p className="mt-2 text-sm font-semibold text-white">
              {scene.date?.slice(0, 10) || 'Date unavailable'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Scene cloud cover: {Number(scene.cloud_cover).toFixed(1)}%
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs text-amber-200">
            No usable satellite scene found for this year.
          </p>
        )}
      </div>

      {scene ? (
        <div className="h-[320px] sm:h-[420px]">
          <MapContainer
            center={[lat, lng]}
            zoom={12}
            minZoom={4}
            maxZoom={16}
            scrollWheelZoom={false}
            className="h-full w-full"
            style={{ background: '#07111c' }}
          >
            <Focus lat={lat} lng={lng} />
            <TileLayer
              url={scene.tile_url}
              attribution="Copernicus Sentinel-2 / Microsoft Planetary Computer"
              maxZoom={16}
            />
          </MapContainer>
        </div>
      ) : (
        <div className="flex h-[320px] items-center justify-center p-6 text-center text-sm text-slate-500">
          Imagery unavailable. No substitute image is shown.
        </div>
      )}
    </div>
  )
}

export default function SatelliteComparison({
  location,
  beforeYear,
  afterYear,
}) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  })

  useEffect(() => {
    let active = true

    if (
      beforeYear < 2017 ||
      afterYear < 2017 ||
      beforeYear === afterYear
    ) {
      setState({
        loading: false,
        data: null,
        error: 'Choose two different years from 2017 onward.',
      })
      return () => { active = false }
    }

    const params = new URLSearchParams({
      lat: location.lat.toFixed(4),
      lng: location.lng.toFixed(4),
      before_year: String(beforeYear),
      after_year: String(afterYear),
    })

    setState({ loading: true, data: null, error: null })

    apiGet(`/api/satellite/compare?${params}`)
      .then(data => {
        if (active) {
          setState({ loading: false, data, error: null })
        }
      })
      .catch(error => {
        if (active) {
          setState({
            loading: false,
            data: null,
            error: error.message || 'Satellite request failed.',
          })
        }
      })

    return () => { active = false }
  }, [
    location.lat,
    location.lng,
    beforeYear,
    afterYear,
  ])

  return (
    <section className="rounded-3xl border border-emerald-300/15 bg-[#0a1926] p-5 sm:p-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
        KIZUKI / EARTH OBSERVATION
      </p>

      <h2 className="mt-2 font-display text-2xl font-semibold text-white">
        Then vs Now — Satellite Comparison
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        {location.name} · {beforeYear} vs {afterYear}
      </p>

      {state.loading && (
        <p className="mt-6 text-sm text-emerald-200">
          Searching historical Sentinel-2 observations...
        </p>
      )}

      {state.error && (
        <p className="mt-6 rounded-xl border border-amber-300/20 p-4 text-sm text-amber-200">
          {state.error}
        </p>
      )}

      {state.data && (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SatelliteView
              title="THEN"
              year={beforeYear}
              scene={state.data.before}
              lat={location.lat}
              lng={location.lng}
            />
            <SatelliteView
              title="NOW"
              year={afterYear}
              scene={state.data.after}
              lat={location.lat}
              lng={location.lng}
            />
          </div>

          <p className="mt-4 text-xs leading-6 text-slate-500">
            {state.data.note}
          </p>
        </>
      )}

      <p className="mt-4 text-[11px] text-slate-500">
        Source: Copernicus Sentinel-2 imagery via Microsoft Planetary Computer.
        These are individual scenes, not cloud-free annual mosaics.
      </p>
    </section>
  )
}