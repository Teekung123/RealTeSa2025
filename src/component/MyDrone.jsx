// src/component/MyDrone.jsx

import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";

// 🔥 path ถูกต้อง (เพราะไฟล์อยู่โฟลเดอร์เดียวกัน)
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

function MyDrone() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myDrones, setMyDrones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("drones"); // "drones" or "cameras"

  // ---------------------------------------------------
  // LOAD API - ดึงข้อมูลโดรนและกล้อง
  // ---------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงข้อมูลโดรนฝั่งเรา
        const dronesRes = await axios.get("http://localhost:3000/api/MyDrone");
        const dronesList = dronesRes.data.data || [];
        setMyDrones(dronesList);

        // ดึงข้อมูลกล้อง
        const camerasRes = await axios.get("http://localhost:3000/api/cameras");
        const camerasList = camerasRes.data.data || [];
        setCameras(camerasList);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching assets:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---------------------------------------------------
  // สรุปข้อมูล
  // ---------------------------------------------------
  const uniqueDrones = useMemo(() => {
    const deviceMap = {};
    myDrones.forEach(d => {
      if (!deviceMap[d.deviceId]) {
        deviceMap[d.deviceId] = { deviceId: d.deviceId, count: 0, lastSeen: d.timestamp };
      }
      deviceMap[d.deviceId].count += 1;
      if (new Date(d.timestamp) > new Date(deviceMap[d.deviceId].lastSeen)) {
        deviceMap[d.deviceId].lastSeen = d.timestamp;
      }
    });
    return Object.values(deviceMap);
  }, [myDrones]);

  const uniqueCameras = useMemo(() => {
    const cameraMap = {};
    cameras.forEach(c => {
      const id = c.cameraId || c.deviceId;
      if (!cameraMap[id]) {
        cameraMap[id] = {
          id: id,
          name: c.name || id,
          status: c.status || 'active',
          lat: c.latitude,
          lng: c.longitude,
          direction: c.direction || 0,
          fov: c.fov || 90,
          range: c.detectionRange || 500
        };
      }
    });
    return Object.values(cameraMap);
  }, [cameras]);

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  if (loading) {
    return (
      <div style={{ padding: 20, color: "#fff" }}>
        ⏳ Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: "red" }}>
        ❌ Error: {error}
      </div>
    );
  }

  return (
    <div style={{ background: "#2d2d2d", minHeight: "100vh", color: "#fff" }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <div style={{ padding: 20 }}>
        <h2>🎯 My Assets (โดรนและกล้องฝั่งเรา)</h2>

        {/* สรุปข้อมูล */}
        <div style={{ 
          display: "flex", 
          gap: 20, 
          marginBottom: 20,
          flexWrap: "wrap"
        }}>
          <div style={{
            background: "#10b981",
            padding: "20px 30px",
            borderRadius: 8,
            minWidth: 200
          }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>🚁 โดรนฝั่งเรา</h3>
            <p style={{ fontSize: 32, fontWeight: "bold", margin: "10px 0 0 0" }}>
              {uniqueDrones.length} ตัว
            </p>
            <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
              ({myDrones.length} จุดข้อมูลทั้งหมด)
            </p>
          </div>

          <div style={{
            background: "#3b82f6",
            padding: "20px 30px",
            borderRadius: 8,
            minWidth: 200
          }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>📷 กล้อง</h3>
            <p style={{ fontSize: 32, fontWeight: "bold", margin: "10px 0 0 0" }}>
              {uniqueCameras.length} ตัว
            </p>
            <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
              (พร้อมใช้งาน)
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
          <button
            onClick={() => setActiveTab("drones")}
            style={{
              padding: "10px 20px",
              background: activeTab === "drones" ? "#10b981" : "#4b5563",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            🚁 โดรน ({uniqueDrones.length})
          </button>
          <button
            onClick={() => setActiveTab("cameras")}
            style={{
              padding: "10px 20px",
              background: activeTab === "cameras" ? "#3b82f6" : "#4b5563",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            📷 กล้อง ({uniqueCameras.length})
          </button>
        </div>

        {/* แสดงข้อมูลตาม Tab */}
        {activeTab === "drones" && (
          <div style={{
            background: "#fff",
            color: "#000",
            borderRadius: 6,
            padding: 20
          }}>
            <h3>รายการโดรนฝั่งเรา</h3>
            {uniqueDrones.length === 0 ? (
              <p style={{ color: "#666" }}>ไม่มีข้อมูลโดรน</p>
            ) : (
              <table
                cellPadding={12}
                style={{
                  borderCollapse: "collapse",
                  width: "100%"
                }}
              >
                <thead style={{ background: "#10b981", color: "#fff" }}>
                  <tr>
                    <th>No.</th>
                    <th>Device ID</th>
                    <th>จำนวนจุดข้อมูล</th>
                    <th>เห็นครั้งล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueDrones.map((drone, i) => (
                    <tr key={drone.deviceId} style={{ borderBottom: "1px solid #ddd" }}>
                      <td>{i + 1}</td>
                      <td><strong>{drone.deviceId}</strong></td>
                      <td>{drone.count} จุด</td>
                      <td>{new Date(drone.lastSeen).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "cameras" && (
          <div style={{
            background: "#fff",
            color: "#000",
            borderRadius: 6,
            padding: 20
          }}>
            <h3>รายการกล้อง</h3>
            {uniqueCameras.length === 0 ? (
              <p style={{ color: "#666" }}>ไม่มีข้อมูลกล้อง</p>
            ) : (
              <table
                cellPadding={12}
                style={{
                  borderCollapse: "collapse",
                  width: "100%"
                }}
              >
                <thead style={{ background: "#3b82f6", color: "#fff" }}>
                  <tr>
                    <th>No.</th>
                    <th>Camera ID</th>
                    <th>ชื่อ</th>
                    <th>สถานะ</th>
                    <th>พิกัด</th>
                    <th>ทิศทาง</th>
                    <th>FOV</th>
                    <th>ระยะตรวจจับ</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueCameras.map((camera, i) => (
                    <tr key={camera.id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td>{i + 1}</td>
                      <td><strong>{camera.id}</strong></td>
                      <td>{camera.name}</td>
                      <td>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          background: camera.status === 'active' ? '#10b981' : '#ef4444',
                          color: '#fff',
                          fontSize: 12
                        }}>
                          {camera.status}
                        </span>
                      </td>
                      <td>{camera.lat?.toFixed(4)}, {camera.lng?.toFixed(4)}</td>
                      <td>{camera.direction}°</td>
                      <td>{camera.fov}°</td>
                      <td>{camera.range} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyDrone;
