import { useLocation } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { navItems } from './navItems'

export default function Header() {
  const { pathname } = useLocation()
  const current =
    navItems.find(item => item.path === pathname) || navItems[0]

  return (
    <header className="kizuki-header sticky top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 bg-navy-950/95 px-4 backdrop-blur-md sm:h-16 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Leaf
          size={19}
          strokeWidth={1.7}
          className="shrink-0 text-emerald-glow lg:hidden"
        />

        <span className="text-sm font-semibold tracking-[0.16em] text-white lg:hidden">
          KIZUKI
        </span>

        <span className="hidden text-sm font-medium text-gray-300 lg:inline">
          {current.label}
        </span>
      </div>

      <div className="text-[10px] font-medium tracking-[0.14em] text-gray-400 sm:text-xs">
        GLOBAL CLIMATE INTELLIGENCE
      </div>
    </header>
  )
}