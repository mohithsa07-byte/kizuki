import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents
} from 'react-leaflet'

function MapClick({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    }
  })

  return null
}

function MoveToLocation({ location }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(
      [location.lat, location.lng],
      Math.max(map.getZoom(), 4),
      { duration: 0.8 }
    )
  }, [location.lat, location.lng, map])

  return null
}

export default function ForecastWorldMap({
  location,
  onPick
}) {
  return (
    <div className="relative h-[330px] overflow-hidden rounded-2xl border border-emerald-300/15 bg-[#071521] sm:h-[420px]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        <MapClick onPick={onPick} />
        <MoveToLocation location={location} />

        <CircleMarker
          center={[location.lat, location.lng]}
          radius={10}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: '#10b981',
            fillOpacity: 0.95
          }}
          interactive={false}
        />

        <CircleMarker
          center={[location.lat, location.lng]}
          radius={18}
          pathOptions={{
            color: '#34d399',
            weight: 1,
            opacity: 0.55,
            fillOpacity: 0
          }}
          interactive={false}
        />
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-xl border border-emerald-300/20 bg-[#071521]/95 px-4 py-3 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
          Global forecast location
        </p>
        <p className="mt-1 max-w-[210px] truncate text-sm font-semibold text-white">
          {location.name}
        </p>
        <p className="mt-1 font-mono text-[11px] text-slate-400">
          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-3 z-[500] rounded-lg bg-[#071521]/90 px-3 py-2 text-xs text-emerald-200">
        Click anywhere to forecast
      </div>
    </div>
  )
}