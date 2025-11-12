import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// โหลด environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI;

// เชื่อมต่อ MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');
  })
  .catch((err) => {
    console.error('❌ เชื่อมต่อ MongoDB ไม่สำเร็จ:', err);
    process.exit(1);
  });

// Middleware สำหรับ CORS
app.use(cors());

// Middleware สำหรับ parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ให้บริการ static files จากโฟลเดอร์ 'public'
app.use(express.static('public'));

// Route หลัก
app.get('/', (req, res) => {
  res.json({ 
    message: 'ยินดีต้อนรับสู่ Express Server!',
    status: 'success',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============ TARGET API Routes ============

// GET - ดึงข้อมูล target ทั้งหมด (ฝั่งตรงข้าม)
app.get('/api/targets', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('Log_data_location');
    const targets = await collection.find({
      deviceId: { $exists: true, $ne: null, $ne: 'undefined', $ne: 'unknown_device' },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).toArray();
    
    res.json({ 
      success: true, 
      count: targets.length,
      data: targets 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - ดึงข้อมูลโดรนฝั่งเรา
app.get('/api/MyDrone', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('LogMy_data_location');
    const drones = await collection.find({
      deviceId: { $exists: true, $ne: null, $ne: 'undefined', $ne: 'unknown_device' },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).toArray();

    res.json({ 
      success: true, 
      count: drones.length,
      data: drones 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============ ALERTS API Routes ============

// POST - บันทึก alert ใหม่
app.post('/api/alerts', async (req, res) => {
  try {
    const { deviceId, latitude, longitude, altitude, type, pointCount } = req.body;
    
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('Log_data_location');
    
    const alert = {
      deviceId,
      latitude,
      longitude,
      altitude: altitude || 0,
      type: type || 'success',
      pointCount: pointCount || 1,
      timestamp: new Date()
    };
    
    const result = await collection.insertOne(alert);
    
    res.json({ 
      success: true, 
      message: 'บันทึก alert สำเร็จ',
      data: { ...alert, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - ดึงประวัติ alerts เรียงจากใหม่ไปเก่า
app.get('/api/get/alerts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('Log_data_location');
    
    const alerts = await collection.find({
      deviceId: { $exists: true, $ne: null, $ne: 'undefined', $ne: 'unknown_device' }
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await collection.countDocuments({
      deviceId: { $exists: true, $ne: null, $ne: 'undefined', $ne: 'unknown_device' }
    });
    
    res.json({ 
      success: true, 
      count: alerts.length,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit),
      data: alerts 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route สำหรับจัดการ 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'ไม่พบหน้าที่ต้องการ',
    path: req.path 
  });
});

// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`🚀 REST API Server กำลังรันที่ http://localhost:${PORT}`);
});