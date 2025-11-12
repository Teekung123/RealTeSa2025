// src/components/Reports.jsx
import React, { useMemo, useState } from "react";
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

import "../App.css"; // ใช้สไตล์จาก App.css (มีชุด r-* ต่อท้ายแล้ว)

const sample = {  //ตัวอย่างข้อมูล
  drones: [
    { id: "D-01", side: "us", active: true,  lat: 13.75, lng: 100.54, lastSeen: "2025-11-11T09:05:00Z" },
    { id: "D-02", side: "us", active: false, lat: 13.76, lng: 100.55, lastSeen: "2025-11-11T08:10:00Z" },
    { id: "D-03", side: "enemy", active: true, lat: 16.44, lng: 102.84, lastSeen: "2025-11-11T07:30:00Z" },
    { id: "D-04", side: "us", active: true,  lat: 13.77, lng: 100.56, lastSeen: "2025-11-10T12:20:00Z" },
    { id: "D-05", side: "enemy", active: false, lat: 16.45, lng: 102.85, lastSeen: "2025-11-10T11:15:00Z" },
    { id: "D-06", side: "us", active: false, lat: 13.78, lng: 100.57, lastSeen: "2025-11-09T14:50:00Z" },
    { id: "D-07", side: "enemy", active: true, lat: 16.46, lng: 102.86, lastSeen: "2025-11-09T13:40:00Z" },
    { id: "D-08", side: "us", active: true,  lat: 13.79, lng: 100.58, lastSeen: "2025-11-08T16:25:00Z" },
  ],
  missions: [ //กราฟเส้นฝ่ายเรา
    { date: "2025-11-08", side: "us", flights: 6 },
    { date: "2025-11-09", side: "us", flights: 4 },
    { date: "2025-11-10", side: "us", flights: 7 },
    { date: "2025-11-11", side: "us", flights: 5 },
  ],
  detections: [ //กราฟเส้นฝ่ายตรงข้าม
    { date: "2025-11-08", count: 2 },
    { date: "2025-11-09", count: 1 },
    { date: "2025-11-10", count: 4 },
    { date: "2025-11-11", count: 3 },
  ],
};

export default function Reports() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data] = useState(sample);

  // Metrics
  const totalUs    = useMemo(() => data.drones.filter(d => d.side === "us").length, [data]);
  const activeUs   = useMemo(() => data.drones.filter(d => d.side === "us" && d.active).length, [data]);
  const nonUs      = useMemo(() => data.drones.filter(d => d.side === "us" && !d.active).length, [data]);
  const totalEnemy = useMemo(() => data.drones.filter(d => d.side === "enemy").length, [data]);

  // Pies 
  const pieUs = useMemo(() => ([
    { name: "ทำงาน", value: data.drones.filter(d => d.side === "us"    && d.active).length },
    { name: "ไม่ทำงาน", value: data.drones.filter(d => d.side === "us"    && !d.active).length },
  ]), [data]);

  const pieEnemy = useMemo(() => ([
    { name: "ทำงาน", value: data.drones.filter(d => d.side === "enemy" && d.active).length },
    { name: "ไม่ทำงาน", value: data.drones.filter(d => d.side === "enemy" && !d.active).length },
  ]), [data]);

  // Lines กราฟเส้น
  const lineUs = useMemo(
    () => data.missions.filter(m => m.side === "us").map(m => ({ date: m.date, flights: m.flights })),
    [data]
  );
  const lineEnemy = useMemo(
    () => data.detections.map(d => ({ date: d.date, detections: d.count })),
    [data]
  );

  // Table แถวตาราง
  const tableRows = useMemo(() => data.drones
    .sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1))
    .map((d, i) => ({
      no: i + 1,
      lat: d.lat.toFixed(5),
      lng: d.lng.toFixed(5),
      ts: dayjs(d.lastSeen).format("DD/MM/YYYY HH:mm"),
      active: d.active ? "Active" : "Inactive",
    })), [data]);

  const COLORS = ["#60a5fa", "#9ca3af"];

  return (
    <div className="r-page">
      <h1>REPORTS </h1>

        <div className="r-grid">
          {/* ซ้ายบน: Metrics ฝ่ายเรา */}
          <div className="r-col-12 r-md-col-4 r-stack-3">
            <Card title="จำนวนโดรนทั้งหมด (ฝ่ายเรา)"><Metric value={totalUs} /></Card>
            <Card title="จำนวนโดรนที่ Active (ฝ่ายเรา)"><Metric value={activeUs} /></Card>
            <Card title="จำนวนโดรนที่ Non (ฝ่ายเรา)"><Metric value={nonUs} /></Card>
          </div>

          {/* กลางบน: Pie ฝ่ายเรา */}
          <div className="r-col-12 r-md-col-5">
            <Card title="สถานะฝูงโดรน (ฝ่ายเรา)">
              <div className="r-h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieUs} dataKey="value" nameKey="name" outerRadius={90}>
                      {pieUs.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend /><Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ขวาบน: ฝ่ายตรงข้าม + Pie */}
          <div className="r-col-12 r-md-col-3 r-stack-3">
            <Card title="จำนวนโดรนทั้งหมด (ฝ่ายตรงข้าม)"><Metric value={totalEnemy} /></Card>
            <Card title="สถานะฝูงโดรน (ฝ่ายตรงข้าม)">
              <div className="r-h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieEnemy} dataKey="value" nameKey="name" outerRadius={90}>
                      {pieEnemy.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend /><Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* กราฟเส้น 2 ฝั่ง */}
          <div className="r-col-12 r-md-col-6">
            <Card title="กราฟเส้น (เที่ยวบินฝ่ายเรา / วัน)">
              <div className="r-h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineUs}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="flights" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="r-col-12 r-md-col-6">
            <Card title="กราฟเส้น (การตรวจจับฝ่ายตรงข้าม / วัน)">
              <div className="r-h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineEnemy}>
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="detections" strokeWidth={2} dot={false} />
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
                    <th>ละติจูด</th>
                    <th>ลองจิจูด</th>
                    <th>วัน/เวลาที่ตรวจพบ</th>
                    <th>สถานะ (Active)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.no}>
                      <td>{r.no}</td>
                      <td>{r.lat}</td>
                      <td>{r.lng}</td>
                      <td>{r.ts}</td>
                      <td>{r.active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
