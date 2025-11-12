# 📢 Alerts Component

Component สำหรับแสดงการแจ้งเตือนเมื่อตรวจพบข้อมูลใหม่จาก WebSocket/Socket.IO

## 🎯 Features

- ✅ แสดงการแจ้งเตือนแบบ real-time
- ✅ รองรับ 3 ระดับ: `danger`, `warning`, `success`
- ✅ แสดงข้อมูล deviceId, จำนวนจุดข้อมูล, และเวลา
- ✅ ปิดอัตโนมัติหลัง 10 วินาที
- ✅ Animation slide-in จากด้านขวา
- ✅ ปุ่มปิดด้วยตนเอง
- ✅ แสดงสูงสุด 5 รายการ

## 📦 Installation

```bash
npm install socket.io-client
```

## 🔧 Usage

### 1. Import Component

```jsx
import Alerts from './component/Alerts';
import io from 'socket.io-client';
```

### 2. เชื่อมต่อ Socket.IO

```jsx
function App() {
  const [newData, setNewData] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:4001');

    socket.on('newData', (data) => {
      setNewData(data); // ส่งข้อมูลไปยัง Alerts
    });

    return () => socket.disconnect();
  }, []);

  return (
    <>
      <Alerts newData={newData} />
      {/* เนื้อหาอื่นๆ */}
    </>
  );
}
```

### 3. ตัวอย่างข้อมูลที่รับจาก Socket.IO

```javascript
// ข้อมูลจาก event 'newData'
[
  {
    deviceId: "drone_01",
    time: 1699800000,
    latitude: 13.7563,
    longitude: 100.5018,
    altitude: 50
  },
  // ... อีกหลายจุด
]
```

## 🎨 Alert Types

### Warning (เหลือง)
```jsx
type: 'warning'  // สีเหลือง #f59e0b
```

### Danger (แดง)
```jsx
type: 'danger'   // สีแดง #ef4444
```

### Success (เขียว)
```jsx
type: 'success'  // สีเขียว #10b981
```

## 📝 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `newData` | Array | Yes | ข้อมูลใหม่ที่ได้รับจาก Socket.IO |

## 🔄 Data Flow

```
WebSocket/Socket.IO Server (Port 4001)
         ↓
    Event 'newData'
         ↓
   Component รับข้อมูล
         ↓
  สร้าง Alert Object
         ↓
    แสดงการแจ้งเตือน
         ↓
  ปิดอัตโนมัติหลัง 10 วินาที
```

## 🎯 Integration กับ Defform.js

ข้อมูลจาก `Defform.js` (transformDataToEntries2) จะถูกส่งผ่าน WebSocket:

```javascript
// Backend (websocket.js)
import { transformDataToEntries2 } from './utils/Defform.js';

ws.on('message', async (message) => {
  const parsedData = JSON.parse(message);
  
  // แปลงข้อมูล
  const allEntries = transformDataToEntries2(parsedData);
  
  // บันทึก MongoDB
  await coll.insertMany(allEntries);
  
  // Broadcast ไปยัง clients
  io.emit('newData', allEntries); // ← ส่งไปยัง Alerts
});
```

## 🌟 ตัวอย่างการใช้งานเต็มรูปแบบ

ดูได้ที่: `src/component/AppWithAlerts.jsx`

## 🎨 Customization

### เปลี่ยนเวลาปิดอัตโนมัติ

```jsx
// ใน Alerts.jsx line 31
setTimeout(() => {
  setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
}, 10000); // เปลี่ยนเป็น milliseconds ที่ต้องการ
```

### เปลี่ยนจำนวนรายการสูงสุด

```jsx
// ใน Alerts.jsx line 29
setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // เปลี่ยน 5 เป็นจำนวนที่ต้องการ
```

### เปลี่ยนตำแหน่งการแสดง

```jsx
// ใน Alerts.jsx style container
style={{
  position: 'fixed',
  top: '60px',    // ระยะจากด้านบน
  right: '20px',  // ระยะจากด้านขวา
  // ... เปลี่ยนเป็น left, bottom ตามต้องการ
}}
```

## 🐛 Troubleshooting

### ไม่เห็นการแจ้งเตือน
1. ตรวจสอบว่า Socket.IO server รันอยู่ที่ port 4001
2. เช็ค Console ว่ามี error หรือไม่
3. ตรวจสอบว่า `newData` มีค่าหรือไม่

### การแจ้งเตือนซ้อนทับ
- ตรวจสอบ `z-index: 1002` ใน Alerts.jsx
- เพิ่มค่า z-index ให้สูงกว่า elements อื่นๆ

## 📄 License

MIT
