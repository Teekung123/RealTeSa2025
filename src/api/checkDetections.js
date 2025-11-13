import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDetections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');
    
    const db = mongoose.connection.useDb('Wep_socket_DB');
    const detectionsCollection = db.collection('detections');
    
    const detections = await detectionsCollection.find({}).sort({ timestamp: -1 }).limit(5).toArray();
    
    console.log('\n📊 Detections ล่าสุด 5 รายการ:');
    console.log('='.repeat(80));
    
    detections.forEach((det, idx) => {
      console.log(`\n${idx + 1}. Camera: ${det.cameraId}`);
      console.log(`   Target: ${det.detectedDevice || det.targetId}`);
      console.log(`   Location: [${det.latitude}, ${det.longitude}]`);
      console.log(`   Type: ${det.type}`);
      console.log(`   ImageURL: ${det.imageUrl}`);
      console.log(`   Timestamp: ${new Date(det.timestamp).toLocaleString('th-TH')}`);
    });
    
    if (detections.length === 0) {
      console.log('\n⚠️ ไม่มีข้อมูล detection ใน MongoDB');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkDetections();
