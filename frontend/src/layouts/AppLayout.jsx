import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-navy-950">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/3 h-[480px] w-[480px] rounded-full bg-emerald-glow/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[420px] w-[420px] rounded-full bg-teal-glow/20 blur-[120px]" />
        <div className="absolute -bottom-40 left-0 h-[380px] w-[380px] rounded-full bg-blue-600/15 blur-[120px]" />
      </div>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="relative lg:pl-64">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}