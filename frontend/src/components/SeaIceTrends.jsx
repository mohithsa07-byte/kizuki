import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts'

function parseCSV(csv) {
  const result = new Map()

  for (const line of csv.split(/\r?\n/)) {
    const cells = line.split(',').map(value => value.trim())
    const year = Number(cells[0])
    const extent = Number(cells[4])

    if (
      Number.isInteger(year) &&
      year >= 1979 &&
      year <= 2100 &&
      Number.isFinite(extent) &&
      extent >= 0 &&
      extent < 40
    ) {
      result.set(year, extent)
    }
  }

  return result
}

function ValueCard({ title, value, detail, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#102432] p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold" style={{ color }}>
        {value == null ? 'N/A' : value.toFixed(2)}
        <span className="ml-2 text-xs text-slate-400">
          million km²
        </span>
      </p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

export default function SeaIceTrends({ year, compareYear }) {
  const [arctic, setArctic] = useState(new Map())
  const [antarctic, setAntarctic] = useState(new Map())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const paths = [
          '/data/arctic-september.csv',
          '/data/antarctic-february.csv'
        ]

        const responses = await Promise.all(
          paths.map(path => fetch(path))
        )

        if (responses.some(response => !response.ok)) {
          throw new Error('Unable to load NSIDC datasets')
        }

        const files = await Promise.all(
          responses.map(response => response.text())
        )

        const north = parseCSV(files[0])
        const south = parseCSV(files[1])

        if (!north.size || !south.size) {
          throw new Error('No valid sea ice measurements found')
        }

        if (active) {
          setArctic(north)
          setAntarctic(south)
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const data = useMemo(() => {
    const years = new Set([...arctic.keys(), ...antarctic.keys()])

    return [...years]
      .sort((a, b) => a - b)
      .map(y => ({
        year: y,
        arctic: arctic.get(y) ?? null,
        antarctic: antarctic.get(y) ?? null
      }))
  }, [arctic, antarctic])

  const selected = data.find(row => row.year === year)
  const previous = data.find(row => row.year === compareYear)

  function difference(key) {
    const a = selected?.[key]
    const b = previous?.[key]
    return a == null || b == null ? null : a - b
  }

  const northChange = difference('arctic')
  const southChange = difference('antarctic')

  function formatChange(value) {
    if (value == null) return 'N/A'
    return `${value > 0 ? '+' : ''}${value.toFixed(2)} million km²`
  }

  return (
    <section className="rounded-2xl border border-emerald-300/15 bg-[#0c1a28] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">
            KIZUKI / Polar Intelligence
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Arctic vs Antarctic Sea Ice
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Historical monthly average sea ice extent
          </p>
        </div>
        <span className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">
          NSIDC Sea Ice Index v4
        </span>
      </div>

      {loading ? (
        <p className="mt-8 text-slate-400">Loading satellite records...</p>
      ) : error ? (
        <p className="mt-8 text-red-300">{error}</p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ValueCard
              title={`Arctic · September ${year}`}
              value={selected?.arctic}
              detail={`Change from ${compareYear}: ${formatChange(northChange)}`}
              color="#67e8f9"
            />
            <ValueCard
              title={`Antarctic · February ${year}`}
              value={selected?.antarctic}
              detail={`Change from ${compareYear}: ${formatChange(southChange)}`}
              color="#fbbf24"
            />
          </div>

          <div className="mt-7 h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 12, right: 12, bottom: 5, left: 4 }}>
                <CartesianGrid stroke="#263747" strokeDasharray="4 5" />
                <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  width={45}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(2)} million km²`
                  ]}
                  contentStyle={{
                    background: '#0b1b29',
                    border: '1px solid #274553',
                    borderRadius: 12,
                    color: '#fff'
                  }}
                />
                <Legend />
                <ReferenceLine x={year} stroke="#94a3b8" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="arctic"
                  name="Arctic · September"
                  stroke="#67e8f9"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="antarctic"
                  name="Antarctic · February"
                  stroke="#fbbf24"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-4 text-xs leading-6 text-slate-400">
            The chart compares each hemisphere's typical minimum-ice
            season: September in the Arctic and February in Antarctica.
            Extent measures ocean area with at least 15% ice concentration.
            Monthly averages are not daily minimum measurements.
            Differences between individual years are not long-term trends.
          </p>
        </>
      )}

      <a
        href="https://nsidc.org/data/seaice_index"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-xs font-semibold text-emerald-300 hover:underline"
      >
        Source: NSIDC Sea Ice Index, Version 4
      </a>
    </section>
  )
}
