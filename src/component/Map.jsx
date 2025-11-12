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

    axios.get('http://localhost:3000/api/data')
    .then(response => {
      console.log('Data from server:', response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching data from server:', error);
      setLoading(false);
    });

    // 3) ตัวอย่าง GeoJSON ที่มีเวลา (properties.times เป็น array ISO strings)
    const geojsonFeature = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "id": "DRONE-ALPHA",
            "type": "drone",
            "times": [
              "2025-11-11T09:02:00Z",
              "2025-11-11T09:04:00Z",
              "2025-11-11T09:06:00Z",
              "2025-11-11T09:08:00Z",
              "2025-11-11T09:10:00Z"
            ]
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [100.5018, 13.7563],
              [100.5050, 13.7580],
              [100.5100, 13.7600],
              [100.5120, 13.7620],
              [100.5140, 13.7630]
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "id": "DRONE-BETA",
            "type": "drone",
            "times": [
              "2025-11-11T09:03:00Z",
              "2025-11-11T09:05:00Z",
              "2025-11-11T09:07:00Z",
              "2025-11-11T09:09:00Z"
            ]
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [100.5000, 13.7550],
              [100.5030, 13.7570],
              [100.5060, 13.7590],
              [100.5080, 13.7610]
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "id": "TGT-01",
            "type": "target",
            "times": [
              "2025-11-11T09:03:00Z",
              "2025-11-11T09:05:00Z"
            ]
          },
          "geometry": {
            "type": "Point",
            "coordinates": [100.508, 13.757]
          }
        }
      ]
    };

    // 4) สร้าง Heatmap จากข้อมูลโดรน
    const heatmapPoints = [];
    geojsonFeature.features.forEach(feature => {
      if (feature.properties.type === 'drone' && feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach(coord => {
          // [lat, lng, intensity]
          heatmapPoints.push([coord[1], coord[0], 0.5]);
        });
      }
    });

    const heatLayer = L.heatLayer(heatmapPoints, {
      radius: 25,
      blur: 35,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.5: 'lime',
        1.0: 'red'
      }
    }).addTo(map);

    // 5) สร้าง Polyline สำหรับแสดงเส้นทางการเคลื่อนที่ของโดรนแต่ละตัว (สีเขียวทั้งหมด - ของเรา)
    const dronePathLayers = {};
    geojsonFeature.features.forEach(feature => {
      if (feature.properties.type === 'drone' && feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
        const color = '#10b981'; // สีเขียวสำหรับโดรนของเรา
        
        const polyline = L.polyline(coords, {
          color: color,
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 10'
        }).addTo(map);

        // เพิ่ม marker ที่จุดเริ่มต้น (สีเขียว)
        L.circleMarker(coords[0], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`<b>${feature.properties.id}</b><br>🚁 Start Point (Our Drone)`);

        // เพิ่ม marker ที่จุดสิ้นสุด (สีเขียว)
        L.circleMarker(coords[coords.length - 1], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`<b>${feature.properties.id}</b><br>🚁 End Point (Our Drone)`);

        dronePathLayers[feature.properties.id] = polyline;
      }
    });

    // 6) Create a time-aware layer for GeoJSON (สีเขียวสำหรับโดรนของเรา)
    const geoJsonLayer = L.geoJson(geojsonFeature, {
      style: feature => ({ 
        color: feature.properties.type === 'drone' ? '#10b981' : '#ef4444', // เขียวสำหรับโดรน, แดงสำหรับ target
        weight: 4 
      }),
      pointToLayer: (feature, latlng) => {
        const color = feature.properties.type === 'drone' ? '#10b981' : '#ef4444';
        return L.circleMarker(latlng, { 
          radius: 8, 
          fillOpacity: 1,
          fillColor: color,
          color: '#fff',
          weight: 2
        });
      },
      onEachFeature: (feature, layer) => {
        const type = feature.properties.type === 'drone' ? '🚁 Our Drone' : '🎯 Alert Target';
        layer.bindPopup(`<b>${type}</b><br>${feature.properties.id}`);
      }
    });

    const timedLayer = L.timeDimension.layer.geoJson(geoJsonLayer, {
      updateTimeDimension: true,
      addlastPoint: true,   // แสดงจุดสุดท้ายบนเส้น
      duration: "PT1M"      // เวลาในหน้าต่าง (1 minute)
    });

    timedLayer.addTo(map);

    // 7) Add TimeDimension control (play/pause/slider)
    const playerControl = new L.Control.TimeDimension({
      timeDimension: timeDimension,
      playerOptions: {
        transitionTime: 1000,
        loop: true,
        startOver: true
      }
    });
    map.addControl(playerControl);

    // 8) เพิ่ม Layer Control สำหรับสลับ Heatmap และเส้นทาง
    const baseLayers = {
      '🛰️ Satellite': satelliteLayer,
      '🗺️ Street Map': osmLayer,
      '⛰️ Topographic': topoLayer,
      '🌙 Dark Mode': darkLayer
    };

    const overlays = {
      'Heatmap': heatLayer,
      '🚁 Our Drone Paths (Green)': Object.keys(dronePathLayers).length > 0 
        ? L.layerGroup(Object.values(dronePathLayers)) 
        : L.layerGroup(),
      ...Object.keys(dronePathLayers).reduce((acc, id) => {
        acc[`${id} Path`] = dronePathLayers[id];
        return acc;
      }, {})
    };

    L.control.layers(baseLayers, overlays, { position: 'topright' }).addTo(map);

    // 9) เริ่มที่ช่วงเวลาที่มีข้อมูล
    const availableTimes = []; // เก็บ times ทั้งหมดจาก features
    geojsonFeature.features.forEach(f => {
      if (f.properties && f.properties.times) {
        f.properties.times.forEach(t => availableTimes.push(new Date(t)));
      }
    });
    if (availableTimes.length) {
      availableTimes.sort((a, b) => a - b);
      timeDimension.setAvailableTimes(availableTimes.map(d => d.toISOString()).join(','), 'replace');
      timeDimension.setCurrentTime(availableTimes[0].getTime());
    }

    // ✅ บังคับให้ map คำนวณขนาดใหม่
    setTimeout(() => {
      map.invalidateSize();
      setLoading(false);
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