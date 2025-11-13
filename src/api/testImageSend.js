import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// เชื่อมต่อไปยัง WebSocket server
const ws = new WebSocket('ws://localhost:4002');

ws.on('open', () => {
  console.log('✅ เชื่อมต่อ WebSocket server สำเร็จ');
  
  // อ่านรูปภาพจากไฟล์
//   const imagePath = path.join(__dirname, 'vite.svg'); 
  const imagePath = 'C:\\Users\\Advice SB\\Downloads\\industries-defense-readiness-mts-1.png';
  if (!fs.existsSync(imagePath)) {
    console.error('❌ ไม่พบไฟล์รูปภาพ:', imagePath);
    ws.close();
    return;
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  // สร้างข้อมูล detection พร้อมรูปภาพ
  const detectionData = {
    cameraId: 'TARGET-TEST-01', // เพิ่ม cameraId
    deviceId: 'TARGET-TEST-01',
    targetId: 'ENEMY-DRONE-001',
    latitude: 13.736717,
    longitude: 100.523186,
    altitude: 150,
    type: 'detection',
    status: 'active',
    confidence: 0.95,
    description: 'Test detection with image',
    imageData: base64Image,
    time: Math.floor(Date.now() / 1000)
  };
  
  console.log('📤 ส่งข้อมูล detection (cameraId:', detectionData.cameraId, ')');
  ws.send(JSON.stringify(detectionData));
  
  // ปิดการเชื่อมต่อหลังส่งข้อมูล
  setTimeout(() => {
    console.log('👋 ปิดการเชื่อมต่อ');
    ws.close();
  }, 1000);
});

ws.on('message', (data) => {
  console.log('📩 ได้รับข้อมูลตอบกลับ:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ เกิดข้อผิดพลาด:', error.message);
});

ws.on('close', () => {
  console.log('🔌 ยกเลิกการเชื่อมต่อ WebSocket');
});