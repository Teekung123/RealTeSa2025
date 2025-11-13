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
          active: true,
          lat: t.latitude,
          lng: t.longitude,
          lastSeen: t.timestamp,
        }));

        setDrones(mapped);
      } catch (err) {
        console.error("โหลด API ไม่สำเร็จ", err);
      }
    };

    fetchTargets();
  }, []);

  const COLORS_ENEMY = ["#ef4444", "#9ca3af"]; // แดง + เทา
  const COLORS_US = ["#22c55e", "#9ca3af"];    // เขียว + เทา

  // ฝ่ายตรงข้าม (ข้อมูลจริงจาก drones)
  const pieEnemy = useMemo(
    () => [
      { name: "ทำงาน", value: drones.filter((d) => d.active).length },
      { name: "ไม่ทำงาน", value: 0 },
    ],
    [drones]
  );

  // ฝ่ายเรา (ยังไม่มี API เลยใส่ค่า mock ไว้เฉย ๆ)
  const pieUs = useMemo(
    () => [
      { name: "ทำงาน", value: 3 },
      { name: "ไม่ทำงาน", value: 1 },
    ],
    []
  );

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
          {/* กล่อง 1: ฝ่ายตรงข้าม */}
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
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              สถานะโดรน (ฝ่ายตรงข้าม)
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <PieChart width={120} height={100}>
                <Pie
                  data={pieEnemy}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={20}
                  outerRadius={32}
                  paddingAngle={2}
                  label={false}
                  labelLine={false}
                >
                  {pieEnemy.map((_, i) => (
                    <Cell key={i} fill={COLORS_ENEMY[i % COLORS_ENEMY.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 9, padding: 4 }} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 8 }}
                  iconSize={8}
                />
              </PieChart>
            </div>
          </div>

          {/* กล่อง 2: ฝ่ายเรา */}
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
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              สถานะโดรน (ฝ่ายเรา)
            </div>

            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <PieChart width={120} height={100}>
                <Pie
                  data={pieUs}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={20}
                  outerRadius={32}
                  paddingAngle={2}
                  label={false}
                  labelLine={false}
                >
                  {pieUs.map((_, i) => (
                    <Cell key={i} fill={COLORS_US[i % COLORS_US.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 9, padding: 4 }} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 8 }}
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
