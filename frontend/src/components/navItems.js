import { LayoutDashboard, Map as MapIcon, Leaf, TrendingUp, Sparkles } from 'lucide-react'

export const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/explorer', label: 'Climate Explorer', icon: MapIcon },
  { path: '/vegetation', label: 'Vegetation Change', icon: Leaf },
  { path: '/forecast', label: 'Climate Projection Lab', icon: TrendingUp },
  { path: '/analyst', label: 'AI Analyst', icon: Sparkles },
]
