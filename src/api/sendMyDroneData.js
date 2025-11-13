import WebSocket from 'ws';

// เชื่อมต่อไปยัง WebSocket server
const ws = new WebSocket('ws://localhost:4002');

ws.on('open', () => {
  console.log('✅ เชื่อมต่อ WebSocket server สำเร็จ');
  
  // ข้อมูลโดรนฝ่ายเรา
  const myDroneData = {
    deviceId: 'DRONE-TH-001',  // ID โดรนฝ่ายเรา
    latitude: 13.7563,
    longitude: 100.5018,
    altitude: 250,
    type: 'drone',              // ระบุว่าเป็น drone
    status: 'active',
    speed: 15.5,
    heading: 90,
    battery: 85,
    mission: 'patrol',
    time: Math.floor(Date.now() / 1000)
  };
  
  console.log('📤 ส่งข้อมูลโดรนฝ่ายเรา:', myDroneData.deviceId);
  ws.send(JSON.stringify(myDroneData));
  
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
