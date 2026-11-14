import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import SampleBadge from '../components/SampleBadge'
import ExplorerMap from '../maps/ExplorerMap'
import { explorerCenter, explorerLayers, explorerPlaces, explorerYears } from '../data/explorerData'

const selectClass =
  'rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-glow/50'

export default function ClimateExplorer() {
  const [layerId, setLayerId] = useState(explorerLayers[0].id)
  const [year, setYear] = useState(explorerYears[explorerYears.length - 1])
  const [compareYear, setCompareYear] = useState(explorerYears[0])
  const [selectedId, setSelectedId] = useState(explorerPlaces[0].id)

  const layer = explorerLayers.find((l) => l.id === layerId)
  const place = explorerPlaces.find((p) => p.id === selectedId)

  return (
    <div>
      <PageHeader
        title="Climate Explorer"
        description="Explore climate layers on an interactive map of Bengaluru. Click a marker to see its details."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {explorerLayers.map((l) => (
          <button
            key={l.id}
            onClick={() => setLayerId(l.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              l.id === layerId
                ? 'border-emerald-glow/50 bg-emerald-glow/10 text-emerald-glow'
                : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="text-xs text-gray-400">
          Observation year
          <select className={`${selectClass} mt-1 block`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {explorerYears.map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-400">
          Compare with
          <select className={`${selectClass} mt-1 block`} value={compareYear} onChange={(e) => setCompareYear(Number(e.target.value))}>
            {explorerYears.map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
        <p className="self-end pb-2 text-xs text-gray-500">
          Years are selectable, but the sample values do not change with them yet.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card
          title={`${layer.label} map`}
          subtitle={`Showing ${year}, compared with ${compareYear}`}
          action={<SampleBadge />}
          className="xl:col-span-2"
        >
          <ExplorerMap
            center={explorerCenter}
            places={explorerPlaces}
            layer={layer}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <p className="mt-3 text-xs text-gray-500">
            Base map: OpenStreetMap contributors. Marker size and opacity grow with the value of the selected layer.
          </p>
        </Card>

        <Card title={place.name} subtitle="Location details" action={<SampleBadge />}>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-400">Air temperature</dt>
              <dd className="mt-1 text-2xl font-semibold text-white">{place.temp} <span className="text-sm text-emerald-glow">°C</span></dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-400">Annual rainfall</dt>
              <dd className="mt-1 text-2xl font-semibold text-white">{place.rain} <span className="text-sm text-emerald-glow">mm</span></dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-400">Vegetation index (NDVI)</dt>
              <dd className="mt-1 text-2xl font-semibold text-white">{place.ndvi}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-gray-500">
            Air temperature is not the same as satellite land surface temperature. NDVI shows greenness, not tree count.
          </p>
        </Card>
      </div>
    </div>
  )
}
