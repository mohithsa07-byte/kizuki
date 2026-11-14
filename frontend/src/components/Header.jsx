import { useLocation } from 'react-router-dom'
import { Menu, MapPin } from 'lucide-react'
import { navItems } from './navItems'

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const current = navItems.find((item) => item.path === pathname) || navItems[0]

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-navy-950/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-gray-300 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm font-medium text-gray-300">{current.label}</span>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-navy-900 px-3 py-1.5 text-xs text-gray-300">
        <MapPin size={14} className="text-teal-glow" />
        Bengaluru, Karnataka
      </div>
    </header>
  )
}
