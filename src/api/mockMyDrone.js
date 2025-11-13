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
  const start = baseDate.getTime();           // หน่วยมิลลิวินาที
  const end = start + 60 * 60 * 1000;         // +1 ชั่วโมง
  const randomMs = Math.floor(Math.random() * (end - start) + start);
  return Math.floor(randomMs / 1000);         // ✅ แปลงเป็นวินาที
}

// ฟังก์ชันสร้างข้อมูลโดรนฝั่งเรา (My Drone) - สีเขียว
function generateMyDroneData(deviceId, type = "drone", count = 1) {
  const data = [];
  const baseLat = 13.7563; // ใกล้กรุงเทพ
  const baseLon = 100.5018;
  const baseTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    data.push({
      deviceId: deviceId,
      time: Math.floor((baseTime + (i * 10000)) / 1000), // ห่างกัน 10 วินาที (เป็นวินาที)
      latitude: baseLat + rand(-0.01, 0.01) + (i * 0.0008), // เคลื่อนที่เรียบ
      longitude: baseLon + rand(-0.01, 0.01) + (i * 0.0008),
      altitude: Math.floor(rand(200, 500)), // บินสูงกว่า
      type: type
    });
  }
  
  return data;
}

// ฟังก์ชันบันทึกข้อมูลลง MongoDB
async function saveToMongoDB(dataArray, collectionName = 'LogMy_data_location') {
  try {
    console.log('🔄 กำลังเชื่อมต่อ MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');
    
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const coll = db.collection(collectionName);
    
    console.log(`📝 กำลังบันทึกลง collection: ${collectionName}`);
    console.log(`📝 จำนวน: ${dataArray.length} รายการ...`);
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
async function generateMockMyDroneData() {
  console.log('🚁 === กำลังสร้างข้อมูลโดรนฝั่งเรา (My Drone - สีเขียว) ===\n');
  
  const mockData = [
    // โดรนฝั่งเรา - แบบจุดเดียว
    ...generateMyDroneData("MYDRONE-001", "drone", 1),
    ...generateMyDroneData("MYDRONE-002", "drone", 1),
    
    // โดรนฝั่งเรา - แบบเส้นทาง (ขยัน!)
    ...generateMyDroneData("MYDRONE-ALPHA", "drone", 25), // ขยันมาก!
    ...generateMyDroneData("MYDRONE-BETA", "drone", 20),
    ...generateMyDroneData("MYDRONE-CHARLIE", "drone", 15),
    
    // โดรนฝั่งเราที่หยุดปฏิบัติการแล้ว
    ...generateMyDroneData("MYDRONE-003", "success", 1),
  ];
  
  console.log(`📦 สร้างข้อมูลทั้งหมด: ${mockData.length} รายการ\n`);
  
  // บันทึกลง collection ของโดรนเรา
  await saveToMongoDB(mockData, 'LogMy_data_location');
}

// รันโปรแกรม
generateMockMyDroneData()
  .then(() => {
    console.log('\n✨ เสร็จสิ้น!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
