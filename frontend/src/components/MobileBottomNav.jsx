import { NavLink } from 'react-router-dom'
import {
  House,
  Globe2,
  Leaf,
  ChartNoAxesCombined,
  BrainCircuit
} from 'lucide-react'

const items = [
  { path: '/', label: 'Home', icon: House },
  { path: '/explorer', label: 'Explore', icon: Globe2 },
  { path: '/vegetation', label: 'NDVI', icon: Leaf },
  { path: '/forecast', label: 'Forecast', icon: ChartNoAxesCombined },
  { path: '/analyst', label: 'AI', icon: BrainCircuit }
]

export default function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile primary navigation"
      className="kizuki-bottom-nav lg:hidden"
    >
      {items.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `kizuki-bottom-link ${
              isActive ? 'kizuki-bottom-link-active' : ''
            }`
          }
        >
          <Icon size={19} strokeWidth={1.7} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}