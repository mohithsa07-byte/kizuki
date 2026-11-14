import { FlaskConical } from 'lucide-react'

export default function SampleBadge({ label = 'Sample data' }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
      <FlaskConical size={12} />
      {label}
    </span>
  )
}
