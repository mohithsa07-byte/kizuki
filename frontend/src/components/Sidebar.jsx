import { NavLink } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { navItems } from './navItems'

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-navy-950 lg:flex">
      <div className="flex h-16 items-center gap-3 px-6">
        <Leaf size={22} strokeWidth={1.7} className="text-emerald-glow" />
        <span className="text-lg font-semibold tracking-[0.22em] text-white">
          KIZUKI
        </span>
      </div>

      <div className="px-6 pb-3 pt-5 text-[10px] font-medium tracking-[0.18em] text-gray-500">
        OBSERVATORY
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-glow/10 text-emerald-glow'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.7} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-5">
        <p className="text-[10px] font-medium tracking-[0.15em] text-gray-400">
          DATA SOURCES
        </p>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          NASA POWER · Sentinel-2 · Open-Meteo
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          Data coverage and spatial resolution vary by dataset.
        </p>
      </div>
    </aside>
  )
}