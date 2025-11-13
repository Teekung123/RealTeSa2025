import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Script สำหรับดึงข้อมูล opponents แล้วสร้างสำเนาใหม่โดยเปลี่ยน deviceId
 */
async function duplicateOpponent() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    const db = mongoose.connection.useDb('Wep_socket_DB');
    const opponentsCollection = db.collection('opponents');

    // ดึงข้อมูล opponent ทั้งหมดที่มี deviceId = "device-001"
    const originalData = await opponentsCollection.find({
      deviceId: 'device-001'
    }).toArray();

    console.log(`📦 พบข้อมูล device-001: ${originalData.length} รายการ`);

    if (originalData.length === 0) {
      console.log('⚠️ ไม่พบข้อมูล device-001 ใน opponents collection');
      await mongoose.disconnect();
      return;
    }

    // สร้างข้อมูลใหม่โดยเปลี่ยน deviceId เป็น device-002 และปรับ lat/lng
    const newData = originalData.map(item => {
      const { _id, ...rest } = item; // ลบ _id เดิมออก
      return {
        ...rest,
        deviceId: 'device-002',
        latitude: item.latitude + 0.1,   // เพิ่ม latitude 0.1
        longitude: item.longitude + 0.1, // เพิ่ม longitude 0.1
        timestamp: new Date() // อัปเดต timestamp ใหม่
      };
    });

    // เพิ่มข้อมูลใหม่เข้า collection
    const result = await opponentsCollection.insertMany(newData);
    
    console.log(`✅ สร้างข้อมูล device-002 สำเร็จ: ${result.insertedCount} รายการ`);
    console.log(`📊 ข้อมูลใหม่:`);
    newData.slice(0, 3).forEach((item, idx) => {
      console.log(`  ${idx + 1}. deviceId: ${item.deviceId}, lat: ${item.latitude}, lng: ${item.longitude}`);
    });
    if (newData.length > 3) {
      console.log(`  ... และอีก ${newData.length - 3} รายการ`);
    }

    await mongoose.disconnect();
    console.log('✅ ปิดการเชื่อมต่อ MongoDB');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// รันสคริปต์
duplicateOpponent();
