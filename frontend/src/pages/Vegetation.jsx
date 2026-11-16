import { useState } from 'react'
import { Satellite, Layers3, ScanEye, Leaf } from 'lucide-react'
import GlobalNDVI from '../components/GlobalNDVI'
import GlobalSatelliteExplorer from '../components/GlobalSatelliteExplorer'
import EarthTimeMachine from '../components/EarthTimeMachine'

export default function Vegetation() {
  const [location, setLocation] = useState({
    lat: 12.9716,
    lng: 77.5946
  })

  return (
    <div className="min-h-screen space-y-6 bg-[#07111c] px-4 py-6 pb-12 text-slate-100 sm:px-7">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#10343b] via-[#0b2230] to-[#081521] p-7 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-[90px]" />
        <p className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300"><Satellite size={17} />
          KIZUKI / EARTH OBSERVATION
        </p>

        <h1 className="relative mt-4 font-display text-3xl font-semibold text-white sm:text-5xl">
          Global Vegetation Intelligence
        </h1>

        <p className="relative mt-4 max-w-2xl text-sm leading-7 text-slate-400">
          Explore satellite imagery and track vegetation
          changes across observation years.
        </p>
        <div className="relative mt-6 flex flex-wrap gap-2">
          {[['Satellite imagery', Satellite], ['Temporal comparison', ScanEye], ['NDVI analysis', Leaf]].map(([label, Icon]) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2 text-xs text-emerald-100"><Icon size={14} />{label}</span>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">01 / OBSERVE</p><h2 className="mt-2 text-xl font-semibold text-white">Satellite observation workspace</h2><p className="mt-2 text-xs text-slate-400">Select a location to synchronize the analyses below.</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300"><Layers3 size={14} /> Global coverage</span>
      </div>
      <GlobalSatelliteExplorer onLocationChange={setLocation} />

      <div className="border-t border-white/10 pt-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">02 / COMPARE</p><h2 className="mb-5 mt-2 text-xl font-semibold text-white">Earth through time</h2><EarthTimeMachine location={location} /></div>

      <div className="border-t border-white/10 pt-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">03 / QUANTIFY</p><h2 className="mb-5 mt-2 text-xl font-semibold text-white">Vegetation index intelligence</h2><GlobalNDVI location={location} /></div>
      <p className="border-t border-white/10 pt-5 text-xs leading-6 text-slate-500">Imagery availability and NDVI coverage vary by source and location. Missing observations are not evidence of vegetation loss.</p>
    </div>
  )
}