import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const workspace = pathname === '/'

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-navy-950">
      {!workspace && (
        <div className="pointer-events-none fixed inset-0" aria-hidden="true">
          <div className="absolute -top-40 left-1/3 h-[480px] w-[480px] rounded-full bg-emerald-glow/20 blur-[120px]" />
          <div className="absolute top-1/2 -right-40 h-[420px] w-[420px] rounded-full bg-teal-glow/20 blur-[120px]" />
        </div>
      )}
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="relative flex min-h-screen flex-col lg:pl-64">
        <Header onMenuClick={() => setMenuOpen(true)} />
        {workspace ? (
          <main className="relative min-h-[640px] flex-1">
            <Outlet />
          </main>
        ) : (
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  )
}