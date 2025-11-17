import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// ฟังก์ชันสร้างเวลาแบบสุ่มระหว่าง 12:00-13:00
function randomTimeBetween12to13() {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // เริ่มต้นที่ 12:00:00
  const startTime = today.getTime() / 1000; // แปลงเป็นวินาที
  const endTime = startTime + 3600; // บวก 1 ชั่วโมง (3600 วินาที)
  return Math.floor(Math.random() * (endTime - startTime) + startTime);
}

// ฟังก์ชันสร้างข้อมูลกล้อง
function generateCameraData() {
  const cameras = [
    {
      cameraId: 'CAM-001',
      name: 'กล้องด่านหน้า',
      latitude: 13.7563,
      longitude: 100.5018,
      altitude: 50,
      direction: 45, // องศา (0-360)
      fov: 90, // Field of View (องศา)
      status: 'active',
      detectionRange: 500, // เมตร
      type: 'fixed'
    },
    {
      cameraId: 'CAM-002',
      name: 'กล้องด่านซ้าย',
      latitude: 13.7600,
      longitude: 100.4950,
      altitude: 45,
      direction: 90,
      fov: 120,
      status: 'active',
      detectionRange: 600,
      type: 'fixed'
    },
    {
      cameraId: 'CAM-003',
      name: 'กล้องด่านขวา',
      latitude: 13.7520,
      longitude: 100.5100,
      altitude: 40,
      direction: 270,
      fov: 90,
      status: 'active',
      detectionRange: 500,
      type: 'fixed'
    },
    {
      cameraId: 'CAM-004',
      name: 'กล้องด่านหลัง',
      latitude: 13.7500,
      longitude: 100.5000,
      altitude: 55,
      direction: 180,
      fov: 110,
      status: 'active',
      detectionRange: 700,
      type: 'fixed'
    },
    {
      cameraId: 'CAM-005',
      name: 'กล้องเคลื่อนที่ A',
      latitude: 13.7580,
      longitude: 100.5060,
      altitude: 35,
      direction: 135,
      fov: 360, // กล้อง 360 องศา
      status: 'active',
      detectionRange: 400,
      type: 'mobile'
    },
    {
      cameraId: 'CAM-006',
      name: 'กล้องสำรอง',
      latitude: 13.7540,
      longitude: 100.4980,
      altitude: 42,
      direction: 0,
      fov: 90,
      status: 'inactive',
      detectionRange: 500,
      type: 'fixed'
    }
  ];

  // เพิ่ม timestamp ให้ทุกกล้อง
  return cameras.map(camera => ({
    ...camera,
    time: randomTimeBetween12to13(),
    timestamp: new Date(),
    lastUpdate: new Date()
  }));
}

// ฟังก์ชันหลักสำหรับบันทึกข้อมูล
async function saveCameraData() {
  try {
    console.log('📡 กำลังเชื่อมต่อ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');

    const db = mongoose.connection.useDb('Wep_socket_DB');
    const collection = db.collection('cameras');

    // ลบข้อมูลเก่าทั้งหมด (optional - ถ้าต้องการ reset)
    await collection.deleteMany({});
    console.log('🗑️ ลบข้อมูลเก่าทั้งหมดแล้ว');

    // สร้างข้อมูลกล้อง
    const cameraData = generateCameraData();
    
    console.log('📷 กำลังบันทึกข้อมูลกล้อง:', cameraData.length, 'ตัว');
    console.log('📋 รายละเอียด:');
    cameraData.forEach(cam => {
      console.log(`   - ${cam.cameraId} (${cam.name}): [${cam.latitude}, ${cam.longitude}] status=${cam.status}`);
    });

    // บันทึกลง MongoDB
    const result = await collection.insertMany(cameraData);
    console.log(`✅ บันทึกข้อมูลกล้องสำเร็จ: ${result.insertedCount} ตัว`);

    // แสดงข้อมูลที่บันทึก
    const saved = await collection.find({}).toArray();
    console.log('📊 ข้อมูลในฐานข้อมูล:', saved.length, 'รายการ');

    await mongoose.connection.close();
    console.log('👋 ปิดการเชื่อมต่อ MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  }
}

// รัน
saveCameraData();
