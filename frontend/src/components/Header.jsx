import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Leaf, Moon, Sun } from 'lucide-react'
import { navItems } from './navItems'

export default function Header() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('kizuki-theme') === 'light' ? 'light' : 'dark' }
    catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-kizuki-theme', theme)
    document.documentElement.style.colorScheme = theme
    try { localStorage.setItem('kizuki-theme', theme) } catch { /* storage unavailable */ }
  }, [theme])
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

      <div className="flex items-center gap-3">
        <span className="hidden text-[10px] font-medium tracking-[0.14em] text-gray-400 sm:inline sm:text-xs">
          GLOBAL CLIMATE INTELLIGENCE
        </span>
        <button
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          aria-pressed={theme === 'light'}
          onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}
          className="kizuki-theme-toggle"
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  )
}