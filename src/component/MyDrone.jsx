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
<<<<<<< HEAD
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [droneData, setDroneData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState("");
  const tableRef = useRef(null);

  const itemsPerPage = 30;
  const COLORS = ["#60a5fa", "#f97316", "#22c55e", "#a855f7", "#e11d48"];
=======
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [droneData, setDroneData] = useState([]);
    const [cameraData, setCameraData] = useState([]);
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterText, setFilterText] = useState('');
    const [viewMode, setViewMode] = useState('all'); // 'all', 'drones', 'cameras'
    const itemsPerPage = 30; // จำนวนรายการต่อหน้า
    const tableRef = useRef(null);

    useEffect(() => {
        // ดึงข้อมูลรวมทั้ง drones และ cameras จาก API
        axios.get('http://localhost:3000/api/all-assets')
            .then(response => {
                const data = response.data.data || [];
                
                // กรองเฉพาะข้อมูลที่มี latitude, longitude ที่ถูกต้อง
                const validData = data.filter(item => 
                    item.latitude != null && 
                    item.longitude != null &&
                    !isNaN(item.latitude) && 
                    !isNaN(item.longitude) &&
                    item.latitude !== 0 && 
                    item.longitude !== 0
                );
                
                // กรองให้เหลือแค่ deviceId ซ้ำกันตัวเดียว (เอาข้อมูลล่าสุด)
                const uniqueData = Object.values(
                    validData.reduce((acc, item) => {
                        const key = item.deviceId || item.cameraId || item._id;
                        // ถ้ายังไม่มี หรือ timestamp ใหม่กว่า ให้เก็บตัวนี้
                        if (!acc[key] || new Date(item.timestamp) > new Date(acc[key].timestamp)) {
                            acc[key] = item;
                        }
                        return acc;
                    }, {})
                );
                
                setAllData(uniqueData);
                
                // แยกข้อมูลตามประเภท
                const drones = uniqueData.filter(item => item.assetType === 'drone');
                const cameras = uniqueData.filter(item => item.assetType === 'camera');
                
                setDroneData(drones);
                setCameraData(cameras);
                setLoading(false);
                
                console.log(`📊 โหลดข้อมูล: โดรน ${drones.length} ตัว, กล้อง ${cameras.length} ตัว (Unique)`);
                console.log(`🗑️ กรองข้อมูลซ้ำและไม่ถูกต้องออก: ${data.length - uniqueData.length} รายการ`);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setError(error.message);
                setLoading(false);
            });
    }, []);
