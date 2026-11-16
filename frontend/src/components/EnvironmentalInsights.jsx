import { useEffect, useState } from 'react'
import { Leaf, Thermometer, CloudRain, ShieldCheck } from 'lucide-react'

const API = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://127.0.0.1:8000'
    : 'https://kizuki-eta.vercel.app')
).replace(/\/+$/, '')

async function getJSON(path, signal) {
  const response = await fetch(`${API}${path}`, { signal })
  if (!response.ok) {
    let detail = ''
    try {
      const payload = await response.json()
      detail = typeof payload.detail === 'string' ? payload.detail : ''
    } catch { /* The provider may return a non-JSON error. */ }
    throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`)
  }
  return response.json()
}

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null
}

function annualNDVI(data) {
  const observations = (data?.points || [])
    .filter(p => p.used === true && Number.isFinite(p.ndvi))
    .map(p => ({ value: p.ndvi, month: Number(String(p.date || '').slice(5, 7)) }))
    .filter(p => p.month >= 1 && p.month <= 12)

  return { observations, count: observations.length }
}

// Compare only months observed in BOTH years, avoiding seasonal mismatches.
function comparableNDVI(first, last) {
  if (!first || !last) return null
  const monthsA = new Set(first.observations.map(p => p.month))
  const monthsB = new Set(last.observations.map(p => p.month))
  const shared = [...monthsA].filter(month => monthsB.has(month))
  const a = first.observations.filter(p => shared.includes(p.month)).map(p => p.value)
  const b = last.observations.filter(p => shared.includes(p.month)).map(p => p.value)
  if (shared.length < 3 || a.length < 3 || b.length < 3) return null
  return { first: average(a), last: average(b), countA: a.length, countB: b.length, months: shared.length }
}

function ndviMessage(result, startYear, endYear) {
  if (startYear === endYear) {
    const n = result.firstData?.count || 0
    return n ? `${startYear}: ${n} good-quality MODIS NDVI observations available. Select different years to compare vegetation.`
      : result.firstNDVIError ? `MODIS request failed: ${result.firstNDVIError}`
      : `No good-quality MODIS NDVI observations available for ${startYear}.`
  }
  const failures = [
    result.firstNDVIError && `${startYear}: ${result.firstNDVIError}`,
    result.lastNDVIError && `${endYear}: ${result.lastNDVIError}`
  ].filter(Boolean)
  if (failures.length) return `NDVI service error — ${failures.join('; ')}. No vegetation change is inferred.`
  const a = result.firstData?.count || 0
  const b = result.lastData?.count || 0
  if (!a || !b) return `Insufficient good-quality MODIS NDVI observations: ${startYear} (${a}), ${endYear} (${b}). No vegetation change is inferred.`
  return `NDVI observations exist (${startYear}: ${a}; ${endYear}: ${b}), but fewer than 3 comparable months with at least 3 valid observations per year were found. No vegetation change is inferred.`
}

function annualClimate(data, year) {
  const points = (data?.points || []).filter(p =>
    Number(p.year ?? String(p.date || '').slice(0, 4)) === year
  )

  const temperatures = points
    .map(p => p.temperature_c ?? p.temperature ?? p.t2m)
    .filter(Number.isFinite)

  const rainfall = points
    .map(p => p.rainfall_mm ?? p.precipitation_mm ?? p.rainfall)
    .filter(Number.isFinite)

  return {
    temperature: temperatures.length === 12
      ? average(temperatures) : null,
    rainfall: rainfall.length === 12
      ? rainfall.reduce((a, b) => a + b, 0) : null
  }
}

function Insight({ icon: Icon, title, children }) {
  return (
    <article className="kizuki-insight">
      <div className="kizuki-insight-icon">
        <Icon size={18} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  )
}

export default function EnvironmentalInsights({
  selection,
  startYear,
  endYear
}) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    async function load() {
      setLoading(true)
      setError(null)
      setResult(null)

      const lat = selection.lat.toFixed(4)
      const lng = selection.lng.toFixed(4)

      const ndviURL = year =>
        `/api/ndvi/timeseries?lat=${lat}&lng=${lng}` +
        `&start_date=${year}-01-01&end_date=${year}-12-31`

      const climateURL =
        `/api/climate/timeseries?lat=${lat}&lng=${lng}` +
        `&start_year=${startYear}&end_year=${endYear}`

      try {
        // Climate and NDVI are independent.
        // One unavailable source must not erase the others.
        const [climate, firstNDVI, lastNDVI] =
          await Promise.allSettled([
            getJSON(climateURL, signal),
            getJSON(ndviURL(startYear), signal),
            startYear === endYear
              ? Promise.resolve(null)
              : getJSON(ndviURL(endYear), signal)
          ])

        if (signal.aborted) return

        const climateData =
          climate.status === 'fulfilled' ? climate.value : null

        const firstData =
          firstNDVI.status === 'fulfilled'
            ? annualNDVI(firstNDVI.value)
            : null

        const lastData =
          lastNDVI.status === 'fulfilled' && lastNDVI.value
            ? annualNDVI(lastNDVI.value)
            : null

        const firstClimate = climateData
          ? annualClimate(climateData, startYear)
          : null

        const lastClimate = climateData
          ? annualClimate(climateData, endYear)
          : null

        setResult({
          firstData,
          lastData,
          firstClimate,
          lastClimate,
          climateAvailable: Boolean(climateData),
          ndviComparison: comparableNDVI(firstData, lastData),
          firstNDVIError: firstNDVI.status === 'rejected' ? String(firstNDVI.reason?.message || firstNDVI.reason) : null,
          lastNDVIError: lastNDVI.status === 'rejected' ? String(lastNDVI.reason?.message || lastNDVI.reason) : null
        })
      } catch (err) {
        if (!signal.aborted) setError(err.message)
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [selection.lat, selection.lng, startYear, endYear])

  const vegetationChange =
    result?.ndviComparison && startYear !== endYear
      ? result.ndviComparison.last - result.ndviComparison.first
      : null

  const temperatureChange =
    result?.firstClimate?.temperature != null &&
    result?.lastClimate?.temperature != null &&
    startYear !== endYear
      ? result.lastClimate.temperature - result.firstClimate.temperature
      : null

  const rainfallChange =
    result?.firstClimate?.rainfall != null &&
    result?.lastClimate?.rainfall != null &&
    startYear !== endYear
      ? result.lastClimate.rainfall - result.firstClimate.rainfall
      : null

  return (
    <section className="kizuki-intelligence">
      <div className="kizuki-intelligence-header">
        <div>
          <div className="kizuki-eyebrow">
            KIZUKI / ENVIRONMENTAL INTELLIGENCE
          </div>
          <h2>Understand what is changing.</h2>
          <p>
            Evidence-based environmental observations for {selection.name},
            {' '}{startYear}–{endYear}.
          </p>
        </div>
        <span className="kizuki-source-badge">
          NASA OBSERVATIONS
        </span>
      </div>

      {loading && (
        <p className="kizuki-loading">
          Retrieving environmental observations…
        </p>
      )}

      {error && (
        <p className="kizuki-loading">
          Environmental analysis unavailable: {error}
        </p>
      )}

      {!loading && result && (
        <div className="kizuki-insight-grid">
          <Insight icon={Leaf} title="Vegetation dynamics">
            {vegetationChange !== null
              ? `Quality-filtered MODIS NDVI: ${startYear} = ${result.ndviComparison.first.toFixed(4)} (${result.ndviComparison.countA} observations); ${endYear} = ${result.ndviComparison.last.toFixed(4)} (${result.ndviComparison.countB} observations). Change = ${vegetationChange >= 0 ? '+' : ''}${vegetationChange.toFixed(4)} across ${result.ndviComparison.months} matching calendar months. This compares one approximately 250 m pixel, not forest-cover percentage or a proven long-term trend.`
              : ndviMessage(result, startYear, endYear)}
          </Insight>

          <Insight icon={Thermometer} title="Temperature">
            {temperatureChange !== null
              ? `Annual mean air temperature changed by ${
                  temperatureChange >= 0 ? '+' : ''
                }${temperatureChange.toFixed(2)} °C between ${startYear} and ${endYear}. This is a comparison of two years, not proof of a long-term trend.`
              : 'Complete annual temperature records could not be verified for both selected years.'}
          </Insight>

          <Insight icon={CloudRain} title="Precipitation">
            {rainfallChange !== null
              ? `Annual precipitation changed by ${
                  rainfallChange >= 0 ? '+' : ''
                }${rainfallChange.toFixed(1)} mm between ${startYear} and ${endYear}.`
              : 'Complete comparable annual rainfall records are not available in the expected format.'}
          </Insight>

          <Insight icon={ShieldCheck} title="Scientific interpretation">
            Vegetation changes may influence local surface conditions,
            but these observations alone cannot establish causation.
            NDVI is a point-pixel measurement, while NASA POWER
            climate estimates use a much coarser spatial grid.
          </Insight>
        </div>
      )}

      <div className="kizuki-method">
        SOURCES: NASA MODIS MOD13Q1 · NASA POWER
        <span>
          Calculated observations · Not AI-generated measurements
        </span>
      </div>
    </section>
  )
}
