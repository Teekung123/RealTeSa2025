import { useEffect, useRef , useState, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
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
    addPersistentMarker: (deviceId, lat, lng, type) => {
      if (!mapInstanceRef.current) return;
      
      // ถ้ามี marker เก่าอยู่แล้ว ลบทิ้ง 
      if (markersRef.current[deviceId]) {
        mapInstanceRef.current.removeLayer(markersRef.current[deviceId]);
      }
      
      // กำหนดสีตาม type (สำหรับ Alerts - สีแดง)
      let color = '#ef4444'; // แดง (danger)
      if (type === 'warning') color = '#f59e0b'; // ส้ม
      if (type === 'success') color = '#10b981'; // เขียว
      
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
          color: '#ef4444', // สีแดงสำหรับ Alerts
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

    // 2) Init TimeDimension
    const timeDimension = new L.TimeDimension({
      period: "PT10S" // step ทุก 10 วินาที
    });
    map.timeDimension = timeDimension;

    // 3) ดึงข้อมูลจาก MongoDB
    const loadMapData = async () => {
      try {
        console.log('🔄 กำลังโหลดข้อมูล...');
        
        // ดึงข้อมูลโดรนฝั่งเรา (สีเขียว)
        const myDroneResponse = await axios.get('http://localhost:3000/api/MyDrone');
        const myDroneData = myDroneResponse.data.data || [];
        
        // ดึงข้อมูลฝั่งตรงข้าม (สีแดง)
        const opponentResponse = await axios.get('http://localhost:3000/api/targets');
        const opponentData = opponentResponse.data.data || [];
        
        console.log('🟢 My Drone Data:', myDroneData.length, 'records');
        console.log('🔴 Opponent Data:', opponentData.length, 'records');
        
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
        
        // สร้าง GeoJSON FeatureCollection สำหรับ TimeDimension
        // Filter เฉพาะ features ที่มี coordinates ถูกต้อง
        const validMyDroneFeatures = myDroneFeatures.filter(f => {
          if (!f.properties.id || f.properties.id === 'undefined' || f.properties.id === 'unknown_device') {
            return false;
          }
          if (f.geometry.type === 'LineString') {
            return f.geometry.coordinates && f.geometry.coordinates.length >= 2;
          }
          if (f.geometry.type === 'Point') {
            return f.geometry.coordinates && f.geometry.coordinates.length === 2;
          }
          return false;
        });
        
        const validOpponentFeatures = opponentFeatures.filter(f => {
          if (!f.properties.id || f.properties.id === 'undefined' || f.properties.id === 'unknown_device') {
            return false;
          }
          if (f.geometry.type === 'LineString') {
            return f.geometry.coordinates && f.geometry.coordinates.length >= 2;
          }
          if (f.geometry.type === 'Point') {
            return f.geometry.coordinates && f.geometry.coordinates.length === 2;
          }
          return false;
        });
        
        console.log('✅ Valid My Drone Features:', validMyDroneFeatures.length);
        console.log('✅ Valid Opponent Features:', validOpponentFeatures.length);
        
        const allFeatures = [...validMyDroneFeatures, ...validOpponentFeatures];
        
        if (allFeatures.length === 0) {
          console.warn('⚠️ No valid features for timeline');
          setLoading(false);
          return;
        }
        
        const geojsonData = {
          type: "FeatureCollection",
          features: allFeatures
        };
        
        // สร้าง GeoJSON Layer
        const geoJsonLayer = L.geoJson(geojsonData, {
          style: feature => ({ 
            color: feature.properties.color, 
            weight: 4 
          }),
          pointToLayer: (feature, latlng) => {
            return L.circleMarker(latlng, { 
              radius: 8, 
              fillOpacity: 1,
              fillColor: feature.properties.color,
              color: '#fff',
              weight: 2
            });
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`<b>${feature.properties.id}</b><br>${feature.properties.type}`);
          },
          filter: (feature) => {
            // Double check coordinates
            if (feature.geometry.type === 'Point') {
              const coords = feature.geometry.coordinates;
              return coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]);
            }
            return true;
          }
        });
        
        // สร้าง TimeDimension Layer
        const timedLayer = L.timeDimension.layer.geoJson(geoJsonLayer, {
          updateTimeDimension: true,
          addlastPoint: true,
          duration: "PT1M"
        });
        
        timedLayer.addTo(mapInstanceRef.current);
        
        // รวบรวม times ทั้งหมดจาก features
        const availableTimes = [];
        allFeatures.forEach(feature => {
          if (feature.properties && feature.properties.times) {
            feature.properties.times.forEach(t => {
              availableTimes.push(new Date(t));
            });
          }
        });
        
        // เรียงลำดับเวลา
        if (availableTimes.length > 0) {
          availableTimes.sort((a, b) => a - b);
          const timeStrings = availableTimes.map(d => d.toISOString()).join(',');
          timeDimension.setAvailableTimes(timeStrings, 'replace');
          timeDimension.setCurrentTime(availableTimes[0].getTime());
          console.log(`⏰ ตั้งเวลา Timeline: ${availableTimes.length} จุดเวลา`);
          console.log(`📅 เวลาเริ่มต้น: ${availableTimes[0].toISOString()}`);
          console.log(`📅 เวลาสิ้นสุด: ${availableTimes[availableTimes.length - 1].toISOString()}`);
        }
        
        // เพิ่ม TimeDimension Control
        const playerControl = new L.Control.TimeDimension({
          timeDimension: timeDimension,
          playerOptions: {
            transitionTime: 1000,
            loop: true,
            startOver: true
          }
        });
        mapInstanceRef.current.addControl(playerControl);
        
        console.log('✨ วาดแผนที่เสร็จสิ้น!');
        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading map data:', error);
        setLoading(false);
      }
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
        const points = grouped[deviceId].sort((a, b) => a.time - b.time);
        
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
              times: times // เพิ่ม times สำหรับ TimeDimension
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
              times: [isoTime] // เพิ่ม times สำหรับ TimeDimension
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
            
            // วาดเส้นทาง
            const polyline = L.polyline(coords, {
              color: color,
              weight: 3,
              opacity: 0.7,
              dashArray: '5, 10'
            }).addTo(mapInstance);
            
            // จุดเริ่มต้น
            L.circleMarker(coords[0], {
              radius: 8,
              fillColor: color,
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(mapInstance).bindPopup(`<b>${feature.properties.id}</b><br>${label}<br>Start (${feature.properties.pointCount} points)`);
            
            // จุดสิ้นสุด
            L.circleMarker(coords[coords.length - 1], {
              radius: 8,
              fillColor: color,
              color: '#fff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(mapInstance).bindPopup(`<b>${feature.properties.id}</b><br>${label}<br>End Point`);
            
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
            }).addTo(mapInstance).bindPopup(`<b>${feature.properties.id}</b><br>${label}<br>Single Point`);
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

    // Cleanup function
    return () => {
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