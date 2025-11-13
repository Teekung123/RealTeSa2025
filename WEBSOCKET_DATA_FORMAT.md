# คู่มือส่งข้อมูลผ่าน WebSocket

## WebSocket Server
- **URL:** `ws://localhost:4002` (Development) หรือ `ws://192.168.1.102:4002` (Production)
- **Protocol:** WebSocket (ws://)
- **Data Format:** JSON

---

## 1. ข้อมูลโดรนฝ่ายเรา (My Drone)

### รูปแบบข้อมูล
```json
{
  "deviceId": "MYDRONE-TH-001",
  "latitude": 13.7563,
  "longitude": 100.5018,
  "altitude": 250,
  "type": "drone",
  "status": "active",
  "speed": 15.5,
  "heading": 90,
  "battery": 85,
  "mission": "patrol",
  "time": 1763023846
}
```

**⚠️ สำคัญ:** ระบบจะจัดเป็น **ฝ่ายเรา** ถ้า `deviceId` ตรงเงื่อนไขใดเงื่อนไขหนึ่ง:
- ขึ้นต้นด้วย `MYDRONE-` (เช่น `MYDRONE-TH-001`)
- มีคำว่า `MYDRONE`, `ALPHA`, `BETA`, `CHARLIE` (เช่น `ALPHA-01`, `BETA-02`)
- หรือส่ง `"isMyDrone": true`

### Field คำอธิบาย
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `deviceId` | String | ✅ | รหัสโดรน (ต้องมี MYDRONE-/ALPHA/BETA/CHARLIE) |
| `latitude` | Number | ✅ | ละติจูด (-90 ถึง 90) |
| `longitude` | Number | ✅ | ลองจิจูด (-180 ถึง 180) |
| `altitude` | Number | ✅ | ความสูง (เมตร) |
| `type` | String | ❌ | ประเภท (drone, camera, detection) |
| `status` | String | ❌ | สถานะ (active, inactive) |
| `speed` | Number | ❌ | ความเร็ว (m/s) |
| `heading` | Number | ❌ | ทิศทาง (0-360 องศา) |
| `battery` | Number | ❌ | แบตเตอรี่ (0-100%) |
| `mission` | String | ❌ | ภารกิจปัจจุบัน |
| `isMyDrone` | Boolean | ❌ | บังคับให้เป็นฝ่ายเรา (true) |
| `time` | Number | ✅ | Unix timestamp (วินาที) |

### ตัวอย่าง Node.js
```javascript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:4002');

ws.on('open', () => {
  const data = {
    deviceId: 'MYDRONE-TH-001',  // ต้องมี MYDRONE-
    latitude: 13.7563,
    longitude: 100.5018,
    altitude: 250,
    type: 'drone',
    status: 'active',
    speed: 15.5,
    heading: 90,
    battery: 85,
    time: Math.floor(Date.now() / 1000)
  };
  
  ws.send(JSON.stringify(data));
});
```

### ตัวอย่าง Python
```python
import websocket
import json
import time

ws = websocket.create_connection('ws://localhost:4002')

data = {
    'deviceId': 'MYDRONE-TH-001',  # ต้องมี MYDRONE-
    'latitude': 13.7563,
    'longitude': 100.5018,
    'altitude': 250,
    'type': 'drone',
    'status': 'active',
    'speed': 15.5,
    'heading': 90,
    'battery': 85,
    'time': int(time.time())
}

ws.send(json.dumps(data))
ws.close()
```

---

## 2. ข้อมูลโดรนฝั่งตรงข้าม (Opponent Drone)

### รูปแบบข้อมูล
```json
{
  "deviceId": "TARGET-001",
  "latitude": 13.7420,
  "longitude": 100.5120,
  "altitude": 180,
  "type": "target",
  "status": "active",
  "detectedBy": "CAM-001",
  "confidence": 0.95,
  "time": 1763023846
}
```

### Field คำอธิบาย
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `deviceId` | String | ✅ | รหัสเป้าหมาย |
| `latitude` | Number | ✅ | ละติจูด |
| `longitude` | Number | ✅ | ลองจิจูด |
| `altitude` | Number | ✅ | ความสูง (เมตร) |
| `type` | String | ❌ | ประเภท (target, danger, warning) |
| `status` | String | ❌ | สถานะ |
| `detectedBy` | String | ❌ | ตรวจพบโดยกล้อง/เซ็นเซอร์ใด |
| `confidence` | Number | ❌ | ความมั่นใจ (0-1) |
| `time` | Number | ✅ | Unix timestamp |

---

## 3. ข้อมูลกล้อง (Camera)
### รูปแบบข้อมูล
```json
{
  "deviceId": "CAM-001",
  "cameraId": "CAM-001",
  "latitude": 13.7500,
  "longitude": 100.5100,
  "altitude": 50,
  "type": "camera",
  "status": "active",
  "direction": 45,
  "fov": 110,
  "detectionRange": 550,
  "name": "กล้องหอสังเกตการณ์ 1",
  "time": 1763023846
}
```
### Field คำอธิบาย
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `deviceId` | String | ✅ | รหัสอุปกรณ์ |
| `cameraId` | String | ✅ | รหัสกล้อง |
| `latitude` | Number | ✅ | ละติจูด |
| `longitude` | Number | ✅ | ลองจิจูด |
| `altitude` | Number | ✅ | ความสูง (เมตร) |
| `type` | String | ❌ | ต้องเป็น "camera" |
| `status` | String | ❌ | สถานะ (active, inactive) |
| `direction` | Number | ❌ | ทิศทางกล้อง (0-360 องศา) |
| `fov` | Number | ❌ | มุมมอง (Field of View) |
| `detectionRange` | Number | ❌ | ระยะตรวจจับ (เมตร) |
| `name` | String | ❌ | ชื่อกล้อง |
| `time` | Number | ✅ | Unix timestamp |

---

## 4. ข้อมูล Detection พร้อมรูปภาพและวิดีโอ

### รูปแบบข้อมูล
```json
{
  "cameraId": "CAM-001",
  "deviceId": "TARGET-001",
  "targetId": "ENEMY-DRONE-001",
  "latitude": 13.7360,
  "longitude": 100.5230,
  "altitude": 150,
  "type": "detection",
  "status": "active",
  "confidence": 0.95,
  "description": "Detected enemy drone with video",
  "imageData": "base64_encoded_image_data...",
  "videoData": "base64_encoded_video_data...",
  "time": 1763023846
}
```

### Field คำอธิบาย
| Field | Type | Required | คำอธิบาย |
|-------|------|----------|----------|
| `cameraId` | String | ✅ | รหัสกล้องที่ตรวจพบ |
| `deviceId` | String | ✅ | รหัสอุปกรณ์ที่ถูกตรวจพบ |
| `targetId` | String | ❌ | รหัสเป้าหมาย |
| `latitude` | Number | ✅ | ละติจูด |
| `longitude` | Number | ✅ | ลองจิจูด |
| `altitude` | Number | ✅ | ความสูง (เมตร) |
| `type` | String | ❌ | ประเภท (detection, danger, warning) |
| `status` | String | ❌ | สถานะ |
| `confidence` | Number | ❌ | ความมั่นใจ (0-1) |
| `description` | String | ❌ | คำอธิบาย |
| `imageData` | String | ❌ | รูปภาพ base64 encoded (JPG/PNG) |
| `videoData` | String | ❌ | วิดีโอ base64 encoded (MP4) |
| `time` | Number | ✅ | Unix timestamp |

### การส่งรูปภาพ
```javascript
import fs from 'fs';

// อ่านรูปภาพและแปลงเป็น base64
const imageBuffer = fs.readFileSync('detection.jpg');
const base64Image = imageBuffer.toString('base64');

const data = {
  cameraId: 'CAM-001',
  deviceId: 'TARGET-001',
  latitude: 13.7360,
  longitude: 100.5230,
  altitude: 150,
  imageData: base64Image,  // รูปภาพ base64
  time: Math.floor(Date.now() / 1000)
};

ws.send(JSON.stringify(data));
```

### การส่งวิดีโอ
```javascript
import fs from 'fs';

// อ่านวิดีโอและแปลงเป็น base64
const videoBuffer = fs.readFileSync('detection.mp4');
const base64Video = videoBuffer.toString('base64');

const data = {
  cameraId: 'CAM-001',
  deviceId: 'TARGET-001',
  latitude: 13.7360,
  longitude: 100.5230,
  altitude: 150,
  videoData: base64Video,  // วิดีโอ base64
  time: Math.floor(Date.now() / 1000)
};

ws.send(JSON.stringify(data));
```

### การส่งทั้งรูปภาพและวิดีโอพร้อมกัน
```javascript
const data = {
  cameraId: 'CAM-001',
  deviceId: 'TARGET-001',
  latitude: 13.7360,
  longitude: 100.5230,
  altitude: 150,
  imageData: base64Image,  // รูปภาพ base64
  videoData: base64Video,  // วิดีโอ base64
  confidence: 0.95,
  time: Math.floor(Date.now() / 1000)
};

ws.send(JSON.stringify(data));
```

**หมายเหตุ:** 
- **รูปภาพ:** จะถูกบันทึกที่ `D:\RealTeSa2025\public\IMG\`
  - ระบบจะสร้าง URL: `http://localhost:3000/IMG/{deviceId}_{timestamp}.jpg`
- **วิดีโอ:** จะถูกบันทึกที่ `D:\RealTeSa2025\public\VIDEO\`
  - ระบบจะสร้าง URL: `http://localhost:3000/VIDEO/{deviceId}_{timestamp}.mp4`
- ข้อมูลจะถูกบันทึกใน MongoDB collection `detections` พร้อม `imageUrl` และ `videoUrl`
- ระบบจะแสดงผลแบบ real-time บนแผนที่โดยไม่ต้อง refresh หน้าเว็บ
- วิดีโอจะแสดงใน popup พร้อม video player สามารถเล่นได้ทันที

---

## 5. ส่งข้อมูลแบบ Batch (หลายรายการ)

### รูปแบบข้อมูล - ส่งหลายประเภทพร้อมกัน
```json
[
  {
    "deviceId": "MYDRONE-TH-001",
    "latitude": 13.7563,
    "longitude": 100.5018,
    "altitude": 250,
    "type": "drone",
    "status": "active",
    "speed": 15.5,
    "heading": 90,
    "battery": 85,
    "time": 1763023846
  },
  {
    "deviceId": "TARGET-001",
    "latitude": 13.7420,
    "longitude": 100.5120,
    "altitude": 180,
    "type": "target",
    "detectedBy": "CAM-001",
    "confidence": 0.95,
    "time": 1763023846
  },
  {
    "deviceId": "CAM-001",
    "cameraId": "CAM-001",
    "latitude": 13.7500,
    "longitude": 100.5100,
    "altitude": 50,
    "type": "camera",
    "status": "active",
    "direction": 45,
    "fov": 110,
    "detectionRange": 550,
    "name": "กล้องหอสังเกตการณ์ 1",
    "time": 1763023846
  },
  {
    "cameraId": "CAM-001",
    "deviceId": "DETECTION-001",
    "targetId": "ENEMY-DRONE-001",
    "latitude": 13.7360,
    "longitude": 100.5230,
    "altitude": 150,
    "type": "detection",
    "confidence": 0.95,
    "description": "Detected enemy drone",
    "imageData": "base64_encoded_image_data...",
    "time": 1763023846
  }
]
```

### ตัวอย่างการส่ง Batch ด้วย Node.js
```javascript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:4002');

ws.on('open', () => {
  const batchData = [
    // โดรนฝ่ายเรา
    {
      deviceId: 'MYDRONE-TH-001',
      latitude: 13.7563,
      longitude: 100.5018,
      altitude: 250,
      type: 'drone',
      status: 'active',
      battery: 85,
      time: Math.floor(Date.now() / 1000)
    },
    // เป้าหมายฝั่งตรงข้าม
    {
      deviceId: 'TARGET-001',
      latitude: 13.7420,
      longitude: 100.5120,
      altitude: 180,
      type: 'target',
      detectedBy: 'CAM-001',
      time: Math.floor(Date.now() / 1000)
    },
    // กล้อง
    {
      deviceId: 'CAM-001',
      cameraId: 'CAM-001',
      latitude: 13.7500,
      longitude: 100.5100,
      altitude: 50,
      type: 'camera',
      status: 'active',
      direction: 45,
      fov: 110,
      detectionRange: 550,
      name: 'กล้องหอสังเกตการณ์ 1',
      time: Math.floor(Date.now() / 1000)
    },
    // Detection พร้อมรูปภาพ/วิดีโอ
    {
      cameraId: 'CAM-001',
      deviceId: 'DETECTION-001',
      targetId: 'ENEMY-DRONE-001',
      latitude: 13.7360,
      longitude: 100.5230,
      altitude: 150,
      type: 'detection',
      confidence: 0.95,
      imageData: 'base64_image_data...',
      videoData: 'base64_video_data...',
      time: Math.floor(Date.now() / 1000)
    }
  ];
  
  ws.send(JSON.stringify(batchData));
  console.log('✅ ส่งข้อมูล batch สำเร็จ:', batchData.length, 'รายการ');
});

ws.on('message', (data) => {
  console.log('📨 Response:', JSON.parse(data.toString()));
  ws.close();
});
```

### ตัวอย่างการส่ง Batch ด้วย Python
```python
import websocket
import json
import time

ws = websocket.create_connection('ws://localhost:4002')

batch_data = [
    # โดรนฝ่ายเรา
    {
        'deviceId': 'MYDRONE-TH-001',
        'latitude': 13.7563,
        'longitude': 100.5018,
        'altitude': 250,
        'type': 'drone',
        'status': 'active',
        'battery': 85,
        'time': int(time.time())
    },
    # เป้าหมายฝั่งตรงข้าม
    {
        'deviceId': 'TARGET-001',
        'latitude': 13.7420,
        'longitude': 100.5120,
        'altitude': 180,
        'type': 'target',
        'detectedBy': 'CAM-001',
        'time': int(time.time())
    },
    # กล้อง
    {
        'deviceId': 'CAM-001',
        'cameraId': 'CAM-001',
        'latitude': 13.7500,
        'longitude': 100.5100,
        'altitude': 50,
        'type': 'camera',
        'status': 'active',
        'direction': 45,
        'fov': 110,
        'detectionRange': 550,
        'name': 'กล้องหอสังเกตการณ์ 1',
        'time': int(time.time())
    }
]

ws.send(json.dumps(batch_data))
print(f'✅ ส่งข้อมูล batch สำเร็จ: {len(batch_data)} รายการ')

response = ws.recv()
print('📨 Response:', response)
ws.close()
```

**หมายเหตุ:**
- ระบบจะประมวลผลและแยกข้อมูลอัตโนมัติตามประเภท
- สามารถส่งผสมได้ทุกประเภท (โดรนเรา, ฝั่งตรงข้าม, กล้อง, detection)
- แนะนำไม่เกิน 100 รายการต่อ batch เพื่อประสิทธิภาพ
- ระบบจะแยกเก็บลง MongoDB ตาม collection ที่เหมาะสม

---

## Response Format

### Success Response
```json
{
  "type": "response",
  "status": "success",
  "message": "ได้รับและบันทึกข้อมูลเรียบร้อยแล้ว 1 รายการ (โดรนเรา: 0, ฝั่งตรงข้าม: 1, กล้อง: 0)"
}
```

### Error Response
```json
{
  "type": "response",
  "status": "error",
  "message": "เกิดข้อผิดพลาด: Invalid data format"
}
```

### Broadcast to Clients
```json
{
  "type": "newData",
  "data": [
    {
      "deviceId": "DRONE-TH-001",
      "cameraId": "CAM-001",
      "latitude": 13.7563,
      "longitude": 100.5018,
      "altitude": 250,
      "type": "drone",
      "timestamp": "2025-11-13T08:30:46.123Z",
      "imageUrl": "http://localhost:3000/IMG/TARGET-001_1763023846.jpg",
      "videoUrl": "http://localhost:3000/VIDEO/TARGET-001_1763023846.mp4",
      "_id": "6915..."
    }
  ]
}
```

---

## การทดสอบ

### 1. ตรวจสอบ WebSocket Server
```bash
cd D:\RealTeSa2025\src\api
npm run ws
```

### 2. ส่งข้อมูลทดสอบ
```bash
# โดรนฝ่ายเรา
node sendMyDroneData.js

# Detection พร้อมรูปภาพ
node testImageSend.js

# Detection พร้อมวิดีโอ
node testVideoSend.js <path-to-video-file>
# ตัวอย่าง: node testVideoSend.js "C:\Users\Username\Downloads\sample.mp4"
```

### 3. ตรวจสอบข้อมูลใน MongoDB
```bash
node checkDetections.js
```

### 4. เปิดหน้าเว็บ
- Main Dashboard: `http://localhost:5173/`
- Map View: `http://localhost:5173/map`
- Image Viewer: `http://localhost:5173/images`

---

## Error Codes

| Code | คำอธิบาย |
|------|----------|
| `MODULE_NOT_FOUND` | ไม่พบ module ที่ต้องการ (ติดตั้ง dependencies) |
| `ECONNREFUSED` | WebSocket server ไม่ทำงาน |
| `Invalid data format` | ข้อมูลไม่ถูกต้อง |
| `Missing required fields` | ขาด field ที่จำเป็น |

---

## Best Practices

1. **ใช้ Unix Timestamp:** ส่ง `time` เป็น Unix timestamp (วินาที)
2. **Validate Data:** ตรวจสอบข้อมูลก่อนส่ง
3. **Error Handling:** จัดการ error และ reconnection
4. **Image Size:** รูปภาพไม่ควรเกิน 5MB
5. **Batch Size:** ส่งข้อมูล batch ไม่เกิน 100 รายการต่อครั้ง
6. **Connection:** เปิด connection ใหม่สำหรับแต่ละ batch

---

## Support

หากมีปัญหาหรือข้อสงสัย:
- ตรวจสอบ log ที่ terminal
- ดู `IMAGE_UPLOAD_GUIDE.md` สำหรับการส่งรูปภาพ
- ดู `API_GUIDE.md` สำหรับ REST API endpoints
