import { Database } from 'lucide-react'

export default function RealBadge({ label = 'NASA POWER' }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
      <Database size={12} />
      {label}
    </span>
  )
}