>>>>>>> 468f928fb6b9fb7233e8ab79069f61fc813f1039

  // ---------------------------------------------------
  // LOAD API (ใช้ /api/targets เหมือน Reports.jsx)
  // ---------------------------------------------------
  useEffect(() => {
    axios
      .get("http://192.168.1.102:3000/api/targets")
      .then((res) => {
        let list = [];

<<<<<<< HEAD
        if (Array.isArray(res.data)) list = res.data;
        else if (res.data.data) list = res.data.data;
        else if (res.data.targets) list = res.data.targets;
=======
    // ✅ ฟิลเตอร์ข้อมูลตาม viewMode
    const getDisplayData = () => {
        switch(viewMode) {
            case 'drones':
                return droneData;
            case 'cameras':
                return cameraData;
            default:
                return allData;
        }
    };
    
    const displayData = getDisplayData();
    
    const filteredData = displayData.filter(item =>
        Object.values(item).some(value =>
            Array.isArray(value)
                ? value.join(',').toLowerCase().includes(filterText.toLowerCase())
                : String(value).toLowerCase().includes(filterText.toLowerCase())
        )
    );
>>>>>>> 468f928fb6b9fb7233e8ab79069f61fc813f1039

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
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ---------------------------------------------------
  // PieChart เหมือน Reports.jsx
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
  if (loading)
    return <div style={{ padding: 20, color: "#fff" }}>⏳ Loading…</div>;
  if (error)
    return (
<<<<<<< HEAD
      <div style={{ padding: 20, color: "red" }}>❌ Error: {error}</div>
=======
        <div style={{ padding: '0', background: '#2d2d2d', minHeight: '100vh', color: '#000000ff' }}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <div style={{ padding: '20px' }}>
                <h2 style={{color:'#ffffff'}}>Our Assets (Drones & Cameras)</h2>

                {/* ปุ่มสลับโหมดการแสดงผล */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => { setViewMode('all'); setCurrentPage(1); }}
                        style={{
                            padding: '8px 16px',
                            background: viewMode === 'all' ? '#007bff' : '#fff',
                            color: viewMode === 'all' ? '#fff' : '#000',
                            border: '1px solid #007bff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: viewMode === 'all' ? 'bold' : 'normal'
                        }}
                    >
                        📊 ทั้งหมด ({allData.length})
                    </button>
                    <button
                        onClick={() => { setViewMode('drones'); setCurrentPage(1); }}
                        style={{
                            padding: '8px 16px',
                            background: viewMode === 'drones' ? '#10b981' : '#fff',
                            color: viewMode === 'drones' ? '#fff' : '#000',
                            border: '1px solid #10b981',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: viewMode === 'drones' ? 'bold' : 'normal'
                        }}
                    >
                        🚁 โดรน ({droneData.length})
                    </button>
                    <button
                        onClick={() => { setViewMode('cameras'); setCurrentPage(1); }}
                        style={{
                            padding: '8px 16px',
                            background: viewMode === 'cameras' ? '#3b82f6' : '#fff',
                            color: viewMode === 'cameras' ? '#fff' : '#000',
                            border: '1px solid #3b82f6',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: viewMode === 'cameras' ? 'bold' : 'normal'
                        }}
                    >
                        📷 กล้อง ({cameraData.length})
                    </button>
                </div>

                {/* ✅ กล่องค้นหา */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="🔍 ค้นหาข้อมูล..."
                        value={filterText}
                        onChange={(e) => {
                            setFilterText(e.target.value);
                            setCurrentPage(1); // รีเซ็ตหน้าเวลาเปลี่ยนข้อความค้นหา
                        }}
                        style={{
                            padding: '8px 12px',
                            width: '300px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                    <span style={{ marginLeft: '10px', color: '#ffffffff' }}>
                        Showing {filteredData.length} results
                    </span>
                </div>

                {/* แสดงข้อมูลสถิติ */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap',color: '#ffffffff' }}>
                    <p><strong>Total records:</strong> {displayData.length}</p>
                    <p><strong>Current page:</strong> {currentPage} / {totalPages}</p>
                    <p><strong>Showing:</strong> {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}</p>
                    <p><strong>Items per page:</strong> {itemsPerPage}</p>
                    <p style={{ color: '#f81111ff' }}><strong>Displaying rows:</strong> {currentItems.length}</p>
                </div>

            {currentItems.length > 0 ? (
                <>
                    {/* Wrapper สำหรับ scroll แนวนอน */}
                    <div style={{ 
                        overflowX: 'auto',
                        overflowY: 'auto',  // ✅ เพิ่มบรรทัดนี้
                        maxHeight: '550px', // ✅ กำหนดความสูงสูงสุด (ปรับตามต้องการ)
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        <table cellPadding="8" style={{ 
                            borderCollapse: 'collapse', 
                            width: '100%', 
                            minWidth: '1200px' 
                        }}>
                            <thead style={{ 
                                background: '#f0f0f0', 
                                color: '#000000ff', 
                                position: 'sticky', 
                                top: 0,
                                zIndex: 10
                            }}>
                                <tr>
                                    <th style={{ border: '1px solid #ddd', minWidth: '60px' }}>No.</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '100px' }}>Type</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '150px' }}>Device ID</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '100px' }}>Latitude</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '100px' }}>Longitude</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '80px' }}>Altitude</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '100px' }}>Status</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '100px' }}>Time</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '180px' }}>Timestamp</th>
                                    <th style={{ border: '1px solid #ddd', minWidth: '200px' }}>_id</th>
                                </tr>
                            </thead> 
                            <tbody ref={tableRef}>
                                {currentItems.map((item, index) => {
                                    const isCamera = item.assetType === 'camera';
                                    const isCameraStyle = isCamera ? '#e0f2fe' : '#f0fdf4';
                                    
                                    return (
                                    <tr key={item._id} style={{ background: index % 2 === 0 ? '#fff' : isCameraStyle }}>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {indexOfFirstItem + index + 1}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {isCamera ? '📷 Camera' : '🚁 Drone'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', fontWeight: 'bold' }}>
                                            {item.deviceId || item.cameraId || 'N/A'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {item.latitude?.toFixed(6) || 'N/A'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {item.longitude?.toFixed(6) || 'N/A'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {item.altitude || 0} m
                                        </td>
                                        <td style={{ 
                                            border: '1px solid #ddd', 
                                            textAlign: 'center',
                                            color: item.status === 'active' ? '#10b981' : item.status === 'inactive' ? '#ef4444' : '#000',
                                            fontWeight: 'bold'
                                        }}>
                                            {item.status || 'N/A'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            {item.time || 'N/A'}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', fontSize: '11px' }}>
                                            {item.timestamp ? new Date(item.timestamp).toLocaleString('th-TH') : 'N/A'}
                                        </td>
                                        <td style={{ 
                                            border: '1px solid #ddd',
                                            fontSize: '10px', 
                                            maxWidth: '200px', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            color: '#666'
                                        }}>
                                            {/* {item._id} */}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div style={{ 
                        marginTop: '20px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {renderPagination()}
                    </div>
                </>
            ) : (
                <p>📭 No data found...</p>
            )}
            </div>
        </div>
>>>>>>> 468f928fb6b9fb7233e8ab79069f61fc813f1039
    );

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
              สัดส่วนการตรวจจับ แบ่งตามกล้อง (Camera)
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
