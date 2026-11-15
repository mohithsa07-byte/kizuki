import { useState } from 'react'
import GlobalNDVI from '../components/GlobalNDVI'
import GlobalSatelliteExplorer from '../components/GlobalSatelliteExplorer'
import EarthTimeMachine from '../components/EarthTimeMachine'

export default function Vegetation() {
  const [location, setLocation] = useState({
    lat: 12.9716,
    lng: 77.5946
  })

  return (
    <div className="space-y-8 pb-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          KIZUKI / EARTH OBSERVATION
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-white">
          Global Vegetation Intelligence
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Explore satellite imagery and track vegetation
          changes across observation years.
        </p>
      </div>

      <GlobalSatelliteExplorer onLocationChange={setLocation} />

      <EarthTimeMachine location={location} />

      <GlobalNDVI />
    </div>
  )
}