import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test script สำหรับส่งวิดีโอทาง WebSocket
 * วิธีใช้: node testVideoSend.js <path-to-video-file>
 */

// กำหนด path ของวิดีโอที่จะส่ง
const videoPath = process.argv[2] || 'C:\\Users\\Advice SB\\Downloads\\TESA 2025 Pre-Camp - Google Chrome 2025-10-18 09-12-47.mp4';

// ตรวจสอบว่าไฟล์มีอยู่จริง
if (!fs.existsSync(videoPath)) {
  console.error('❌ ไม่พบไฟล์วิดีโอที่:', videoPath);
  console.log('💡 วิธีใช้: node testVideoSend.js <path-to-video-file>');
  process.exit(1);
}

// อ่านไฟล์วิดีโอและแปลงเป็น base64
console.log('📂 กำลังอ่านวิดีโอจาก:', videoPath);
const videoBuffer = fs.readFileSync(videoPath);
const videoBase64 = videoBuffer.toString('base64');
const fileSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);

console.log(`✅ อ่านวิดีโอสำเร็จ (${fileSizeMB} MB)`);
console.log(`📦 ขนาด base64: ${(videoBase64.length / 1024 / 1024).toFixed(2)} MB`);

// เชื่อมต่อ WebSocket
const ws = new WebSocket('ws://localhost:4002');

ws.on('open', () => {
  console.log('🟢 เชื่อมต่อ WebSocket สำเร็จ');
  console.log('📤 กำลังส่งวิดีโอ...');
  
  // สร้างข้อมูล detection พร้อมวิดีโอ
  const detectionData = {
    cameraId: 'CAM-TEST-001',
    deviceId: 'TARGET-VIDEO-001',
    targetId: 'OPPONENT-VIDEO-001',
    latitude: 13.7563,
    longitude: 100.5018,
    altitude: 100,
    type: 'detection',
    confidence: 0.95,
    videoData: videoBase64,  // ส่งวิดีโอเป็น base64
    description: `Video detection from test camera (${fileSizeMB} MB)`,
    time: Math.floor(Date.now() / 1000)
  };
  
  ws.send(JSON.stringify(detectionData));
  console.log('✅ ส่งข้อมูลแล้ว');
});

ws.on('message', (data) => {
  console.log('📨 ได้รับ response:', data.toString());
  ws.close();
});

ws.on('error', (error) => {
  console.error('❌ WebSocket Error:', error);
});

ws.on('close', () => {
  console.log('🔴 ปิดการเชื่อมต่อ WebSocket');
});
