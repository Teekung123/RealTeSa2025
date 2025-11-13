import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MyDrone from './component/MyDrone.jsx'
import Test from './component/testmain.jsx'
import Reports from './component/Reports.jsx'
import MapPage from './component/MapPage.jsx'
import AlertsHistory from './component/AlertsHistory.jsx'
import ImageViewer from './component/ImageViewer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/drone" element={<MyDrone />} />
        <Route path="/test" element={<Test />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/alerts" element={<AlertsHistory />} />
        <Route path="/images" element={<ImageViewer />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
)