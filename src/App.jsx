// App.jsx

import "./App.css";
import React, { useState, useRef, useEffect, useMemo } from "react";

import Map from "./component/Map.jsx";
import Header from "./component/Header.jsx";
import Sidebar from "./component/Sidebar.jsx";
import AlertsBox from "./component/AlertsBox.jsx";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mapRef = useRef(null);

  const handleAlertClick = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo(lat, lng, 15);
    }
  };

  const [missionStates] = useState([
    { id: "ภารกิจ 122", status: "Mission Started" },
    { id: "ภารกิจ 121", status: "Mission Completed" },
    { id: "ภารกิจ 120", status: "Path Deviation" },
  ]);

  const [drones, setDrones] = useState([]);

  // โหลดข้อมูลโดรนจาก API
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

  const COLORS = ["#60a5fa", "#9ca3af"];

  const pieEnemy = useMemo(
    () => [
      { name: "ทำงาน", value: drones.filter((d) => d.active).length },
      { name: "ไม่ทำงาน", value: 0 },
    ],
    [drones]
  );

  const pieUs = useMemo(
    () => [
      { name: "ทำงาน", value: 0 },
      { name: "ไม่ทำงาน", value: 0 },
    ],
    []
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <div style={{ display: "flex", flex: 1, padding: 10, gap: 10 }}>
        
        {/* ซ้าย: Alerts */}
        <div style={{ width: 150 }}>
          <AlertsBox onAlertClick={handleAlertClick} mapRef={mapRef} />
        </div>

        {/* ตรงกลาง: Map */}
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

        {/* ขวา: Mission + PieChart */}
        <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Mission Panel */}
          <div
            style={{
              background: "#2d2d2d",
              padding: 10,
              borderRadius: 8,
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>
              Mission State
            </div>

            {missionStates.map((state, i) => (
              <div
                key={i}
                style={{
                  background: "#fff",
                  color: "#000",
                  marginBottom: 6,
                  padding: 8,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                <div style={{ textAlign: "center", fontWeight: "bold" }}>{state.id}</div>
                <div style={{ textAlign: "center", fontSize: 10 }}>{state.status}</div>
              </div>
            ))}
          </div>

          {/* PieChart Panel */}
          <div
            style={{
              background: "#2d2d2d",
              padding: 10,
              borderRadius: 8,
              flex: 1,
              color: "#fff",
            }}
          >
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12 }}>
              สถานะโดรน (ฝ่ายตรงข้าม)
            </div>

            {/* MINI PIE CHART */}
            <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 6 }}>
              <PieChart width={110} height={90}>
                <Pie
                  data={pieEnemy}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={30}
                  paddingAngle={2}
                  labelLine={false}
                  label={false}
                >
                  {pieEnemy.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip contentStyle={{ fontSize: 8, padding: 4 }} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 7 }}
                  iconSize={7}
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
