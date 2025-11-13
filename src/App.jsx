// App.jsx

import "./App.css";
import React, { useState, useRef, useEffect, useMemo } from "react";

import Map from "./component/Map.jsx";
import Header from "./component/Header.jsx";
import Sidebar from "./component/Sidebar.jsx";
import AlertsBox from "./component/AlertsBox.jsx";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef(null);

  const handleAlertClick = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo(lat, lng, 15);
    }
  };

  // drones จาก API
  const [drones, setDrones] = useState([]);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const res = await fetch("http://192.168.1.102:3000/api/targets");
        if (!res.ok) throw new Error(res.status);
        const raw = await res.json();

        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw.data) list = raw.data;
        else if (raw.targets) list = raw.targets;

        const mapped = list.map((t) => ({
          id: t._id,
          side: "enemy",
          active: true, // ถ้ามี field สถานะจริง ๆ ค่อยมาแก้ทีหลังได้
          lat: t.latitude,
          lng: t.longitude,
          lastSeen: t.timestamp,
          deviceId: t.deviceId,
          cameraId: t.cameraId,
        }));

        setDrones(mapped);
      } catch (err) {
        console.error("โหลด API ไม่สำเร็จ", err);
      }
    };

    fetchTargets();
  }, []);

  // สีสำหรับกราฟ
  const COLORS = ["#60a5fa", "#f97316", "#22c55e", "#a855f7", "#e11d48", "#fbbf24", "#10b981"];

  // ---------- Pie: แบ่งตาม Device ----------
  const pieByDevice = useMemo(() => {
    const map = {};
    drones.forEach((d) => {
      const key = d.deviceId || "ไม่ทราบ Device";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [drones]);

  // ---------- Pie: แบ่งตาม Camera ----------
  const pieByCamera = useMemo(() => {
    const map = {};
    drones.forEach((d) => {
      const key = d.cameraId || "ไม่ทราบกล้อง";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [drones]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <div style={{ display: "flex", flex: 1, padding: 10, gap: 10 }}>
        {/* ซ้าย: Alerts */}
        <div style={{ width: 150 }}>
          <AlertsBox onAlertClick={handleAlertClick} mapRef={mapRef} />
        </div>

        {/* กลาง: แผนที่ */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <Map ref={mapRef} />
        </div>

        {/* ขวา: กราฟวงกลม 2 อัน (Device + Camera) */}
        <div
          style={{
            width: 260,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Pie: Device */}
          <div
            style={{
              background: "#2d2d2d",
              padding: 10,
              borderRadius: 8,
              color: "#fff",
              textAlign: "center",
              flex: 1,

            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              สัดส่วนการตรวจจับ แบ่งตาม Device
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <PieChart width={200} height={150}>
                <Pie
                  data={pieByDevice}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  minAngle={8}
                  stroke="#ffffff"
                  strokeWidth={1}
                  labelLine={false}
                  label={false}
                >
                  {pieByDevice.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ fontSize: 10 }}
                  contentStyle={{ padding: 8 }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 9 }}
                  iconSize={8}
                />
              </PieChart>
            </div>
          </div>

          {/* Pie: Camera */}
          <div
            style={{
              background: "#2d2d2d",
              padding: 10,
              borderRadius: 8,
              color: "#fff",
              textAlign: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              สัดส่วนการตรวจจับ แบ่งตาม Camera
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <PieChart width={200} height={150}>
                <Pie
                  data={pieByCamera}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  minAngle={8}
                  stroke="#ffffff"
                  strokeWidth={1}
                  labelLine={false}
                  label={false}
                >
                  {pieByCamera.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ fontSize: 10 }}
                  contentStyle={{ padding: 8 }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 9 }}
                  iconSize={8}
                />
              </PieChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
