// src/component/Reports.jsx

import React, { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import Header from "./Header";
import Sidebar from "./Sidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import "../App.css";

// กันจอว่างตอนโหลด
const initialData = {
  drones: [],
  missions: [],
  detections: [],
};

export default function Reports() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ดึงข้อมูลจาก API /api/targets
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://192.168.1.102:3000/api/targets");
        console.log("🌐 [Reports] fetch status:", res.status);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const raw = await res.json();
        console.log("📡 [Reports] raw response:", raw);

        const dashboardData = transformTargetsToDashboardData(raw);
        console.log("✅ [Reports] mapped dashboardData:", dashboardData);

        setData(dashboardData);
      } catch (err) {
        console.error("❌ Fetch /api/targets error (Reports):", err);
        setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchTargets();
  }, []);

  // ---------- Metrics ----------
  const totalDetections = useMemo(() => data.drones.length, [data]);

  const uniqueDevices = useMemo(
    () => new Set(data.drones.map((d) => d.deviceId || "unknown")).size,
    [data]
  );

  const uniqueCameras = useMemo(
    () => new Set(data.drones.map((d) => d.cameraId || "unknown")).size,
    [data]
  );

  // ---------- Pie: แบ่งตาม Device ----------
  const pieByDevice = useMemo(() => {
    const map = {};
    data.drones.forEach((d) => {
      const key = d.deviceId || "ไม่ทราบ Device";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data]);

  // ---------- Pie: แบ่งตาม Camera ----------
  const pieByCamera = useMemo(() => {
    const map = {};
    data.drones.forEach((d) => {
      const key = d.cameraId || "ไม่ทราบกล้อง";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data]);

  // ---------- Line: Altitude ตามเวลา ----------
  const lineAltitude = useMemo(() => {
    const sorted = [...data.drones].sort((a, b) =>
      (a.lastSeen || "").localeCompare(b.lastSeen || "")
    );
    return sorted.map((d) => ({
      time: d.lastSeen ? dayjs(d.lastSeen).format("HH:mm:ss") : "",
      altitude: d.altitude ?? null,
    }));
  }, [data]);

  // ---------- Line: จำนวน detection ต่อวัน ----------
  const lineDetections = useMemo(
    () =>
      (data.detections || []).map((d) => ({
        date: d.date,
        detections: d.count,
      })),
    [data]
  );

  // ---------- Table ----------
  const tableRows = useMemo(
    () =>
      (data.drones || [])
        .slice()
        .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1))
        .map((d, i) => ({
          no: i + 1,
          deviceId: d.deviceId || "-",
          cameraId: d.cameraId || "-",
          lat: d.lat?.toFixed ? d.lat.toFixed(5) : d.lat,
          lng: d.lng?.toFixed ? d.lng.toFixed(5) : d.lng,
          altitude: d.altitude ?? "-",
          ts: d.lastSeen
            ? dayjs(d.lastSeen).format("DD/MM/YYYY HH:mm")
            : "-",
        })),
    [data]
  );

  const COLORS = ["#60a5fa", "#f97316", "#22c55e", "#a855f7", "#e11d48"];

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="r-page">
        <h1>REPORTS</h1>

        {loading && <p>กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...</p>}
        {error && (
          <p style={{ color: "red" }}>
            เกิดข้อผิดพลาดในการโหลดข้อมูล: {error}
          </p>
        )}

        <div className="r-grid">
          {/* ซ้ายบน: Metrics รวม ๆ ของการตรวจจับ */}
          <div className="r-col-12 r-md-col-3 r-stack-3">
            <Card title="จำนวนการตรวจจับทั้งหมด">
              <Metric value={totalDetections} />
            </Card>
            <Card title="จำนวนอุปกรณ์ (Device) ที่ใช้ตรวจจับ">
              <Metric value={uniqueDevices} />
            </Card>
            <Card title="จำนวนกล้อง (Camera) ที่ใช้ตรวจจับ">
              <Metric value={uniqueCameras} />
            </Card>
          </div>

          {/* กลางบน: Pie แบ่งตาม Device */}
          <div className="r-col-12 r-md-col-3 r-stack-3">
            <Card title="สัดส่วนการตรวจจับ แบ่งตาม Device">
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 4,
                  paddingBottom: 4,
                }}
              >
                <PieChart width={220} height={185}>
                  <Pie
                    data={pieByDevice}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={63}
                    paddingAngle={2}
                    minAngle={8}         // ✅ บังคับมุมขั้นต่ำให้ทุกชิ้นเห็นสี
                    stroke="#ffffff"     // ✅ เส้นแบ่งสีให้ชัดขึ้น
                    strokeWidth={1}
                    labelLine={false}
                    label={false}
                  >
                    {pieByDevice.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ fontSize: 11 }}
                    contentStyle={{ padding: 8 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11 }}
                    iconSize={10}
                  />
                </PieChart>
              </div>
            </Card>
          </div>

          {/* ขวาบน: Pie แบ่งตาม Camera */}
          <div className="r-col-12 r-md-col-3 r-stack-3">
            <Card title="สัดส่วนการตรวจจับ แบ่งตามกล้อง (Camera)">
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 4,
                  paddingBottom: 4,
                }}
              >
                <PieChart width={220} height={170}>
                  <Pie
                    data={pieByCamera}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={63}
                    paddingAngle={2}
                    minAngle={8}         // ✅ ตรงนี้ด้วย
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
                    wrapperStyle={{ fontSize: 11 }}
                    contentStyle={{ padding: 8 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11 }}
                    iconSize={10}
                  />
                </PieChart>
              </div>
            </Card>
          </div>

          {/* ช่องว่างสำรอง */}
          <div className="r-col-12 r-md-col-3" />

          {/* กราฟเส้น: Altitude ตามเวลา */}
          <div className="r-col-12 r-md-col-6">
            <Card title="ความสูงของโดรนฝ่ายตรงข้ามตามเวลา (Altitude vs Time)">
              <div className="r-h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineAltitude}>
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="altitude"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* กราฟเส้น: จำนวนการตรวจจับต่อวัน */}
          <div className="r-col-12 r-md-col-6">
            <Card title="จำนวนการตรวจจับฝ่ายตรงข้าม / วัน">
              <div className="r-h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineDetections}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="detections"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ตาราง */}
          <div className="r-col-12">
            <Card title="ตารางการตรวจพบล่าสุด">
              <div className="r-table-wrap">
                <table className="r-table">
                  <thead>
                    <tr>
                      <th>ลำดับ</th>
                      <th>Device</th>
                      <th>Camera</th>
                      <th>ละติจูด</th>
                      <th>ลองจิจูด</th>
                      <th>ความสูง (m)</th>
                      <th>วัน/เวลาที่ตรวจพบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r) => (
                      <tr key={r.no}>
                        <td>{r.no}</td>
                        <td>{r.deviceId}</td>
                        <td>{r.cameraId}</td>
                        <td>{r.lat}</td>
                        <td>{r.lng}</td>
                        <td>{r.altitude}</td>
                        <td>{r.ts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------- ฟังก์ชันแปลงข้อมูลจาก /api/targets → รูปแบบแดชบอร์ด ----------------

function transformTargetsToDashboardData(raw) {
  console.log("🔍 [Reports] transformTargetsToDashboardData raw:", raw);

  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && Array.isArray(raw.data)) {
    list = raw.data;
  } else if (raw && Array.isArray(raw.targets)) {
    list = raw.targets;
  }

  console.log("📋 [Reports] list length:", list.length);

  const drones = list.map((t) => {
    return {
      id: t._id,
      side: "enemy",
      active: true,
      lat: t.latitude,
      lng: t.longitude,
      lastSeen: t.timestamp,
      deviceId: t.deviceId,
      cameraId: t.cameraId,
      altitude: t.altitude,
    };
  });

  const detectionsMap = {};
  drones.forEach((d) => {
    if (!d.lastSeen) return;
    const date = String(d.lastSeen).slice(0, 10);
    detectionsMap[date] = (detectionsMap[date] || 0) + 1;
  });

  const detections = Object.entries(detectionsMap).map(([date, count]) => ({
    date,
    count,
  }));

  const missions = [];

  return { drones, missions, detections };
}

// ---------------- Components เสริม ----------------

function Card({ title, children }) {
  return (
    <section className="r-card">
      <h2 className="r-panel-title">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ value }) {
  return <div className="r-metric">{value}</div>;
}
