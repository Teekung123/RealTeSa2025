import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-timedimension';
import 'leaflet-timedimension/dist/leaflet.timedimension.control.css';
import 'leaflet.heat';

const Map = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // ป้องกันการสร้าง map ซ้ำ
    if (mapInstanceRef.current) return;

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

    // 5) สร้าง Polyline สำหรับแสดงเส้นทางการเคลื่อนที่ของโดรนแต่ละตัว
    const dronePathLayers = {};
    geojsonFeature.features.forEach(feature => {
      if (feature.properties.type === 'drone' && feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
        const color = feature.properties.id === 'DRONE-ALPHA' ? '#00ff00' : '#00ffff';
        
        const polyline = L.polyline(coords, {
          color: color,
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 10'
        }).addTo(map);

        // เพิ่ม marker ที่จุดเริ่มต้น
        L.circleMarker(coords[0], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`<b>${feature.properties.id}</b><br>Start Point`);

        // เพิ่ม marker ที่จุดสิ้นสุด
        L.circleMarker(coords[coords.length - 1], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`<b>${feature.properties.id}</b><br>End Point`);

        dronePathLayers[feature.properties.id] = polyline;
      }
    });

    // 6) Create a time-aware layer for GeoJSON
    const geoJsonLayer = L.geoJson(geojsonFeature, {
      style: feature => ({ 
        color: feature.properties.type === 'drone' ? 'lime' : 'orange', 
        weight: 4 
      }),
      pointToLayer: (feature, latlng) => {
        const color = feature.properties.type === 'drone' ? 'lime' : 'orange';
        return L.circleMarker(latlng, { 
          radius: 8, 
          fillOpacity: 1,
          fillColor: color,
          color: '#fff',
          weight: 2
        });
      },
      onEachFeature: (feature, layer) => {
        const type = feature.properties.type === 'drone' ? '🚁 Drone' : '🎯 Target';
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
        height: '100vh', 
        width: '100%',
        background: '#0b2e13'
      }}
    />
  );
};

export default Map;