import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

function AlertsHistory() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 20;

  // ดึงข้อมูลเมื่อเปลี่ยนหน้า
  useEffect(() => {
    fetchAlerts();
  }, [page]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/get/alerts?page=${page}&limit=${itemsPerPage}`);
      if (response.data.success) {
        setAlerts(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('❌ ดึงข้อมูล alerts ไม่สำเร็จ:', error);
    } finally {
      setLoading(false);
    }
  };

  // แปลง timestamp เป็นวันที่
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // สีตาม type
  const getTypeStyle = (type) => {
    switch (type) {
      case 'danger':
        return { background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' };
      case 'warning':
        return { background: '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' };
      case 'success':
        return { background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' };
      default:
        return { background: '#6b7280', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a1a' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          background: '#2d2d2d',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #444',
            paddingBottom: '15px'
          }}>
            <h1 style={{ color: '#fff', fontSize: '24px', margin: 0 }}>
              📋 ประวัติการแจ้งเตือน (Alerts History)
            </h1>
            <div style={{ color: '#aaa', fontSize: '14px' }}>
              ทั้งหมด: <span style={{ color: '#fff', fontWeight: 'bold' }}>{total}</span> รายการ
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              กำลังโหลดข้อมูล...
            </div>
          )}

          {/* Table */}
          {!loading && alerts.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ background: '#1a1a1a', color: '#fff' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #444' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #444' }}>Device ID</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #444' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #444' }}>Latitude</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #444' }}>Longitude</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #444' }}>Altitude</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #444' }}>Points</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #444' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, index) => (
                    <tr 
                      key={alert._id}
                      style={{ 
                        background: index % 2 === 0 ? '#2d2d2d' : '#252525',
                        borderBottom: '1px solid #333'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a3a'}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#2d2d2d' : '#252525'}
                    >
                      <td style={{ padding: '12px', color: '#aaa' }}>
                        {(page - 1) * itemsPerPage + index + 1}
                      </td>
                      <td style={{ padding: '12px', color: '#fff', fontWeight: '500' }}>
                        {alert.deviceId}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={getTypeStyle(alert.type)}>
                          {alert.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#ddd', textAlign: 'right', fontFamily: 'monospace' }}>
                        {alert.latitude?.toFixed(6)}
                      </td>
                      <td style={{ padding: '12px', color: '#ddd', textAlign: 'right', fontFamily: 'monospace' }}>
                        {alert.longitude?.toFixed(6)}
                      </td>
                      <td style={{ padding: '12px', color: '#ddd', textAlign: 'right' }}>
                        {alert.altitude} m
                      </td>
                      <td style={{ padding: '12px', color: '#aaa', textAlign: 'center' }}>
                        {alert.pointCount || 1}
                      </td>
                      <td style={{ padding: '12px', color: '#aaa', fontSize: '13px' }}>
                        {formatDate(alert.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Data */}
          {!loading && alerts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
              ไม่มีข้อมูลการแจ้งเตือน
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '2px solid #444'
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  background: page === 1 ? '#444' : '#0ea5e9',
                  color: page === 1 ? '#666' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ← ก่อนหน้า
              </button>

              <span style={{ color: '#fff', fontSize: '14px' }}>
                หน้า {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  background: page === totalPages ? '#444' : '#0ea5e9',
                  color: page === totalPages ? '#666' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ถัดไป →
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={fetchAlerts}
              style={{
                padding: '10px 24px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertsHistory;
