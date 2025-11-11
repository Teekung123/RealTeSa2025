import { useState } from 'react';
import Map from './Map';
import Header from './Header';

function TestMain() {
  const [alerts] = useState([
    { text: 'โครงข่ายเหนือเกิดจังทั้งควร', status: 'danger' },
    { text: '', status: 'normal' },
    { text: '', status: 'normal' },
    { text: 'ภาพสอาจากกล้อง', status: 'warning' },
    { text: 'ภาพสอาจากกล้อง', status: 'warning' },
    { text: 'ภาพสอาจากกล้อง', status: 'warning' },
    { text: 'ภาพสอาจากกล้อง', status: 'warning' },
  ]);

  const [missions] = useState([
    { id: 'ภารกิจ 123', status: '' },
    { id: '', status: '' },
    { id: '', status: '' },
  ]);

  const [missionStates] = useState([
    { id: 'ภารกิจ 122', status: 'Mission Started' },
    { id: 'ภารกิจ 121', status: 'Mission Started' },
    { id: 'ภารกิจ 120', status: 'Path Deviation' },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a1a' }}>
      <Header />
      
      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Protection Section - Left Side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '2px solid #000' }}>
          {/* Protection Header */}
          <div style={{ 
            background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)', 
            color: 'white', 
            padding: '12px', 
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            borderBottom: '2px solid #000'
          }}>
            Protection
          </div>
          
          <div style={{ display: 'flex', flex: 1 }}>
            {/* Protection Map */}
            <div style={{ flex: 1, position: 'relative', background: '#f0f0f0' }}>
              <Map />
            </div>
            
            {/* Alerts Panel */}
            <div style={{ width: '140px', background: '#2d2d2d', padding: '10px', overflowY: 'auto' }}>
              <div style={{ color: '#fff', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
                Alerts
              </div>
              {alerts.map((alert, index) => (
                <div key={index} style={{
                  background: alert.status === 'danger' ? '#ef4444' : 
                             alert.status === 'warning' ? '#94a3b8' : '#4a4a4a',
                  color: alert.text ? '#fff' : 'transparent',
                  padding: '12px 8px',
                  marginBottom: '8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  minHeight: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  {alert.text || '...'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Offence Section - Right Side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Offence Header */}
          <div style={{ 
            background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)', 
            color: 'white', 
            padding: '12px', 
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            borderBottom: '2px solid #000'
          }}>
            Offence
          </div>
          
          <div style={{ display: 'flex', flex: 1 }}>
            {/* Offence Map */}
            <div style={{ flex: 1, position: 'relative', background: '#f0f0f0' }}>
              <Map />
            </div>
            
            {/* Mission Panel */}
            <div style={{ width: '140px', background: '#2d2d2d', padding: '10px', overflowY: 'auto' }}>
              {/* Mission Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#fff', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
                  Mission
                </div>
                {missions.map((mission, index) => (
                  <div key={index} style={{
                    background: '#fff',
                    color: '#000',
                    padding: '12px 8px',
                    marginBottom: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    minHeight: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {mission.id || ''}
                  </div>
                ))}
              </div>

              {/* Mission State Section */}
              <div>
                <div style={{ color: '#fff', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
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
                    minHeight: '60px'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{state.id}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>{state.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestMain;
