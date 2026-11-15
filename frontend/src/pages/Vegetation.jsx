import GlobalSatelliteExplorer from '../components/GlobalSatelliteExplorer'

export default function Vegetation() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          KIZUKI / EARTH OBSERVATION
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Global Vegetation Intelligence
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Explore worldwide satellite observations and
          discover imagery for vegetation analysis.
        </p>
      </div>

      <GlobalSatelliteExplorer />

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
        <h2 className="text-base font-semibold text-white">
          Upcoming: Satellite NDVI analysis
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          The next upgrade will process satellite red and
          near-infrared bands to calculate NDVI and compare
          vegetation greenness between observation periods.
          No unprocessed imagery is presented as a measured
          vegetation change.
        </p>
      </div>
    </div>
  )
}
