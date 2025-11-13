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
  const [droneData, setDroneData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState("");
  const tableRef = useRef(null);

  const itemsPerPage = 30;
  const COLORS = ["#60a5fa", "#f97316", "#22c55e", "#a855f7", "#e11d48"];

  // ---------------------------------------------------
  // LOAD API (ใช้ /api/targets เหมือน Reports.jsx)
  // ---------------------------------------------------
  useEffect(() => {
    axios
      .get("http://192.168.1.102:3000/api/targets")
      .then((res) => {
        let list = [];

        if (Array.isArray(res.data)) list = res.data;
        else if (res.data.data) list = res.data.data;
        else if (res.data.targets) list = res.data.targets;

        const mapped = list.map((t) => ({
          id: t._id,
          deviceId: t.deviceId,
          cameraId: t.cameraId,
          lastSeen: t.timestamp,
          altitude: t.altitude,
          lat: t.latitude,
          lng: t.longitude,
        }));

        setDroneData(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching /api/targets:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------
  // PieChart แบบเดียวกับ Reports.jsx
  // ---------------------------------------------------
  const pieByDevice = useMemo(() => {
    const map = {};
    droneData.forEach((d) => {
      const key = d.deviceId || "ไม่ทราบ Device";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [droneData]);

  const pieByCamera = useMemo(() => {
    const map = {};
    droneData.forEach((d) => {
      const key = d.cameraId || "ไม่ทราบกล้อง";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [droneData]);

  // ---------------------------------------------------
  // FILTER
  // ---------------------------------------------------
  const filteredData = droneData.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // ---------------------------------------------------
  // PAGINATION
  // ---------------------------------------------------
  const indexLast = currentPage * itemsPerPage;
  const indexFirst = indexLast - itemsPerPage;
  const currentItems = filteredData.slice(indexFirst, indexLast);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 80);
  };

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
        <h2>🎯 Target Data (ใช้ API เดียวกับ Reports)</h2>

        {/* Search Box */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="🔍 ค้นหา..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "8px 12px",
              width: 280,
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />
          <span style={{ marginLeft: 10 }}>
            Showing {filteredData.length} results
          </span>
        </div>

        {/* PIE CHART BOX แบบเดียวกับ Reports */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 320,
              background: "#111827",
              borderRadius: 12,
              padding: "16px 8px",
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: 12 }}>
              สัดส่วนการตรวจจับ
            </h3>

            {/* DEVICE PIE */}
            <h4 style={{ textAlign: "center" }}>แบ่งตาม Device</h4>
            <PieChart width={240} height={180}>
              <Pie
                data={pieByDevice}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                minAngle={10}
                stroke="#fff"
                strokeWidth={1}
              >
                {pieByDevice.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
            </PieChart>

            {/* CAMERA PIE */}
            <h4 style={{ textAlign: "center", marginTop: 10 }}>
              แบ่งตาม Camera
            </h4>
            <PieChart width={240} height={180}>
              <Pie
                data={pieByCamera}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                minAngle={10}
                stroke="#fff"
              >
                {pieByCamera.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
            </PieChart>
          </div>
        </div>

        {/* TABLE */}
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: 550,
            background: "#fff",
            color: "#000",
            borderRadius: 6,
          }}
        >
          <table
            cellPadding={8}
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: 900,
            }}
          >
            <thead
              style={{
                background: "#e5e7eb",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <tr>
                <th>No.</th>
                <th>DeviceID</th>
                <th>CameraID</th>
                <th>Lat</th>
                <th>Lng</th>
                <th>Altitude</th>
                <th>Timestamp</th>
              </tr>
            </thead>

            <tbody ref={tableRef}>
              {currentItems.map((d, i) => (
                <tr key={d.id}>
                  <td>{indexFirst + i + 1}</td>
                  <td>{d.deviceId || "-"}</td>
                  <td>{d.cameraId || "-"}</td>
                  <td>{d.lat || "-"}</td>
                  <td>{d.lng || "-"}</td>
                  <td>{d.altitude || "-"}</td>
                  <td>{d.lastSeen || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              style={{
                padding: "6px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
                background: currentPage === i + 1 ? "#007bff" : "#fff",
                color: currentPage === i + 1 ? "#fff" : "#000",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyDrone;
