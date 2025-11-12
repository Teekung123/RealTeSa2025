// App.jsx

import Map from './component/Map'
import './App.css'
import { FiAlignJustify } from "react-icons/fi";
import React, { useState, useRef, useMemo } from 'react'
import Reports from './component/Reports.jsx'
import Header from './component/Header.jsx'
import Sidebar from './component/Sidebar.jsx'
import AlertsBox from './component/AlertsBox.jsx';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";


// ✅ ตัวอย่างข้อมูลแบบเดียวกับ Reports.jsx
const sample = {
  drones: [
    { id: "D-01", side: "us", active: true,  lat: 13.75, lng: 100.54, lastSeen: "2025-11-11T09:05:00Z" },
    { id: "D-02", side: "us", active: false, lat: 13.76, lng: 100.55, lastSeen: "2025-11-11T08:10:00Z" },
    { id: "D-03", side: "enemy", active: true, lat: 16.44, lng: 102.84, lastSeen: "2025-11-11T07:30:00Z" },
    { id: "D-04", side: "us", active: true,  lat: 13.77, lng: 100.56, lastSeen: "2025-11-10T12:20:00Z" },
    { id: "D-05", side: "enemy", active: false, lat: 16.45, lng: 102.85, lastSeen: "2025-11-10T11:15:00Z" },
    { id: "D-06", side: "us", active: false, lat: 13.78, lng: 100.57, lastSeen: "2025-11-09T14:50:00Z" },
    { id: "D-07", side: "enemy", active: true, lat: 16.46, lng: 102.86, lastSeen: "2025-11-09T13:40:00Z" },
    { id: "D-08", side: "us", active: true,  lat: 13.79, lng: 100.58, lastSeen: "2025-11-08T16:25:00Z" },
  ],
  missions: [
    { date: "2025-11-08", side: "us", flights: 6 },
    { date: "2025-11-09", side: "us", flights: 4 },
    { date: "2025-11-10", side: "us", flights: 7 },
    { date: "2025-11-11", side: "us", flights: 5 },
  ],
  detections: [
    { date: "2025-11-08", count: 2 },
    { date: "2025-11-09", count: 1 },
    { date: "2025-11-10", count: 4 },
    { date: "2025-11-11", count: 3 },
  ],
};



function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef(null);

  // ฟังก์ชันสำหรับให้แมพไปตำแหน่งที่คลิก
  const handleAlertClick = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo(lat, lng, 15);
      console.log(`🗺️ กำลังไปยังพิกัด: ${lat}, ${lng}`);
    }
  };

  const [missionStates] = useState([
    { id: 'ภารกิจ 122', status: 'Mission Started' },
    { id: 'ภารกิจ 121', status: 'Mission Completed' },
    { id: 'ภารกิจ 120', status: 'Path Deviation' },
  ]);

    const drones = sample.drones;
  const COLORS = ["#60a5fa", "#9ca3af"];

  const pieEnemy = useMemo(() => ([
    { name: "ทำงาน",   value: drones.filter(d => d.side === "enemy" && d.active).length },
    { name: "ไม่ทำงาน", value: drones.filter(d => d.side === "enemy" && !d.active).length },
  ]), [drones]);

  const pieUs = useMemo(() => ([
  { name: "ทำงาน",   value: drones.filter(d => d.side === "us" && d.active).length },
  { name: "ไม่ทำงาน", value: drones.filter(d => d.side === "us" && !d.active).length },
]), [drones]);




  return (
 <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#2d2d2d' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, padding: '10px', gap: '10px', overflow: 'hidden',background : ''}}>
        
        {/* Left Side - Alerts */}
        <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AlertsBox onAlertClick={handleAlertClick} mapRef={mapRef} />
        </div>

        {/* Center - Map */}
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Map ref={mapRef} />
        </div>
        
        {/* Right Side - Mission State & Graph */}
        <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Mission State Panel */}
          <div style={{ 
            background: '#2d2d2d', 
            borderRadius: '8px', 
            padding: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <div style={{ 
              color: '#fff', 
              fontSize: '14px', 
              marginBottom: '10px', 
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              Mission State
            </div>
            
            {missionStates.map((state, index) => (
              <div key={index} style={{
                background: '#fff',
                color: '#000',
                padding: '10px 8px',
                marginBottom: '8px',
                borderRadius: '4px',
                fontSize: '11px',
                minHeight: '55px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', textAlign: 'center' }}>
                  {state.id}
                </div>
                <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
                  {state.status}
                </div>
              </div>
            ))}
          </div>

         {/* Graph Panel (Pie Chart 2 วง บน-ล่าง) */}
      <div style={{
        flex: 1,
        background: '#2d2d2d',
        borderRadius: '8px',
        padding: '10px',
        color: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* ครึ่งบน: ฝ่ายเรา */}
        <div style={{
          flex: 1,
          background: '#1f1f1f',
          borderRadius: '6px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 4 ,background : '#2d2d2d'}}>
            สถานะฝูงโดรน (ฝ่ายเรา) 
          </div>
          <div style={{ width: '100%', height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieUs} dataKey="value" nameKey="name" outerRadius={28}>
                  {pieUs.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ครึ่งล่าง: ฝ่ายตรงข้าม */}
        <div style={{
          flex: 1,
          background: '#1f1f1f',
          borderRadius: '6px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 4 }}>
            สถานะฝูงโดรน (ฝ่ายตรงข้าม)
          </div>
          <div style={{ width: '100%', height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieEnemy} dataKey="value" nameKey="name" outerRadius={28}>
                  {pieEnemy.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
              </div>
            </div>
          </div>
        );
      }

      export default App;
