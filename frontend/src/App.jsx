import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Overview from './pages/Overview'
import ClimateExplorer from './pages/ClimateExplorer'
import Vegetation from './pages/Vegetation'
import Forecast from './pages/Forecast'
import Analyst from './pages/Analyst'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/explorer" element={<ClimateExplorer />} />
          <Route path="/vegetation" element={<Vegetation />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/analyst" element={<Analyst />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
