import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// ฟังก์ชันสุ่มเวลาภายใน 24 ชั่วโมงที่ผ่านมา
function randomRecentTime() {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * dayInMs);
}

// ฟังก์ชันสร้างข้อมูล detection
function generateDetections() {
  const cameras = ['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004', 'CAM-005', 'CAM-006', 'CAM-007', 'CAM-008'];
  const targets = ['TARGET-001', 'TARGET-002', 'TARGET-003', 'TARGET-004', 'DRONE-ENEMY-01', 'DRONE-ENEMY-02', 'UAV-UNKNOWN-01'];
  const types = ['danger', 'warning', 'detection'];
  const statuses = ['active', 'processed', 'archived'];
  
  // ตัวอย่าง URL ภาพ (สามารถแทนที่ด้วย URL จริงหรือ path ไปยังภาพใน server)
  const imageUrls = [
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2',
    'https://picsum.photos/800/600?random=3',
    'https://picsum.photos/800/600?random=4',
    'https://picsum.photos/800/600?random=5',
    'https://picsum.photos/800/600?random=6',
    'https://picsum.photos/800/600?random=7',
    'https://picsum.photos/800/600?random=8',
    'https://picsum.photos/800/600?random=9',
    'https://picsum.photos/800/600?random=10'
  ];

  const detections = [];

  // สร้าง 50 detections แบบสุ่ม
  for (let i = 0; i < 50; i++) {
    const cameraId = cameras[Math.floor(Math.random() * cameras.length)];
    const targetId = targets[Math.floor(Math.random() * targets.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // พิกัดในกรุงเทพและปริมณฑล (สุ่มรอบๆ)
    const baseLatitude = 13.7563;
    const baseLongitude = 100.5018;
    const latitude = baseLatitude + (Math.random() - 0.5) * 0.1; // ±0.05 องศา
    const longitude = baseLongitude + (Math.random() - 0.5) * 0.1;
    const altitude = Math.floor(Math.random() * 200) + 50; // 50-250 เมตร
    
    detections.push({
      cameraId,
      deviceId: cameraId,
      detectedDevice: targetId,
      targetId,
      latitude,
      longitude,
      altitude,
      type,
      status,
      confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
      imageUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)],
      description: `Detected ${targetId} by ${cameraId}`,
      timestamp: randomRecentTime(),
      time: Math.floor(Date.now() / 1000)
    });
  }

  return detections;
}

// ฟังก์ชันหลักสำหรับบันทึกข้อมูล
async function saveDetections() {
  try {
    console.log('📡 กำลังเชื่อมต่อ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');

    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('detections');

    // ลบข้อมูลเก่าทั้งหมด (optional)
    await collection.deleteMany({});
    console.log('🗑️ ลบข้อมูลเก่าทั้งหมดแล้ว');

    // สร้างข้อมูล detections
    const detections = generateDetections();
    
    console.log('📷 กำลังบันทึกข้อมูล detections:', detections.length, 'รายการ');
    
    // บันทึกลง MongoDB
    const result = await collection.insertMany(detections);
    console.log(`✅ บันทึกข้อมูล detections สำเร็จ: ${result.insertedCount} รายการ`);

    // แสดงตัวอย่างข้อมูลที่บันทึก
    const saved = await collection.find({}).limit(5).toArray();
    console.log('\n📋 ตัวอย่างข้อมูลที่บันทึก:');
    saved.forEach((det, idx) => {
      console.log(`\n   ${idx + 1}. ${det.cameraId} -> ${det.detectedDevice}`);
      console.log(`      📍 พิกัด: [${det.latitude.toFixed(4)}, ${det.longitude.toFixed(4)}]`);
      console.log(`      🎯 ประเภท: ${det.type}, สถานะ: ${det.status}`);
      console.log(`      📷 ภาพ: ${det.imageUrl}`);
      console.log(`      ⏰ เวลา: ${new Date(det.timestamp).toLocaleString('th-TH')}`);
    });

    console.log('\n✅ เสร็จสิ้น!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 ปิดการเชื่อมต่อ MongoDB แล้ว');
  }
}

// รัน
saveDetections();
