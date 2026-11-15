import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import MobileBottomNav from '../components/MobileBottomNav'

export default function AppLayout() {
  const { pathname } = useLocation()
  const workspace = pathname === '/'

  return (
    <div className="kizuki-app-shell relative min-h-screen bg-navy-950">
      <Sidebar />

      <div className="relative flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Header />

        {workspace ? (
          <main className="kizuki-mobile-main relative min-w-0 flex-1">
            <Outlet />
          </main>
        ) : (
          <main className="kizuki-mobile-main mx-auto w-full min-w-0 max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <Outlet />
          </main>
        )}
      </div>

      <MobileBottomNav />
    </div>
  )
}