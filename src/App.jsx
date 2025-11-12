import Map from './component/Map'
import './App.css'
import { FiAlignJustify } from "react-icons/fi";
import React from 'react'
import Reports from './component/Reports.jsx'
import Header from './component/Header.jsx'
import Sidebar from './component/Sidebar.jsx'
import AlertsBox from './component/AlertsBox.jsx';
import { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";



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

  return (
 <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#e5e5e5' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, padding: '10px', gap: '10px', overflow: 'hidden' }}>
        
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

          {/* Graph Panel */}
          <div style={{ 
            flex: 1,
            background: '#2d2d2d', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            minHeight: '300px'
          }}>
            กราฟ บลาๆ
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
