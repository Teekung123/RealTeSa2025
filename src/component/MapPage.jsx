import React, { useState, useRef } from 'react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Map from './Map.jsx';
import AlertsBox from './AlertsBox.jsx';

function MapPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef(null);

  // ฟังก์ชันสำหรับให้แมพไปตำแหน่งที่คลิก
  const handleAlertClick = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo(lat, lng, 15);
      console.log(`🗺️ กำลังไปยังพิกัด: ${lat}, ${lng}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a1a' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, padding: '10px', gap: '10px', overflow: 'hidden' }}>
        
        {/* Left Side - Alerts */}
        <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AlertsBox onAlertClick={handleAlertClick} mapRef={mapRef} />
        </div>

        {/* Center - Full Map */}
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          background: '#0b2e13',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <Map ref={mapRef} />
        </div>
      </div>
    </div>
  );
}

export default MapPage;
