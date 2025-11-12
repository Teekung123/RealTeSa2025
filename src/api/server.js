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

// GET - ดึงข้อมูล target ทั้งหมด
app.get('/api/targets', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('merged_data_location');
    const targets = await collection.find({}).toArray();
    
    res.json({ 
      success: true, 
      count: targets.length,
      data: targets 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/MyDrone', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('merged_data_location');
    const drones = await collection.find({}).toArray();

    res.json({ 
      success: true, 
      count: drones.length,
      data: drones 
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