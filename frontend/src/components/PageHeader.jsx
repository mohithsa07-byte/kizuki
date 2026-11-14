import SampleBadge from './SampleBadge'

export default function PageHeader({ title, description, sample = true }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {sample && <SampleBadge />}
      </div>
      {description && <p className="mt-1 max-w-3xl text-sm text-gray-400">{description}</p>}
    </div>
  )
}
