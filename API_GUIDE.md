# MongoDB API Documentation

## การตั้งค่า

1. **ติดตั้ง MongoDB** (เลือก 1 วิธี)
   - **Local**: ติดตั้ง MongoDB Community Server จาก https://www.mongodb.com/try/download/community
   - **Cloud**: สร้าง cluster ฟรีที่ https://www.mongodb.com/cloud/atlas

2. **ตั้งค่า Environment Variables**
   - คัดลอก `.env.example` เป็น `.env`
   - แก้ไข `MONGODB_URI` ตามการตั้งค่าของคุณ

3. **รัน Server**
   ```bash
   npm start
   ```

## API Endpoints

### Drone APIs

#### ดึงข้อมูลโดรนทั้งหมด
```
GET /api/drones
```

#### ดึงข้อมูลโดรนตัวเดียว
```
GET /api/drones/:id
```

#### สร้างโดรนใหม่
```
POST /api/drones
Content-Type: application/json

{
  "id": "DRONE-001",
  "name": "Alpha Drone",
  "status": "active",
  "location": {
    "type": "Point",
    "coordinates": [100.5018, 13.7563]
  },
  "battery": 85,
  "altitude": 120,
  "speed": 25
}
```

#### อัปเดตข้อมูลโดรน
```
PUT /api/drones/:id
Content-Type: application/json

{
  "status": "inactive",
  "battery": 45,
  "location": {
    "coordinates": [100.5050, 13.7580]
  }
}
```

#### ลบโดรน
```
DELETE /api/drones/:id
```

### Target APIs

#### ดึงข้อมูล target ทั้งหมด
```
GET /api/targets
```

#### สร้าง target ใหม่
```
POST /api/targets
Content-Type: application/json

{
  "id": "TGT-001",
  "name": "Target Alpha",
  "type": "person",
  "status": "tracking",
  "location": {
    "type": "Point",
    "coordinates": [100.508, 13.757]
  },
  "description": "Person of interest"
}
```

#### อัปเดตข้อมูล target
```
PUT /api/targets/:id
Content-Type: application/json

{
  "status": "identified",
  "location": {
    "coordinates": [100.509, 13.758]
  }
}
```

## Data Models

### Drone Model
```javascript
{
  id: String,              // รหัสโดรน (unique)
  name: String,            // ชื่อโดรน
  status: String,          // 'active' | 'inactive' | 'maintenance'
  location: {
    type: 'Point',
    coordinates: [lng, lat] // [ลองจิจูด, ละติจูด]
  },
  battery: Number,         // 0-100
  altitude: Number,        // ความสูง (เมตร)
  speed: Number,           // ความเร็ว (km/h)
  lastUpdate: Date
}
```

### Target Model
```javascript
{
  id: String,              // รหัส target (unique)
  name: String,            // ชื่อ target
  type: String,            // 'person' | 'vehicle' | 'object' | 'area'
  status: String,          // 'tracking' | 'lost' | 'identified'
  location: {
    type: 'Point',
    coordinates: [lng, lat]
  },
  description: String,
  imageUrl: String,
  lastSeen: Date
}
```

## ตัวอย่างการใช้งานใน React

```javascript
import axios from 'axios';

// ดึงข้อมูลโดรนทั้งหมด
const getDrones = async () => {
  const response = await axios.get('http://localhost:3000/api/drones');
  console.log(response.data);
};

// สร้างโดรนใหม่
const createDrone = async () => {
  const drone = {
    id: 'DRONE-ALPHA',
    name: 'Alpha Drone',
    status: 'active',
    location: {
      type: 'Point',
      coordinates: [100.5018, 13.7563]
    },
    battery: 100
  };
  
  const response = await axios.post('http://localhost:3000/api/drones', drone);
  console.log(response.data);
};

// อัปเดตตำแหน่งโดรน
const updateDroneLocation = async (droneId, lng, lat) => {
  const response = await axios.put(`http://localhost:3000/api/drones/${droneId}`, {
    location: {
      coordinates: [lng, lat]
    }
  });
  console.log(response.data);
};
```
