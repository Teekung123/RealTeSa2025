import React, { useMemo, useState } from "react";
// Install: npm i recharts dayjs
import dayjs from "dayjs";
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

const sample = {
  drones: [
    { id: "D-01", side: "us", active: true, lat: 13.75, lng: 100.54, lastSeen: "2025-11-11T09:05:00Z" },
    { id: "D-02", side: "us", active: false, lat: 13.76, lng: 100.55, lastSeen: "2025-11-11T08:10:00Z" },
    { id: "D-03", side: "enemy", active: true, lat: 16.44, lng: 102.84, lastSeen: "2025-11-11T07:30:00Z" },
  ],
  missions: [
    { date: "2025-11-08", side: "us", flights: 6 },
    { date: "2025-11-09", side: "us", flights: 4 },
    { date: "2025-11-10", side: "us", flights: 7 },
    { date: "2025-11-11", side: "us", flights: 5 },
  ],
  detections: [
    { date: "2025-11-08", count: 2 },
    { date: "2025-11-09", count: 1 },
    { date: "2025-11-10", count: 4 },
    { date: "2025-11-11", count: 3 },
  ],
};

export default function Reports() {
  const [data] = useState(sample);

  const totalUs = useMemo(() => data.drones.filter(d => d.side === "us").length, [data]);
  const activeUs = useMemo(() => data.drones.filter(d => d.side === "us" && d.active).length, [data]);
  const nonUs = useMemo(() => data.drones.filter(d => d.side === "us" && !d.active).length, [data]);
  const totalEnemy = useMemo(() => data.drones.filter(d => d.side === "enemy").length, [data]);

  const pieUs = useMemo(() => [
    { name: "ทำงาน", value: data.drones.filter(d => d.side === "us" && d.active).length },
    { name: "ไม่ทำ", value: data.drones.filter(d => d.side === "us" && !d.active).length },
  ], [data]);

  const pieEnemy = useMemo(() => [
    { name: "ทำงาน", value: data.drones.filter(d => d.side === "enemy" && d.active).length },
    { name: "ไม่ทำ", value: data.drones.filter(d => d.side === "enemy" && !d.active).length },
  ], [data]);

  const lineUs = useMemo(() => data.missions
    .filter(m => m.side === "us")
    .map(m => ({ date: m.date, flights: m.flights })), [data]);

  const lineEnemy = useMemo(() => data.detections
    .map(d => ({ date: d.date, detections: d.count })), [data]);

  const tableRows = useMemo(() => data.drones
    .sort((a,b) => (a.lastSeen < b.lastSeen ? 1 : -1))
    .map((d, i) => ({
      no: i + 1,
      lat: d.lat.toFixed(5),
      lng: d.lng.toFixed(5),
      ts: dayjs(d.lastSeen).format("DD/MM/YYYY HH:mm"),
      active: d.active ? "Active" : "Inactive",
    })), [data]);

  const COLORS = ["#60a5fa", "#9ca3af"];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-lg font-semibold mb-4">สรุปต่อวัน</h1>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4 space-y-3">
          <Card title="จำนวนโดรนทั้งหมด (ฝ่ายเรา)"><Metric value={totalUs} /></Card>
          <Card title="จำนวนโดรนที่ Active (ฝ่ายเรา)"><Metric value={activeUs} /></Card>
          <Card title="จำนวนโดรนที่ Non (ฝ่ายเรา)"><Metric value={nonUs} /></Card>
        </div>

        <div className="col-span-12 md:col-span-5">
          <Card title="สถานะฝูงโดรน (ฝ่ายเรา)">
            <div className="h-64">
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

        <div className="col-span-12 md:col-span-3 space-y-3">
          <Card title="จำนวนโดรนทั้งหมด (ฝ่ายตรงข้าม)"><Metric value={totalEnemy} /></Card>
          <Card title="สถานะฝูงโดรน (ฝ่ายตรงข้าม)">
            <div className="h-64">
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

        <div className="col-span-12 md:col-span-6">
          <Card title="กราฟเส้น (เที่ยวบินฝ่ายเรา / วัน)">
            <div className="h-64">
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

        <div className="col-span-12 md:col-span-6">
          <Card title="กราฟเส้น (การตรวจจับฝ่ายตรงข้าม / วัน)">
            <div className="h-64">
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

        <div className="col-span-12">
          <Card title="ตารางการตรวจพบล่าสุด">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500">
                    <th className="px-3 py-2">ลำดับ</th>
                    <th className="px-3 py-2">ละติจูด</th>
                    <th className="px-3 py-2">ลองจิจูด</th>
                    <th className="px-3 py-2">วัน/เวลาที่ตรวจพบ</th>
                    <th className="px-3 py-2">สถานะ (Active)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.no} className="border-t border-neutral-200">
                      <td className="px-3 py-2">{r.no}</td>
                      <td className="px-3 py-2">{r.lat}</td>
                      <td className="px-3 py-2">{r.lng}</td>
                      <td className="px-3 py-2">{r.ts}</td>
                      <td className="px-3 py-2">{r.active}</td>
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
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <h2 className="mb-3 text-base font-medium text-neutral-800">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ value }) {
  return (
    <div className="text-4xl font-semibold tracking-tight text-neutral-900">
      {value}
    </div>
  );
}
