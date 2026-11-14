import { Leaf, Satellite, CloudRain } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-navy-950 to-navy-800 px-6 text-center">
      <div className="flex items-center gap-3 mb-4">
        <Leaf className="text-emerald-glow" size={36} />
        <h1 className="text-5xl font-semibold tracking-[0.3em] text-white">
          KIZUKI
        </h1>
      </div>
      <p className="text-teal-glow text-lg">
        See the change. Understand the cause. Predict the future.
      </p>
      <div className="mt-10 flex gap-6 text-gray-400">
        <span className="flex items-center gap-2"><Satellite size={18} /> Satellite</span>
        <span className="flex items-center gap-2"><CloudRain size={18} /> Climate</span>
      </div>
      <p className="mt-10 text-sm text-gray-500">Milestone 1 setup check</p>
    </div>
  )
}
