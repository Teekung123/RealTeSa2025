import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

/**
 * Component สำหรับแสดง Alerts boxes ที่ได้รับจาก Socket.IO
 * @param {Function} onAlertClick - Callback เมื่อคลิก alert (รับ latitude, longitude)
 * @param {Object} mapRef - Reference ของ Map component สำหรับเพิ่ม/ลบ markers
 */
function AlertsBox({ onAlertClick, mapRef }) {
  const [alerts, setAlerts] = useState([]);
  
  // เชื่อมต่อ Socket.IO และอัพเดท alerts
  useEffect(() => {
    const socket = io('http://localhost:4001');

    socket.on('connect', () => {
      console.log('✅ เชื่อมต่อ Socket.IO สำเร็จ (AlertsBox)');
    });

    socket.on('disconnect', () => {
      console.log('❌ ตัดการเชื่อมต่อ Socket.IO (AlertsBox)');
    });

    // รับข้อมูลใหม่
    socket.on('newData', (data) => {
      console.log('📥 ได้รับข้อมูลใหม่:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        const time = new Date().toLocaleTimeString('th-TH');
        
        // สร้าง alerts จากทุก object ใน array
        const newAlerts = data.map(item => {
          const deviceId = item.deviceId || 'unknown';
          const status = item.type || 'success';
          const cameraId = item.cameraId || 'N/A';
          const imageUrl = item.imageUrl || null; // เพิ่ม imageUrl
          
          // ดึงพิกัดตัวแรก (หรือตัวเดียว)
          let lat, lng, alt;
          if (Array.isArray(item.latitude)) {
            lat = item.latitude[0];
            lng = item.longitude[0];
            alt = item.altitude[0];
          } else {
            lat = item.latitude;
            lng = item.longitude;
            alt = item.altitude;
          }
          
          // นับจำนวนจุดข้อมูล
          let pointCount = 1;
          if (Array.isArray(item.latitude)) {
            pointCount = item.latitude.length;
          }
          
          // บันทึกลง MongoDB
          axios.post('http://localhost:3000/api/alerts', {
            deviceId,
            latitude: lat,
            longitude: lng,
            altitude: alt || 0,
            type: status,
            pointCount
          }).catch(err => console.error('❌ บันทึก alert ไม่สำเร็จ:', err));
          
          return {
            deviceId,
            text: `${deviceId}\n${pointCount} จุด\n[${time}]`,
            status: status,
            latitude: lat,
            longitude: lng,
            altitude: alt,
            cameraId: cameraId,
            imageUrl: imageUrl, // เพิ่ม imageUrl
            confidence: item.confidence || null,
            targetId: item.targetId || item.detectedDevice || null,
            timestamp: Date.now()
          };
        });
        
        // เพิ่ม/อัพเดท alerts
        setAlerts(prev => {
          // รวม alerts เก่ากับใหม่ โดยลบ duplicate deviceId
          const combined = [...newAlerts];
          
          prev.forEach(oldAlert => {
            const exists = newAlerts.find(a => a.deviceId === oldAlert.deviceId);
            if (!exists) {
              combined.push(oldAlert);
            }
          });
          
          // กรองเฉพาะที่ไม่ใช่ success
          const filtered = combined.filter(a => a.status !== 'success');
          
          // เรียงตามเวลาล่าสุด
          return filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
        });
        
        // เพิ่ม markers บนแมพ
        if (mapRef && mapRef.current) {
          newAlerts.forEach(alert => {
            if (alert.status === 'success') {
              // ถ้าเป็น success ให้ลบ marker
              mapRef.current.removeMarker(alert.deviceId);
            } else {
              // ถ้าไม่ใช่ success ให้แสดง marker พร้อมรูปภาพ
              mapRef.current.addPersistentMarker(
                alert.deviceId,
                alert.latitude,
                alert.longitude,
                alert.status,
                alert.altitude || 0,
                alert.cameraId || 'N/A',
                alert.imageUrl || null,
                {
                  confidence: alert.confidence,
                  targetId: alert.targetId
                }
              );
            }
          });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <div style={{ 
        background: '#2d2d2d', 
        color: '#fff', 
        padding: '8px', 
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        Alerts
      </div>
      
      {alerts.map((alert, index) => {
        // กำหนดสีตาม status
        let bgColor = '#10b981'; // success - เขียว
        let borderColor = '#059669';
        let textColor = '#fff';
        
        if (alert.status === 'warning') {
          bgColor = '#f59e0b'; // warning - ส้ม
          borderColor = '#d97706';
          textColor = '#fff';
        } else if (alert.status === 'danger') {
          bgColor = '#ef4444'; // danger - แดง
          borderColor = '#dc2626';
          textColor = '#fff';
        }
        
        return (
          <div 
            key={index} 
            onClick={() => {
              if (onAlertClick && alert.latitude && alert.longitude) {
                onAlertClick(alert.latitude, alert.longitude);
              }
            }}
            style={{
            background: bgColor,
            color: textColor,
            padding: '15px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: `2px solid ${borderColor}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            whiteSpace: 'pre-line'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {alert.deviceId}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>
              📍 {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}
            </div>
            <div style={{ fontSize: '9px', marginTop: '4px' }}>
              คลิกเพื่อดูแมพ
            </div>
          </div>
        );
      })}
    </>
  );
}

export default AlertsBox;
