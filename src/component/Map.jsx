import { useEffect, useRef , useState, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-timedimension';
import 'leaflet-timedimension/dist/leaflet.timedimension.control.css';
import 'leaflet.heat';

const Map = forwardRef((props, ref) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({}); // เก็บ markers แยกตาม deviceId
  const alertPathsRef = useRef({}); // เก็บเส้นทาง alerts แยกตาม deviceId
  const alertPointsRef = useRef({}); // เก็บจุดของ alerts แต่ละตัว
  const realtimeMarkersRef = useRef({}); // เก็บ real-time markers สำหรับ drone/opponent
  const realtimePathsRef = useRef({}); // เก็บเส้นทาง real-time
  const timeControlRef = useRef(null); // เก็บ Timeline control
  const [loading, setLoading] = useState(true);

  // เปิดเผยฟังก์ชันให้ parent component เรียกใช้
  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 15) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], zoom, {
          duration: 1.5
        });
      }
    },
    
    // เพิ่ม marker ที่ยังไม่หาย
    addPersistentMarker: (deviceId, lat, lng, type, altitude = 0, cameraId = 'N/A') => {
      if (!mapInstanceRef.current) return;
      
      // ถ้ามี marker เก่าอยู่แล้ว ลบทิ้ง 
      if (markersRef.current[deviceId]) {
        mapInstanceRef.current.removeLayer(markersRef.current[deviceId]);
      }
      
      // กำหนดสีตาม type (สำหรับ Alerts - สีแดง)
      let color = '#ef4444'; // แดง (danger)
      let statusText = 'อันตราย';
      if (type === 'warning') {
        color = '#f59e0b'; // ส้ม
        statusText = 'เตือน';
      }
      if (type === 'success') {
        color = '#10b981'; // เขียว
        statusText = 'ปลอดภัย';
      }
      
      const detectedTime = new Date().toLocaleString('th-TH');
      
      // สร้าง marker ใหม่
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'persistent-marker',
          html: `<div style="
            background: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
            animation: pulse 2s infinite;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: -25px;
              left: 50%;
              transform: translateX(-50%);
              background: ${color};
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${deviceId}</div>
          </div>`,
          iconSize: [24, 24]
        })
      }).addTo(mapInstanceRef.current);
      
      // เพิ่ม Popup รายละเอียด
      marker.bindPopup(`
        <div style="font-size: 12px; line-height: 1.6;">
          <b style="font-size: 14px; color: ${color};">🚨 ${deviceId}</b><br>
          <b>แจ้งเตือน</b><br>
          <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
          <b>📍 จุดตรวจจับ</b><br>
          ⏰ เวลา: ${detectedTime}<br>
          📊 สถานะ: <span style="color: ${color}; font-weight: bold;">${statusText}</span><br>
          📌 พิกัด: [${lat.toFixed(5)}, ${lng.toFixed(5)}]<br>
          ✈️ ระดับความสูง: ${altitude} m<br>
          📷 ตรวจจับโดย: ${cameraId}
        </div>
      `);
      
      // เก็บ marker ไว้
      markersRef.current[deviceId] = marker;
      
      // เก็บจุดสำหรับวาดเส้นทาง (Alerts - สีแดง)
      if (!alertPointsRef.current[deviceId]) {
        alertPointsRef.current[deviceId] = [];
      }
      alertPointsRef.current[deviceId].push({ lat, lng, timestamp: Date.now() });
      
      // วาดหรืออัพเดทเส้นทาง
      if (alertPathsRef.current[deviceId]) {
        mapInstanceRef.current.removeLayer(alertPathsRef.current[deviceId]);
      }
      
      const coords = alertPointsRef.current[deviceId].map(p => [p.lat, p.lng]);
      if (coords.length > 1) {
        const polyline = L.polyline(coords, {
          color: color, // ใช้สีตาม type
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 10'
        }).addTo(mapInstanceRef.current);
        
        alertPathsRef.current[deviceId] = polyline;
      }
    },
    
    // ลบ marker เมื่อเป็น success
    removeMarker: (deviceId) => {
      if (markersRef.current[deviceId]) {
        mapInstanceRef.current.removeLayer(markersRef.current[deviceId]);
        delete markersRef.current[deviceId];
        console.log(`🗑️ ลบ marker ${deviceId} (เปลี่ยนเป็น success)`);
      }
      
      // ลบเส้นทางด้วย
      if (alertPathsRef.current[deviceId]) {
        mapInstanceRef.current.removeLayer(alertPathsRef.current[deviceId]);
        delete alertPathsRef.current[deviceId];
      }
      
      // ลบข้อมูลจุด
      if (alertPointsRef.current[deviceId]) {
        delete alertPointsRef.current[deviceId];
      }
    }
  }));

  useEffect(() => {
    // ป้องกันการสร้าง map ซ้ำ
    if (mapInstanceRef.current) return;

    // รอให้ container พร้อม
    if (!mapRef.current) return;

    // 1) สร้างแผนที่ด้วย OSM tiles
    const map = L.map(mapRef.current, {
      center: [13.7563, 100.5018],
      zoom: 12,
      zoomControl: true
    });

    mapInstanceRef.current = map;

    // สร้าง Base Layers หลายแบบให้เลือก
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    });

    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap',
      maxZoom: 17
    });

    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    });

    // เริ่มต้นด้วย Satellite
    satelliteLayer.addTo(map);

    // Init TimeDimension
    const timeDimension = new L.TimeDimension({
      period: "PT10S"
    });
    map.timeDimension = timeDimension;

    // ดึงข้อมูลจาก MongoDB
    const loadMapData = async () => {
      try {
        console.log('🔄 กำลังโหลดข้อมูล...');
        
        // ดึงข้อมูลโดรนฝั่งเรา (สีเขียว)
        const myDroneResponse = await axios.get('http://localhost:3000/api/MyDrone');
        const myDroneData = myDroneResponse.data.data || [];
        
        // ดึงข้อมูลฝั่งตรงข้าม (สีแดง)
        const opponentResponse = await axios.get('http://localhost:3000/api/targets');
        const opponentData = opponentResponse.data.data || [];
        
        // ดึงข้อมูลกล้อง (สีน้ำเงิน)
        const cameraResponse = await axios.get('http://localhost:3000/api/cameras');
        const cameraData = cameraResponse.data.data || [];
        
        console.log('🟢 My Drone Data:', myDroneData.length, 'records');
        console.log('🔴 Opponent Data:', opponentData.length, 'records');
        console.log('📷 Camera Data:', cameraData.length, 'records');
        console.log('📷 Camera Raw Data:', JSON.stringify(cameraData, null, 2));
        
        // แปลงข้อมูลเป็น GeoJSON
        const myDroneFeatures = convertToGeoJSON(myDroneData, 'drone', '#10b981');
        const opponentFeatures = convertToGeoJSON(opponentData, 'opponent', '#ef4444');
        
        console.log('✅ My Drone Features:', myDroneFeatures.length);
        console.log('✅ Opponent Features:', opponentFeatures.length);
        
        // ตรวจสอบว่า map instance พร้อมหรือไม่
        if (!mapInstanceRef.current) {
          console.error('❌ Map instance is not ready yet!');
          return;
        }
        
        // วาดข้อมูลโดรนฝั่งเรา (สีเขียว)
        drawDronePaths(mapInstanceRef.current, myDroneFeatures, '#10b981', '🚁 Our Drone');
        
        // วาดข้อมูลฝั่งตรงข้าม (สีแดง)
        drawDronePaths(mapInstanceRef.current, opponentFeatures, '#ef4444', '🎯 Opponent');
        
        // วาดกล้อง (สีน้ำเงิน)
        drawCameras(mapInstanceRef.current, cameraData);
        
        // เพิ่ม Timeline Control (1 ตัว)
        const validMyDroneFeatures = myDroneFeatures.filter(f => {
          if (!f.properties.id || f.properties.id === 'undefined' || f.properties.id === 'unknown_device') {
            return false;
          }
          if (f.geometry.type === 'LineString') {
            return f.geometry.coordinates && f.geometry.coordinates.length >= 2;
          }
          return true;
        });
        
        const validOpponentFeatures = opponentFeatures.filter(f => {
          if (!f.properties.id || f.properties.id === 'undefined' || f.properties.id === 'unknown_device') {
            return false;
          }
          if (f.geometry.type === 'LineString') {
            return f.geometry.coordinates && f.geometry.coordinates.length >= 2;
          }
          return true;
        });
        
        const allFeatures = [...validMyDroneFeatures, ...validOpponentFeatures];
        
        if (allFeatures.length > 0) {
          const geojsonData = {
            type: "FeatureCollection",
            features: allFeatures
          };
          
          const geoJsonLayer = L.geoJson(geojsonData, {
            style: feature => ({ 
              color: feature.properties.color, 
              weight: 3,
              opacity: 0.6
            }),
            pointToLayer: (feature, latlng) => {
              // ใช้ circleMarker สำหรับจุดที่เคลื่อนไหว
              return L.circleMarker(latlng, {
                radius: 8,
                fillColor: feature.properties.color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
              });
            },
            onEachFeature: (feature, layer) => {
              layer.bindPopup(`<b>${feature.properties.id}</b><br>${feature.properties.type}`);
            }
          });
          
          const timedLayer = L.timeDimension.layer.geoJson(geoJsonLayer, {
            updateTimeDimension: true,
            addlastPoint: true,
            waitForReady: true,
            duration: "PT1M"
          });
          
          timedLayer.addTo(mapInstanceRef.current);
          
          // ตั้งค่าเวลา
          const availableTimes = [];
          allFeatures.forEach(feature => {
            if (feature.properties && feature.properties.times) {
              feature.properties.times.forEach(t => {
                availableTimes.push(new Date(t));
              });
            }
          });
          
          if (availableTimes.length > 0) {
            availableTimes.sort((a, b) => a - b);
            const timeStrings = availableTimes.map(d => d.toISOString()).join(',');
            timeDimension.setAvailableTimes(timeStrings, 'replace');
            timeDimension.setCurrentTime(availableTimes[0].getTime());
          }
          
          // ลบ Timeline Control เก่าถ้ามี
          if (timeControlRef.current) {
            mapInstanceRef.current.removeControl(timeControlRef.current);
            timeControlRef.current = null;
          }
          
          // เพิ่ม Timeline Control (1 ตัว)
          const playerControl = new L.Control.TimeDimension({
            timeDimension: timeDimension,
            playerOptions: {
              transitionTime: 1000,
              loop: true,
              startOver: true
            }
          });
          mapInstanceRef.current.addControl(playerControl);
          timeControlRef.current = playerControl;
          
          console.log('⏰ เพิ่ม Timeline Control แล้ว');
        }
        
        console.log('✨ วาดแผนที่เสร็จสิ้น!');
        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading map data:', error);
        setLoading(false);
      }
    };
    
    // 4) ตั้งค่า Socket.IO สำหรับรับข้อมูล real-time
    const setupRealtimeListener = () => {
      const socket = io('http://localhost:4001');
      
      socket.on('connect', () => {
        console.log('✅ [Map] เชื่อมต่อ Socket.IO สำเร็จ');
      });
      
      socket.on('newData', (data) => {
        console.log('📡 [Map] ได้รับข้อมูล real-time:', data);
        
        if (Array.isArray(data)) {
          data.forEach(item => {
            const { deviceId, latitude, longitude, altitude, type, cameraId, 
                    name, status, direction, fov, detectionRange, isCameraData } = item;
            
            if (deviceId && latitude && longitude) {
              // ตรวจสอบว่าเป็นข้อมูลกล้องหรือไม่
              const isCamera = deviceId.startsWith('CAM-') || deviceId.includes('camera') || isCameraData === true;
              
              console.log(`🔍 [Map] ตรวจสอบ ${deviceId}: isCamera=${isCamera}`);
              
              if (isCamera) {
                console.log(`📷 [Map] อัพเดทกล้อง ${deviceId} แบบ real-time`);
                // อัพเดทกล้อง
                updateRealtimeCamera(
                  deviceId,
                  latitude,
                  longitude,
                  altitude || 0,
                  name || deviceId,
                  status || 'active',
                  direction || 0,
                  fov || 90,
                  detectionRange || 500
                );
              } else {
                // อัพเดทตำแหน่งเป้าหมาย
                let color = '#ef4444'; // ค่าเริ่มต้นสีแดง (opponent)
                let deviceType = 'opponent';
                
                // ตรวจสอบว่าเป็นโดรนฝั่งเราหรือไม่
                if (deviceId.includes('MYDRONE') || deviceId.includes('ALPHA') || 
                    deviceId.includes('BETA') || deviceId.includes('CHARLIE')) {
                  color = '#10b981'; // เขียว
                  deviceType = 'drone';
                }
                
                updateRealtimePosition(
                  deviceId,
                  latitude,
                  longitude,
                  deviceType,
                  color,
                  altitude || 0,
                  cameraId || 'N/A'
                );
              }
            }
          });
        }
      });
      
      socket.on('disconnect', () => {
        console.log('❌ [Map] ตัดการเชื่อมต่อ Socket.IO');
      });
      
      return socket;
    };
    
    // ฟังก์ชันอัพเดทตำแหน่ง real-time
    const updateRealtimePosition = (deviceId, lat, lng, type, color, altitude = 0, cameraId = 'N/A') => {
      if (!mapInstanceRef.current) return;
      
      const detectedTime = new Date().toLocaleString('th-TH');
      
      // ถ้ามี marker เก่า ให้อัพเดทตำแหน่ง
      if (realtimeMarkersRef.current[deviceId]) {
        const marker = realtimeMarkersRef.current[deviceId];
        marker.setLatLng([lat, lng]);
        marker.setPopupContent(`
          <div style="font-size: 12px; line-height: 1.6;">
            <b style="font-size: 14px; color: ${color};">📍 ${deviceId}</b><br>
            <b>${type === 'drone' ? '🚁 Our Drone' : '🎯 Opponent'}</b><br>
            <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
            <b>📡 Real-time Position</b><br>
            ⏰ เวลา: ${detectedTime}<br>
            📌 พิกัด: [${lat.toFixed(5)}, ${lng.toFixed(5)}]<br>
            ✈️ ระดับความสูง: ${altitude} m<br>
            📷 ตรวจจับโดย: ${cameraId}
          </div>
        `);
      } else {
        // สร้าง marker ใหม่
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'realtime-marker',
            html: `<div style="
              background: ${color};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(0,0,0,0.5);
              animation: pulse 1.5s infinite;
            "></div>`,
            iconSize: [20, 20]
          })
        }).addTo(mapInstanceRef.current);
        
        marker.bindPopup(`
          <div style="font-size: 12px; line-height: 1.6;">
            <b style="font-size: 14px; color: ${color};">📍 ${deviceId}</b><br>
            <b>${type === 'drone' ? '🚁 Our Drone' : '🎯 Opponent'}</b><br>
            <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
            <b>📡 Real-time Position</b><br>
            ⏰ เวลา: ${detectedTime}<br>
            📌 พิกัด: [${lat.toFixed(5)}, ${lng.toFixed(5)}]<br>
            ✈️ ระดับความสูง: ${altitude} m<br>
            📷 ตรวจจับโดย: ${cameraId}
          </div>
        `);
        
        realtimeMarkersRef.current[deviceId] = marker;
      }
      
      // ไม่วาดเส้นทาง real-time (ลบออก)
    };
    
    // ฟังก์ชันอัพเดทกล้อง real-time
    const updateRealtimeCamera = (cameraId, lat, lng, altitude, name, status, direction, fov, detectionRange) => {
      if (!mapInstanceRef.current) return;
      
      const color = status === 'active' ? '#3b82f6' : '#9ca3af';
      const detectedTime = new Date().toLocaleString('th-TH');
      
      // ถ้ามีกล้องเก่า ให้อัพเดทตำแหน่ง
      if (realtimeMarkersRef.current[cameraId]) {
        const marker = realtimeMarkersRef.current[cameraId];
        marker.setLatLng([lat, lng]);
        marker.setPopupContent(`
          <div style="font-size: 12px; line-height: 1.6;">
            <b style="font-size: 14px; color: ${color};">📷 ${cameraId}</b><br>
            <b>${name}</b><br>
            <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
            <b>📡 Real-time Camera</b><br>
            ⏰ อัพเดท: ${detectedTime}<br>
            สถานะ: <span style="color: ${status === 'active' ? '#10b981' : '#ef4444'}">
              ${status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </span><br>
            ทิศทาง: ${direction}°<br>
            FOV: ${fov}°<br>
            📌 พิกัด: [${lat.toFixed(5)}, ${lng.toFixed(5)}]<br>
            ระยะตรวจจับ: ${detectionRange}m
          </div>
        `);
        
        console.log(`🔄 [Map] อัพเดทกล้อง ${cameraId}`);
      } else {
        // สร้างกล้องใหม่
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'realtime-camera-marker',
            html: `<div style="
              background: ${color};
              width: 28px;
              height: 28px;
              border-radius: 4px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              animation: pulse 2s infinite;
            ">📷</div>`,
            iconSize: [28, 28]
          })
        }).addTo(mapInstanceRef.current);
        
        marker.bindPopup(`
          <div style="font-size: 12px; line-height: 1.6;">
            <b style="font-size: 14px; color: ${color};">📷 ${cameraId}</b><br>
            <b>${name}</b><br>
            <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
            <b>📡 Real-time Camera</b><br>
            ⏰ อัพเดท: ${detectedTime}<br>
            สถานะ: <span style="color: ${status === 'active' ? '#10b981' : '#ef4444'}">
              ${status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </span><br>
            ทิศทาง: ${direction}°<br>
            FOV: ${fov}°<br>
            📌 พิกัด: [${lat.toFixed(5)}, ${lng.toFixed(5)}]<br>
            ระยะตรวจจับ: ${detectionRange}m
          </div>
        `);
        
        realtimeMarkersRef.current[cameraId] = marker;
        
        // วาด FOV ถ้ากล้องทำงาน
        if (status === 'active' && fov < 360) {
          const startAngle = direction - (fov / 2);
          const endAngle = direction + (fov / 2);
          const sectorPoints = [[lat, lng]];
          
          for (let angle = startAngle; angle <= endAngle; angle += 5) {
            const rad = (angle * Math.PI) / 180;
            const dx = (detectionRange / 111320) * Math.sin(rad);
            const dy = (detectionRange / 110540) * Math.cos(rad);
            sectorPoints.push([lat + dy, lng + dx]);
          }
          
          sectorPoints.push([lat, lng]);
          
          // ลบ FOV เก่า
          if (realtimePathsRef.current[cameraId + '_fov']) {
            mapInstanceRef.current.removeLayer(realtimePathsRef.current[cameraId + '_fov']);
          }
          
          const fovPolygon = L.polygon(sectorPoints, {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 1,
            opacity: 0.4,
            dashArray: '5, 5'
          }).addTo(mapInstanceRef.current);
          
          realtimePathsRef.current[cameraId + '_fov'] = fovPolygon;
        } else if (status === 'active' && fov === 360) {
          // วาดวงกลม 360°
          if (realtimePathsRef.current[cameraId + '_fov']) {
            mapInstanceRef.current.removeLayer(realtimePathsRef.current[cameraId + '_fov']);
          }
          
          const circle = L.circle([lat, lng], {
            radius: detectionRange,
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            weight: 1,
            opacity: 0.3,
            dashArray: '5, 5'
          }).addTo(mapInstanceRef.current);
          
          realtimePathsRef.current[cameraId + '_fov'] = circle;
        }
        
        console.log(`✨ [Map] เพิ่มกล้องใหม่ ${cameraId}`);
      }
    };
    
    // ฟังก์ชันวาดกล้องบนแมพ
    const drawCameras = (map, cameras) => {
      if (!map || !cameras || cameras.length === 0) return;
      
      console.log('📷 กำลังวาดกล้อง:', cameras.length, 'ตัว');
      
      cameras.forEach(camera => {
        // รองรับทั้ง cameraId และ deviceId
        const camId = camera.cameraId || camera.deviceId || 'CAMERA-UNKNOWN';
        const { name, latitude, longitude, status, direction, fov, detectionRange } = camera;
        
        console.log('📷 วาดกล้อง:', camId, 'ที่', latitude, longitude);
        
        // กำหนดสีตามสถานะ
        const color = status === 'active' ? '#3b82f6' : '#9ca3af'; // น้ำเงินหรือเทา
        
        // สร้าง marker กล้อง
        const cameraMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'camera-marker',
            html: `<div style="
              background: ${color};
              width: 30px;
              height: 30px;
              border-radius: 4px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              position: relative;
            ">📷</div>`,
            iconSize: [30, 30]
          })
        }).addTo(map);
        
        // Popup แสดงรายละเอียดกล้อง
        cameraMarker.bindPopup(`
          <div style="font-size: 12px;">
            <b>📷 ${camId}</b><br>
            <b>${name || 'กล้อง'}</b><br>
            สถานะ: <span style="color: ${status === 'active' ? '#10b981' : '#ef4444'}">
              ${status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
            </span><br>
            ทิศทาง: ${direction}°<br>
            FOV: ${fov}°<br>
            พิกัด: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]<br>
            ระยะตรวจจับ: ${detectionRange}m
          </div>
        `);
        
        // วาด Field of View (FOV) ถ้ากล้องทำงาน
        if (status === 'active' && fov < 360) {
          // คำนวณมุมเริ่มต้นและสิ้นสุดของ FOV
          const startAngle = direction - (fov / 2);
          const endAngle = direction + (fov / 2);
          
          // วาดรูปพัด (sector) แสดง FOV
          const sectorPoints = [[latitude, longitude]];
          
          // สร้างจุดรอบๆ sector
          for (let angle = startAngle; angle <= endAngle; angle += 5) {
            const rad = (angle * Math.PI) / 180;
            const dx = (detectionRange / 111320) * Math.sin(rad); // แปลงเมตรเป็นองศา
            const dy = (detectionRange / 110540) * Math.cos(rad);
            sectorPoints.push([latitude + dy, longitude + dx]);
          }
          
          sectorPoints.push([latitude, longitude]); // ปิดรูป
          
          // วาด Polygon
          L.polygon(sectorPoints, {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 1,
            opacity: 0.4,
            dashArray: '5, 5'
          }).addTo(map).bindPopup(`
            <b>📷 ${name || camId}</b><br>
            ระยะตรวจจับ: ${detectionRange}m<br>
            FOV: ${fov}°
          `);
        } else if (status === 'active' && fov === 360) {
          // วาดวงกลมสำหรับกล้อง 360 องศา
          L.circle([latitude, longitude], {
            radius: detectionRange,
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            weight: 1,
            opacity: 0.3,
            dashArray: '5, 5'
          }).addTo(map).bindPopup(`
            <b>📷 ${name || camId}</b><br>
            กล้อง 360°<br>
            ระยะตรวจจับ: ${detectionRange}m
          `);
        }
      });
      
      console.log('✅ วาดกล้องเสร็จสิ้น!');
    };
    
    // ฟังก์ชันแปลงข้อมูลเป็น GeoJSON
    const convertToGeoJSON = (data, type, color) => {
      const grouped = {};
      
      data.forEach(item => {
        if (!grouped[item.deviceId]) {
          grouped[item.deviceId] = [];
        }
        grouped[item.deviceId].push(item);
      });
      
      const features = [];
      Object.keys(grouped).forEach(deviceId => {
        // กรองเฉพาะข้อมูลที่มี time ถูกต้อง
        const validPoints = grouped[deviceId].filter(p => 
          p.time && !isNaN(p.time) && p.time > 0
        );
        
        const points = validPoints.sort((a, b) => a.time - b.time);
        
        if (points.length > 1) {
          // สร้าง times array (ISO strings) สำหรับ TimeDimension
          const times = points.map(p => {
            const timestamp = p.time * 1000; // แปลงวินาทีเป็นมิลลิวินาที
            return new Date(timestamp).toISOString();
          });
          
          features.push({
            type: 'Feature',
            properties: { 
              id: deviceId, 
              type: type,
              color: color,
              pointCount: points.length,
              times: times, // เพิ่ม times สำหรับ TimeDimension
              startTime: new Date(points[0].time * 1000).toLocaleString('th-TH'),
              endTime: new Date(points[points.length - 1].time * 1000).toLocaleString('th-TH'),
              startLat: points[0].latitude,
              startLng: points[0].longitude,
              endLat: points[points.length - 1].latitude,
              endLng: points[points.length - 1].longitude,
              altitude: points[0].altitude || 0,
              cameraId: points[0].cameraId || 'N/A',
              allPoints: points // เก็บข้อมูลทั้งหมด
            },
            geometry: {
              type: 'LineString',
              coordinates: points.map(p => [p.longitude, p.latitude])
            }
          });
        } else if (points.length === 1) {
          const timestamp = points[0].time * 1000;
          const isoTime = new Date(timestamp).toISOString();
          
          features.push({
            type: 'Feature',
            properties: { 
              id: deviceId, 
              type: type,
              color: color,
              pointCount: 1,
              times: [isoTime], // เพิ่ม times สำหรับ TimeDimension
              detectedTime: new Date(timestamp).toLocaleString('th-TH'),
              latitude: points[0].latitude,
              longitude: points[0].longitude,
              altitude: points[0].altitude || 0,
              cameraId: points[0].cameraId || 'N/A'
            },
            geometry: {
              type: 'Point',
              coordinates: [points[0].longitude, points[0].latitude]
            }
          });
        }
      });
      
      return features;
    };
    
    // ฟังก์ชันวาดเส้นทางและจุด
    const drawDronePaths = (mapInstance, features, color, label) => {
      if (!mapInstance) {
        console.error('❌ Map instance is not ready!');
        return;
      }
      
      features.forEach(feature => {
        try {
          if (feature.geometry.type === 'LineString') {
            const coords = feature.geometry.coordinates
              .filter(c => c && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]))
              .map(c => [c[1], c[0]]); // [lat, lng]
            
            if (coords.length < 2) {
              console.warn(`⚠️ ${feature.properties.id}: Not enough valid coordinates`);
              return;
            }
            
            // ไม่วาดเส้นทาง (ลบออก)
            
            // จุดเริ่มต้น
            L.circleMarker(coords[0], {
              radius: 8,
              fillColor: color,
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(mapInstance).bindPopup(`
              <div style="font-size: 12px; line-height: 1.6;">
                <b style="font-size: 14px; color: ${color};">${feature.properties.id}</b><br>
                <b>🎯 ${label}</b><br>
                <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
                <b>📍 จุดเริ่มต้น</b><br>
                ⏰ เวลา: ${feature.properties.startTime}<br>
                📌 พิกัด: [${feature.properties.startLat.toFixed(5)}, ${feature.properties.startLng.toFixed(5)}]<br>
                ✈️ ระดับความสูง: ${feature.properties.altitude} m<br>
                📷 ตรวจจับโดย: ${feature.properties.cameraId}<br>
                📊 จำนวนจุด: ${feature.properties.pointCount}
              </div>
            `);
            
          } else if (feature.geometry.type === 'Point') {
            const coord = feature.geometry.coordinates;
            
            if (!coord || coord.length !== 2 || isNaN(coord[0]) || isNaN(coord[1])) {
              console.warn(`⚠️ ${feature.properties.id}: Invalid point coordinates`);
              return;
            }
            
            L.circleMarker([coord[1], coord[0]], {
              radius: 8,
              fillColor: color,
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(mapInstance).bindPopup(`
              <div style="font-size: 12px; line-height: 1.6;">
                <b style="font-size: 14px; color: ${color};">${feature.properties.id}</b><br>
                <b>🎯 ${label}</b><br>
                <hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">
                <b>📍 จุดตรวจจับ</b><br>
                ⏰ เวลา: ${feature.properties.detectedTime}<br>
                📌 พิกัด: [${feature.properties.latitude.toFixed(5)}, ${feature.properties.longitude.toFixed(5)}]<br>
                ✈️ ระดับความสูง: ${feature.properties.altitude} m<br>
                📷 ตรวจจับโดย: ${feature.properties.cameraId}
              </div>
            `);
          }
        } catch (error) {
          console.error(`❌ Error drawing ${feature.properties.id}:`, error);
        }
      });
    };

    // โหลดข้อมูล
    loadMapData();

    // Layer Control
    const baseLayers = {
      '🛰️ Satellite': satelliteLayer,
      '🗺️ Street Map': osmLayer,
      '⛰️ Topographic': topoLayer,
      '🌙 Dark Mode': darkLayer
    };

    L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);

    // ✅ บังคับให้ map คำนวณขนาดใหม่
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // ตั้งค่า real-time listener
    const socket = setupRealtimeListener();

    // Cleanup function
    return () => {
      if (socket) socket.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        background: '#0b2e13'
      }}
    />
  );
});

export default Map;