import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// ฟังก์ชันช่วย: สุ่มค่าระหว่าง min - max
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// ฟังก์ชันช่วย: สร้าง timestamp ในช่วง 12:00 - 13:00 วันนี้
function randomTimeBetween12to13() {
  const baseDate = new Date(); // วันนี้
  baseDate.setHours(12, 0, 0, 0);
  const start = baseDate.getTime();
  const end = start + 60 * 60 * 1000; // +1 ชั่วโมง
  return Math.floor(rand(start, end) / 1000); // แปลงเป็น seconds (Unix)
}

// ฟังก์ชันสร้างข้อมูลโดรนฝั่งตรงข้าม (Opponent)
function generateOpponentData(deviceId, type = "danger", count = 1) {
  const data = [];
  const baseLat = 13.736;
  const baseLon = 100.523;
  const baseTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    data.push({
      deviceId: deviceId,
      time: Math.floor((baseTime + (i * 10000)) / 1000), // ห่างกัน 10 วินาที
      latitude: baseLat + rand(-0.01, 0.01) + (i * 0.001),
      longitude: baseLon + rand(-0.01, 0.01) + (i * 0.001),
      altitude: Math.floor(rand(150, 400)),
      type: type
    });
  }
  
  return data;
}

// ฟังก์ชันบันทึกข้อมูลลง MongoDB
async function saveToMongoDB(dataArray) {
  try {
    console.log('🔄 กำลังเชื่อมต่อ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');
    
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const coll = db.collection('Log_data_location');
    
    console.log(`📝 กำลังบันทึก ${dataArray.length} รายการ...`);
    const result = await coll.insertMany(dataArray);
    
    console.log(`✅ บันทึกสำเร็จ ${result.insertedCount} รายการ`);
    console.log('📊 ข้อมูลที่บันทึก:');
    dataArray.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.deviceId} [${item.type}] at (${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}) alt: ${item.altitude}m`);
    });
    
    await mongoose.connection.close();
    console.log('🔒 ปิดการเชื่อมต่อ MongoDB');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    process.exit(1);
  }
}

// สร้างข้อมูลจำลอง
async function generateMockOpponentData() {
  console.log('🎯 === กำลังสร้างข้อมูลฝั่งตรงข้าม (Opponent) ===\n');
  
  const mockData = [
    // ฝั่งตรงข้าม - แบบจุดเดียว
    ...generateOpponentData("OPPONENT-001", "danger", 20),
    ...generateOpponentData("OPPONENT-002", "warning", 30),
    ...generateOpponentData("OPPONENT-003", "danger", 50),
    
    // ฝั่งตรงข้ามที่ resolve แล้ว
    ...generateOpponentData("OPPONENT-004", "success", 1),
  ];
  
  console.log(`📦 สร้างข้อมูลทั้งหมด: ${mockData.length} รายการ\n`);
  
  await saveToMongoDB(mockData);
}

// รันโปรแกรม
generateMockOpponentData()
  .then(() => {
    console.log('\n✨ เสร็จสิ้น!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
