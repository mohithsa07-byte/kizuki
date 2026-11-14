import { NavLink } from 'react-router-dom'
import { Leaf, X } from 'lucide-react'
import { navItems } from './navItems'

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-navy-950 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Leaf className="text-emerald-glow" size={24} />
            <span className="text-lg font-semibold tracking-[0.25em] text-white">KIZUKI</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-glow/10 text-emerald-glow'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4">
          <p className="text-xs font-medium text-amber-300">Prototype</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Pages currently show clearly labelled sample data. Real data is connected in later milestones.
          </p>
        </div>
      </aside>
    </>
  )
}
