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
  const [opponents, setOpponents] = useState([]);
  const [myDrones, setMyDrones] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch opponents
        const resOpponents = await fetch("http://localhost:3000/api/targets");
        if (resOpponents.ok) {
          const raw = await resOpponents.json();
          let list = [];
          if (Array.isArray(raw)) list = raw;
          else if (raw.data) list = raw.data;
          else if (raw.targets) list = raw.targets;

          const mapped = list.map((t) => ({
            id: t._id,
            deviceId: t.deviceId,
            cameraId: t.cameraId,
            lat: t.latitude,
            lng: t.longitude,
            lastSeen: t.timestamp,
          }));
          setOpponents(mapped);
        }

        // Fetch mydrones
        const resMyDrones = await fetch("http://localhost:3000/api/MyDrone");
        if (resMyDrones.ok) {
          const myData = await resMyDrones.json();
          // ตรวจสอบว่าเป็น array หรือไม่
          const myList = Array.isArray(myData) ? myData : (myData.data || []);
          setMyDrones(myList);
        }
      } catch (err) {
        console.error("โหลด API ไม่สำเร็จ", err);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#60a5fa", "#f97316", "#22c55e", "#a855f7", "#e11d48"];

  // ฝ่ายตรงข้าม: แบ่งตาม Device
  const pieEnemyDevice = useMemo(() => {
    const map = {};
    opponents.forEach((d) => {
      const key = d.deviceId || "ไม่ทราบ Device";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [opponents]);

  // ฝ่ายตรงข้าม: แบ่งตาม Camera
  const pieEnemyCamera = useMemo(() => {
    const map = {};
    opponents.forEach((d) => {
      const key = d.cameraId || "ไม่ทราบกล้อง";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [opponents]);

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

        {/* ขวา: แถบกราฟวงกลม 2 อัน (ขนาดเท่ากัน) */}
        <div
          style={{
            width: 220, // แถบขวาแคบๆ ข้างแผนที่
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* กล่อง 1: ฝ่ายตรงข้าม - แบ่งตาม Device */}
          <div
            style={{
              background: "#111827",
              borderRadius: 8,
              padding: 10,
              color: "#fff",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              ฝ่ายตรงข้าม (Device)
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <PieChart width={180} height={140}>
                <Pie
                  data={pieEnemyDevice}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={2}
                  minAngle={8}
                  stroke="#ffffff"
                  strokeWidth={1}
                  label={false}
                  labelLine={false}
                >
                  {pieEnemyDevice.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ fontSize: 10 }}
                  contentStyle={{ padding: 6 }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 9 }}
                  iconSize={8}
                />
              </PieChart>
            </div>
          </div>

          {/* กล่อง 1b: ฝ่ายตรงข้าม - แบ่งตาม Camera */}
          <div
            style={{
              background: "#111827",
              borderRadius: 8,
              padding: 10,
              color: "#fff",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              ฝ่ายตรงข้าม (Camera)
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <PieChart width={180} height={140}>
                <Pie
                  data={pieEnemyCamera}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={2}
                  minAngle={8}
                  stroke="#ffffff"
                  strokeWidth={1}
                  label={false}
                  labelLine={false}
                >
                  {pieEnemyCamera.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ fontSize: 10 }}
                  contentStyle={{ padding: 6 }}
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
