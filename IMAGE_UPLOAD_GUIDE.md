# คู่มือการส่งรูปภาพผ่าน WebSocket

## การตั้งค่า

### 1. เชื่อมต่อ WebSocket
```javascript
const ws = new WebSocket('ws://192.168.1.102:4002');
// หรือ ws://localhost:4002 สำหรับทดสอบ
```

### 2. รูปแบบข้อมูลที่ส่ง

#### JSON Object ที่ต้องส่ง:
```json
{
  "deviceId": "TARGET-001",
  "cameraId": "CAM-001",
  "detectedBy": "CAM-001",
  "targetId": "DRONE-ENEMY-01",
  "latitude": 13.7563,
  "longitude": 100.5018,
  "altitude": 150,
  "type": "danger",
  "status": "active",
  "confidence": 0.95,
  "description": "ตรวจพบเป้าหมาย",
  "imageData": "BASE64_STRING_HERE",
  "time": 1234567890,
  "timestamp": "2025-11-13T10:30:00.000Z"
}
```

#### ฟิลด์สำคัญ:

**ข้อมูลพื้นฐาน:**
- `cameraId` (required) - ID ของกล้อง
- `deviceId` - ID ของอุปกรณ์
- `targetId` - ID ของเป้าหมาย

**ตำแหน่ง:**
- `latitude` (required) - ละติจูด
- `longitude` (required) - ลองจิจูด
- `altitude` - ความสูง (เมตร)

**รูปภาพ:**
- `imageData` (required for images) - Base64 encoded image
- `image` - ชื่อฟิลด์ทางเลือก
- `imageBase64` - ชื่อฟิลด์ทางเลือก

**ข้อมูลเพิ่มเติม:**
- `type` - ประเภท: "danger", "warning", "detection"
- `status` - สถานะ: "active", "inactive"
- `confidence` - ความแม่นยำ (0.0 - 1.0)
- `description` - คำอธิบาย

## วิธีการแปลงรูปเป็น Base64

### Python:
```python
import base64

def image_to_base64(image_path):
    with open(image_path, 'rb') as image_file:
        encoded = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded

# ใช้งาน
image_base64 = image_to_base64('path/to/image.jpg')
```

### Node.js:
```javascript
import fs from 'fs';

function imageToBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
}

// ใช้งาน
const imageBase64 = imageToBase64('path/to/image.jpg');
```

### JavaScript (Browser):
```javascript
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ใช้งาน
const base64 = await fileToBase64(imageFile);
```

## ตัวอย่างการส่งข้อมูล

### Python Example:
```python
import websocket
import json
import base64

# อ่านรูปภาพ
with open('detection.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# สร้างข้อมูล
data = {
    'cameraId': 'CAM-001',
    'deviceId': 'TARGET-001',
    'targetId': 'DRONE-ENEMY-01',
    'latitude': 13.7563,
    'longitude': 100.5018,
    'altitude': 150,
    'type': 'danger',
    'confidence': 0.95,
    'imageData': image_data
}

# ส่งข้อมูล
ws = websocket.create_connection('ws://192.168.1.102:4002')
ws.send(json.dumps(data))
response = ws.recv()
print(response)
ws.close()
```

### Node.js Example:
```javascript
import WebSocket from 'ws';
import fs from 'fs';

const ws = new WebSocket('ws://192.168.1.102:4002');

ws.on('open', () => {
    // อ่านรูปภาพ
    const imageBuffer = fs.readFileSync('detection.jpg');
    const imageBase64 = imageBuffer.toString('base64');
    
    // สร้างข้อมูล
    const data = {
        cameraId: 'CAM-001',
        deviceId: 'TARGET-001',
        targetId: 'DRONE-ENEMY-01',
        latitude: 13.7563,
        longitude: 100.5018,
        altitude: 150,
        type: 'danger',
        confidence: 0.95,
        imageData: imageBase64
    };
    
    // ส่งข้อมูล
    ws.send(JSON.stringify(data));
});

ws.on('message', (data) => {
    console.log('Response:', data.toString());
});
```

## การทดสอบ

### 1. รัน WebSocket Server:
```bash
cd src/api
npm run ws
```

### 2. ส่งข้อมูลทดสอบ:
```bash
node testImageSend.js
```

### 3. ตรวจสอบผลลัพธ์:
- รูปภาพจะถูกบันทึกที่: `D:\RealTeSa2025\public\IMG\`
- ข้อมูลจะถูกบันทึกใน MongoDB collection: `Detections`
- รูปจะแสดงบนแผนที่เมื่อคลิกที่ marker

## URL สำหรับเข้าถึงรูปภาพ

หลังจากบันทึกแล้ว รูปภาพจะสามารถเข้าถึงได้ที่:
```
http://localhost:3000/IMG/{filename}
```

ตัวอย่าง:
```
http://localhost:3000/IMG/CAM-001_1699876543210.jpg
```

## หมายเหตุ

1. **ขนาดไฟล์**: แนะนำให้บีบอัดรูปภาพก่อนส่ง (max ~2MB)
2. **รูปแบบที่รองรับ**: JPG, PNG, GIF
3. **Base64 Prefix**: ระบบจะลบ `data:image/...;base64,` prefix อัตโนมัติ
4. **การตั้งชื่อไฟล์**: `{deviceId}_{timestamp}.jpg`
5. **การ Cleanup**: ควรมีระบบลบรูปเก่าทิ้งเป็นระยะๆ

## Troubleshooting

### ปัญหา: ส่งรูปไม่ได้
- ตรวจสอบว่า WebSocket Server กำลังรันอยู่
- ตรวจสอบ IP address และ port
- ตรวจสอบว่าข้อมูล Base64 ถูกต้อง

### ปัญหา: รูปไม่แสดง
- ตรวจสอบว่าโฟลเดอร์ `public/IMG` มีสิทธิ์เขียน
- ตรวจสอบ URL path ว่าถูกต้อง
- ดูใน browser console หา error

### ปัญหา: รูปไม่บันทึก
- ตรวจสอบ Base64 string ว่าไม่มี whitespace
- ตรวจสอบขนาดไฟล์ไม่เกิน limit
- ดู server logs หา error message
