import Card from './Card'

export default function StatCard({ label, value, unit, note, source }) {
  const unavailable = value === 'N/A'
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-3xl font-semibold ${unavailable ? 'text-gray-500' : 'text-white'}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-emerald-glow">{unit}</span>}
      </p>
      <p className="mt-2 text-xs text-gray-400">{note}</p>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-amber-300/80">{source}</p>
    </Card>
  )
}
