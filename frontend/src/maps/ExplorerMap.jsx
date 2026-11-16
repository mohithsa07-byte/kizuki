import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'

function valueRange(places, key) {
  const values = places.map((p) => p[key])
  return { min: Math.min(...values), max: Math.max(...values) }
}

export default function ExplorerMap({ center, places, layer, selectedId, onSelect, height = 'h-[28rem]' }) {
  const { min, max } = valueRange(places, layer.id)

  return (
    <div className={`${height} w-full overflow-hidden rounded-xl border border-white/10`}>
      <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {places.map((p) => {
          const t = max === min ? 0.5 : (p[layer.id] - min) / (max - min)
          const selected = p.id === selectedId
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={10 + t * 14}
              pathOptions={{
                color: selected ? '#ffffff' : layer.color,
                weight: selected ? 3 : 1.5,
                fillColor: layer.color,
                fillOpacity: 0.35 + t * 0.4,
              }}
              eventHandlers={{ click: () => onSelect(p.id) }}
            >
              <Tooltip>
                {p.name}: {p[layer.id]} {layer.unit}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
