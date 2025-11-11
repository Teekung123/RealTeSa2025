import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import MyDrone from './component/MyDrone.jsx'

// [Note]: ลบ 'import { Browser } from 'leaflet'' ที่ไม่เกี่ยวข้องออก

createRoot(document.getElementById('root')).render(
  // [Note]: เพิ่ม <StrictMode> กลับเข้าไป (เป็น best practice)
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/drone" element={<MyDrone />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)