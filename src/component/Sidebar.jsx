import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiMap, FiDatabase, FiSettings, FiX, FiBell, FiImage } from 'react-icons/fi';
import { TbReportAnalytics } from "react-icons/tb";
function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-280px',
          width: '280px',
          height: '100vh',
          backgroundColor: '#1a1a1a',
          color: '#fff',
          transition: 'left 0.3s ease',
          zIndex: 1000,
          boxShadow: isOpen ? '2px 0 10px rgba(0,0,0,0.3)' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #333',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>เมนู</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="ปิดเมนู"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          <Link
            to="/"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px 20px',
              color: '#fff',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d2d')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FiHome size={20} />
            <span style={{ fontSize: '16px' }}>หน้าหลัก</span>
          </Link>

          <Link
            to="/reports"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px 20px',
              color: '#fff',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d2d')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <TbReportAnalytics size={20} />
            <span style={{ fontSize: '16px' }}>สรุปข้อมูล</span>
          </Link>

          <Link
            to="/drone"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px 20px',
              color: '#fff',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d2d')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FiDatabase size={20} />
            <span style={{ fontSize: '16px' }}>ข้อมูลโดรน</span>
          </Link>

          {/* <Link
            to="/map"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px 20px',
              color: '#fff',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d2d')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FiMap size={20} />
            <span style={{ fontSize: '16px' }}>แผนที่เพิ่มเติม</span>
          </Link> */}

          <Link
            to="/alerts"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px 20px',
              color: '#fff',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d2d')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FiBell size={20} />
            <span style={{ fontSize: '16px' }}>ประวัติการแจ้งเตือน</span>
          </Link>

          <div
            style={{
              height: '1px',
              backgroundColor: '#333',
              margin: '20px 20px',
            }}
          />
{/* 
          <Link
            to="/settings"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px 20px',
              color: '#fff',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2d2d2d')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <FiSettings size={20} />
            <span style={{ fontSize: '16px' }}>ตั้งค่า</span>
          </Link> */}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: '15px 20px',
            borderTop: '1px solid #333',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
          }}
        >
          RealTeSa2025 v1.0
        </div>
      </div>
    </>
  );
}

export default Sidebar;
