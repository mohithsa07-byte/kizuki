import { useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import SampleBadge from '../components/SampleBadge'
import { ndviPeriods, ndviSummary, ndviZones } from '../data/sampleData2'

const selectClass =
  'rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-glow/50'

function change(before, after) {
  return ((after - before) / before) * 100
}

export default function Vegetation() {
  const [periodA, setPeriodA] = useState(ndviPeriods[0])
  const [periodB, setPeriodB] = useState(ndviPeriods[2])

  const overall = change(ndviSummary.before, ndviSummary.after)

  return (
    <div>
      <PageHeader
        title="Vegetation Change"
        description="Compare vegetation greenness (NDVI) between two observation periods. Satellite processing is built in Milestone 5."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="text-xs text-gray-400">
          Period A (before)
          <select className={`${selectClass} mt-1 block`} value={periodA} onChange={(e) => setPeriodA(e.target.value)}>
            {ndviPeriods.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-400">
          Period B (after)
          <select className={`${selectClass} mt-1 block`} value={periodB} onChange={(e) => setPeriodB(e.target.value)}>
            {ndviPeriods.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <p className="self-end pb-2 text-xs text-gray-500">
          Selected: {periodA} vs {periodB}. Sample values do not change with the selection yet.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Before" subtitle={periodA} action={<SampleBadge />}>
          <p className="text-4xl font-semibold text-white">{ndviSummary.before}</p>
          <p className="mt-1 text-xs text-gray-400">Mean NDVI</p>
        </Card>
        <Card title="After" subtitle={periodB} action={<SampleBadge />}>
          <p className="text-4xl font-semibold text-white">{ndviSummary.after}</p>
          <p className="mt-1 text-xs text-gray-400">Mean NDVI</p>
        </Card>
        <Card title="Change" subtitle="Relative to before" action={<SampleBadge />}>
          <p className={`flex items-center gap-2 text-4xl font-semibold ${overall < 0 ? 'text-orange-400' : 'text-emerald-glow'}`}>
            {overall < 0 ? <ArrowDownRight size={32} /> : <ArrowUpRight size={32} />}
            {overall.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-gray-400">{ndviSummary.note}</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Change by area" subtitle="Mean NDVI before and after" action={<SampleBadge />}>
          <div className="space-y-4">
            {ndviZones.map((z) => {
              const pct = change(z.before, z.after)
              return (
                <div key={z.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-200">{z.name}</span>
                    <span className={pct < -5 ? 'text-orange-400' : 'text-gray-400'}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-emerald-glow/70" style={{ width: `${z.after * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{z.before} to {z.after}</p>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Before and after map" subtitle="Satellite layers arrive in Milestone 5">
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
            Satellite comparison placeholder
          </div>
          <div className="mt-4 flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <Info size={18} className="mt-0.5 shrink-0 text-teal-glow" />
            <p className="text-xs leading-relaxed text-gray-400">
              NDVI = (NIR - Red) / (NIR + Red). It measures vegetation greenness. It is not a direct
              measure of tree count, biodiversity or forest area, and it varies with season, rainfall and cloud cover.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
