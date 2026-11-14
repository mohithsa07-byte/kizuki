import { useMemo, useState } from 'react'
import Card from '../components/Card'
import SampleBadge from '../components/SampleBadge'
import RealBadge from '../components/RealBadge'
import ClimateChart from '../charts/ClimateChart'
import TrendChart from '../charts/TrendChart'
import useApi from '../hooks/useApi'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i)

const selectClass =
  'rounded-lg border border-white/10 bg-navy-900/80 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-glow/50'

const TONES = {
  real: { line: 'from-emerald-glow to-teal-glow', tag: 'text-emerald-glow border-emerald-glow/30 bg-emerald-glow/10' },
  sample: { line: 'from-amber-400 to-orange-400', tag: 'text-amber-300 border-amber-300/30 bg-amber-300/10' },
  off: { line: 'from-gray-600 to-gray-500', tag: 'text-gray-400 border-white/10 bg-white/5' },
}

function KpiTile({ label, value, unit, note, tag, tone }) {
  const t = TONES[tone]
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl p-5">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.line}`} />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold text-white">
        {value}
        {unit && <span className="ml-1.5 text-base font-medium text-emerald-glow">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-gray-400">{note}</p>
      <span className={`mt-4 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${t.tag}`}>
        {tag}
      </span>
    </div>
  )
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function buildCharts(points) {
  const monthly = MONTHS.map((month, i) => {
    const rows = points.filter((p) => Number(p.date.slice(5)) === i + 1)
    const temp = mean(rows.filter((r) => r.temperature_c !== null).map((r) => r.temperature_c))
    const rain = mean(rows.filter((r) => r.rainfall_mm !== null).map((r) => r.rainfall_mm))
    return {
      month,
      temp: temp === null ? null : Number(temp.toFixed(2)),
      rain: rain === null ? null : Number(rain.toFixed(1)),
    }
  })

  const byYear = {}
  points.forEach((p) => {
    const year = p.date.slice(0, 4)
    byYear[year] = byYear[year] || []
    if (p.temperature_c !== null) byYear[year].push(p.temperature_c)
  })
  // Only complete years (12 valid months) are used for the yearly mean.
  const yearly = Object.entries(byYear)
    .filter(([, temps]) => temps.length === 12)
    .map(([year, temps]) => ({ year: Number(year), temp: Number(mean(temps).toFixed(2)) }))

  return { monthly, yearly }
}

function buildInsights(monthly) {
  const withTemp = monthly.filter((m) => m.temp !== null)
  const withRain = monthly.filter((m) => m.rain !== null)
  const insights = []
  if (withTemp.length) {
    const hottest = withTemp.reduce((a, b) => (b.temp > a.temp ? b : a))
    const coolest = withTemp.reduce((a, b) => (b.temp < a.temp ? b : a))
    insights.push(`Hottest month on average: ${hottest.month} (${hottest.temp} °C). Coolest: ${coolest.month} (${coolest.temp} °C).`)
  }
  if (withRain.length) {
    const wettest = withRain.reduce((a, b) => (b.rain > a.rain ? b : a))
    insights.push(`Wettest month on average: ${wettest.month} (${wettest.rain} mm).`)
  }
  return insights
}

export default function Overview() {
  const [startYear, setStartYear] = useState(2016)
  const [endYear, setEndYear] = useState(2023)
  const regionId = 'bengaluru-urban'

  const query = `region_id=${regionId}&start_year=${startYear}&end_year=${endYear}`
  const summary = useApi(`/api/climate/summary?${query}`)
  const series = useApi(`/api/climate/timeseries?${query}`)

  const charts = useMemo(
    () => (series.data ? buildCharts(series.data.points) : null),
    [series.data],
  )
  const insights = charts ? buildInsights(charts.monthly) : []

  const loading = summary.loading || series.loading
  const error = summary.error || series.error

  function changeStart(value) {
    setStartYear(value)
    if (value > endYear) setEndYear(value)
  }
  function changeEnd(value) {
    setEndYear(value)
    if (value < startYear) setStartYear(value)
  }

  const s = summary.data
  const tempValue = s && s.mean_temperature_c !== null ? String(s.mean_temperature_c) : 'N/A'
  const rainValue = s && s.mean_annual_rainfall_mm !== null ? String(s.mean_annual_rainfall_mm) : 'N/A'

  return (
    <div className="space-y-4">
      <section className="glass-panel-strong relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-glow/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-glow">Bengaluru Urban · Karnataka, India</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Climate overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Temperature and rainfall come from NASA POWER, a gridded model product at about 50 km resolution. Vegetation is still sample data.
        </p>
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-400">
            From year
            <select className={`${selectClass} mt-1 block`} value={startYear} onChange={(e) => changeStart(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">
            To year
            <select className={`${selectClass} mt-1 block`} value={endYear} onChange={(e) => changeEnd(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
          <span className="pb-2 text-xs text-gray-500">{loading && !error ? 'Loading from NASA POWER...' : `Period: ${startYear} to ${endYear}`}</span>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm text-red-200">
          Could not load climate data: {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Average temperature" value={tempValue} unit="°C" note="Air temperature (2 m)" tag={s ? 'NASA POWER' : 'Loading'} tone={s ? 'real' : 'off'} />
        <KpiTile label="Annual rainfall" value={rainValue} unit="mm" note="Mean total per year" tag={s ? 'NASA POWER' : 'Loading'} tone={s ? 'real' : 'off'} />
        <KpiTile label="Vegetation index" value="0.42" unit="NDVI" note="Greenness, not tree count" tag="Sample" tone="sample" />
        <KpiTile label="Air quality" value="N/A" unit="" note="No reliable source connected yet" tag="Not connected" tone="off" />
      </div>

      {charts && !error && (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card
              title="Average monthly temperature and rainfall"
              subtitle={`Mean of each calendar month, ${startYear} to ${endYear}`}
              action={<RealBadge />}
            >
              <ClimateChart data={charts.monthly} />
            </Card>
            <Card title="Yearly mean temperature" subtitle="Complete years only" action={<RealBadge />}>
              {charts.yearly.length > 0 ? (
                <TrendChart data={charts.yearly} />
              ) : (
                <p className="py-10 text-center text-sm text-gray-500">No complete years in this range.</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Environmental insights" subtitle="Calculated from the data above" action={<RealBadge />}>
              {insights.length > 0 ? (
                <ul className="space-y-3">
                  {insights.map((text) => (
                    <li key={text} className="flex gap-3 text-sm text-gray-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-glow" />
                      {text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Not enough valid data to summarise.</p>
              )}
            </Card>
            <Card title="About this data" subtitle={s ? s.source : ''}>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>Values come from a gridded model product (about 50 km cells), not a weather station. City-scale differences are not resolved.</li>
                <li>{s ? s.temperature_note : ''}</li>
                <li>Vegetation (NDVI) on this page is still sample data until satellite processing is added.</li>
              </ul>
              <div className="mt-3"><SampleBadge label="NDVI is sample" /></div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}