import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import SampleBadge from '../components/SampleBadge'
import StatCard from '../components/StatCard'
import ClimateChart from '../charts/ClimateChart'
import TrendChart from '../charts/TrendChart'
import { monthlyClimate, yearlyTemp, overviewStats, insights } from '../data/sampleData'

const regions = ['Bengaluru Urban', 'Bengaluru Rural']
const periods = ['2016 - 2023', '2020 - 2023']

const selectClass =
  'rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-glow/50'

export default function Overview() {
  const [region, setRegion] = useState(regions[0])
  const [period, setPeriod] = useState(periods[0])

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A snapshot of temperature, rainfall and vegetation for the selected region."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="text-xs text-gray-400">
          Region
          <select className={`${selectClass} mt-1 block`} value={region} onChange={(e) => setRegion(e.target.value)}>
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-400">
          Comparison period
          <select className={`${selectClass} mt-1 block`} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periods.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <p className="self-end pb-2 text-xs text-gray-500">
          Selected: {region}, {period}. Filters do not change the sample numbers yet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((s) => <StatCard key={s.id} {...s} />)}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Monthly temperature and rainfall" subtitle="Typical year" action={<SampleBadge />}>
          <ClimateChart data={monthlyClimate} />
        </Card>
        <Card title="Yearly mean temperature" subtitle="Air temperature trend" action={<SampleBadge />}>
          <TrendChart data={yearlyTemp} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Environmental insights" subtitle="Summaries from the sample series" action={<SampleBadge />}>
          <ul className="space-y-3">
            {insights.map((text) => (
              <li key={text} className="flex gap-3 text-sm text-gray-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-glow" />
                {text}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Map preview" subtitle="Interactive map arrives in Batch 3">
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-gray-500">
            Map placeholder
          </div>
        </Card>
      </div>
    </div>
  )
}
