import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { downloadEnvironmentalReport } from '../services/api'

export default function ReportGenerator({
  location,
  startYear,
  endYear,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')

    try {
      await downloadEnvironmentalReport({
        location_name: location.name,
        lat: location.lat,
        lng: location.lng,
        start_year: startYear,
        end_year: endYear,
      })
    } catch (err) {
      setError(err.message || 'Unable to generate report.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-300/20 bg-[#102b36] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
            KIZUKI / RESEARCH EXPORT
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Environmental Intelligence Report
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {location.name} · {startYear}–{endYear}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            NASA POWER charts, location map and NVIDIA AI observations.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#79b7a5] px-5 py-3 text-sm font-semibold text-[#101820] transition hover:bg-[#9dd0c1] disabled:cursor-wait disabled:opacity-60"
        >
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <FileDown size={18} />}
          {loading ? 'Generating report...' : 'Generate PDF Report'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-400/20 p-3 text-sm text-amber-200">
          {error}
        </p>
      )}
    </section>
  )
}