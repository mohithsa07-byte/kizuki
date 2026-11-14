export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-white/5 bg-navy-900/80 p-5 shadow-lg shadow-black/20 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
