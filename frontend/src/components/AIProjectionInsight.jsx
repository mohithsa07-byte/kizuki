import { useState } from 'react'

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://127.0.0.1:8000'
    : 'https://kizuki-eta.vercel.app')
).replace(/\/+$/, '')

export default function AIProjectionInsight({
  projection,
  location,
  variable,
  horizon,
  sensitivity,
  isValid
}) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState('')

  const currentKey = JSON.stringify({
    location: location?.name,
    lat: location?.lat,
    lng: location?.lng,
    variable,
    horizon,
    sensitivity,
    baseline: projection?.target?.baseline,
    adjusted: projection?.target?.sensitivity
  })

  const isCurrent = requestKey === currentKey

  async function generate() {
    if (!isValid || !projection || loading) return

    setLoading(true)
    setError('')
    setResult(null)
    setRequestKey(currentKey)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)

    try {
      const payload = {
        location: `${location?.name || 'Selected location'} (${location?.lat}, ${location?.lng})`,
        variable: variable === 'temperature' ? 'temperature' : 'rainfall',
        first_year: projection.model.firstYear,
        last_year: projection.last,
        target_year: horizon,
        last_observed: projection.model.lastObserved,
        baseline: projection.target.baseline,
        adjusted: projection.target.sensitivity,
        sensitivity
      }

      const response = await fetch(
        `${API_BASE}/api/analyst/projection-insight`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      )

      if (!response.ok) {
        throw new Error(`AI service returned HTTP ${response.status}`)
      }

      const data = await response.json()
      if (!data.interpretation) {
        throw new Error('AI service returned an empty explanation')
      }

      setResult(data.interpretation)
    } catch (err) {
      setError(err.name === 'AbortError'
        ? 'The AI request timed out. Please try again.'
        : err.message)
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-[#0c1a28] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            NVIDIA Nemotron
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            AI Climate Interpretation
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">
            AI explains the statistical projection, its assumptions,
            and limitations. It does not calculate the forecast.
          </p>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={!isValid || loading}
          className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Analysing...' : 'Generate AI Interpretation'}
        </button>
      </div>

      {loading && (
        <p className="mt-5 text-sm text-emerald-200">
          NVIDIA Nemotron is interpreting the projection...
        </p>
      )}

      {error && isCurrent && (
        <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {result && isCurrent && !loading && (
        <div className="mt-5 whitespace-pre-wrap rounded-xl border border-white/10 bg-[#071521] p-5 text-sm leading-7 text-slate-200">
          {result}
        </div>
      )}

      {!isCurrent && result && (
        <p className="mt-4 text-xs text-amber-200">
          Projection settings changed. Generate a new interpretation.
        </p>
      )}

      <p className="mt-4 text-[11px] text-slate-500">
        Experimental AI-assisted explanation. Not a validated climate
        prediction, confidence interval, or policy recommendation.
      </p>
    </section>
  )
}
