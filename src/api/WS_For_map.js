import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from "socket.io"; // ใช้ Server จาก socket.io
import path from 'path';
import { fileURLToPath } from 'url';


// กำหนด __dirname สำหรับ ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// โหลด .env จาก root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = 4001;
const MONGODB_URI = process.env.MONGODB_URI;

// ------------------------------------
// 1. MongoDB Configuration
// ------------------------------------
let coll; // ประกาศตัวแปร Collection ไว้ข้างนอก
let dbReady = false;
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ!');
    // กำหนดค่าให้ coll เมื่อเชื่อมต่อสำเร็จ
    const db = mongoose.connection.useDb('Wep_socket_DB');
    coll = db.collection('merged_data_location');
    console.log("✅ Collection 'merged_data_location' is ready.");
    dbReady = true;
  })
  .catch((err) => {
    console.error('❌ เชื่อมต่อ MongoDB ไม่สำเร็จ:', err);
    process.exit(1); 
  });

// ------------------------------------
// 2. ตั้งค่า HTTP server และ Socket.IO
// ------------------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // อนุญาตเฉพาะจาก localhost:3000
    methods: ["GET", "POST"],
  },
});

// ------------------------------------
// 3. Socket.IO Connection Logic
// ------------------------------------
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  // ส่งข้อมูลทั้งหมดจาก MongoDB ให้ Client ที่เพิ่งเชื่อมเข้ามา
  (async () => {
    if (!coll) {
        console.warn("⚠️ DB Collection not ready, skipping initial data.");
        return socket.emit('error', { message: 'Database collection not ready yet.' });
    }
    try {
      const initialData = await coll.find().toArray();
      // ใช้ .emit() แทน .send() และไม่ต้อง stringify
      socket.emit('initialData', initialData); 
    } catch (err) {
      console.error("⚠️ เกิดข้อผิดพลาดขณะดึงข้อมูล:", err);
      socket.emit('error', { message: err.message });
    }
  })();

  // ----------------------------
  // 4. 💬 รับข้อความจาก Client (ใช้ Event ชื่อ 'sendData')
  // 'parsedData' คือข้อมูลที่ Client ส่งมา (Socket.IO แปลง JSON ให้แล้ว)
  // 'ackCallback' คือฟังก์ชันสำหรับส่งคำตอบกลับไปหา Client
  // ----------------------------
  socket.on('sendData', async (parsedData, ackCallback) => {
    if (!coll) {
        if (ackCallback) ackCallback({ status: "error", message: "DB not ready" });
        return;
    }
    
    try {
      let allEntries = [];
      // Socket.IO แปลง JSON ให้แล้ว ไม่ต้อง parse เอง
      console.log(`📦 ชนิดข้อมูลจาก Client: ${Array.isArray(parsedData) ? "Array" : typeof parsedData}`);
      
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

      // --- Logic การแปลงข้อมูล (เหมือนเดิมเป๊ะ) ---
      dataArray.forEach((d) => {
        const deviceId = d.deviceId || "unknown_device";
        const t = d.time || 0;
        const pos = d.position3D || [];
        const vel = d.velocity3D || [];
        const acc = d.acceleration3D || [];
        const pos2 = d.position2D || [];
        const vel2 = d.velocity2D || [];

        if (Array.isArray(pos[0])) { 
          pos.forEach((p, i) => {
            allEntries.push({
              deviceId,
              time: Array.isArray(t) ? t[i] : t + i,
              position3D: p,
              velocity3D: vel[i] || [0, 0, 0],
              acceleration3D: acc[i] || [0, 0, 0],
              position2D: pos2[i] || [0, 0],
              velocity2D: vel2[i] || [0, 0],
            });
          });
        } else if (pos.length > 0) { 
          allEntries.push({
            deviceId, time: t, position3D: pos, velocity3D: vel,
            acceleration3D: acc, position2D: pos2, velocity2D: vel2,
          });
        } else {
          console.warn("⚠️ ข้อมูลตำแหน่ง 3D ว่างเปล่า:", d);
        }
      });
      // --- สิ้นสุด Logic การแปลงข้อมูล ---


      // ✅ ตรวจสอบก่อน insert
      if (allEntries.length > 0) {
        await coll.insertMany(allEntries);
        console.log("✅ รวมข้อมูลทั้งหมด:", allEntries.length, "จุด");

        // ส่งข้อความตอบกลับไปยัง Client ที่ส่งข้อมูลมา (ผ่าน ack)
        if (ackCallback) ackCallback({
          status: "ok",
          message: `บันทึกข้อมูลสำเร็จ ${allEntries.length} จุด`,
        });

        // ----------------------------
        // 5. 📢 broadcast ให้ทุก client (Optimization!)
        // ----------------------------
        // ส่ง *เฉพาะข้อมูลใหม่* (allEntries) ไปให้ Client ทุกคน
        // Client จะได้รับ Event 'newData' แล้วเอาไปต่อใน Array ของตัวเอง
        io.emit('newData', allEntries); 
        // (วิธีเดิมของคุณคือ: 
        // const allData = await coll.find().toArray(); 
        // io.emit('updateData', allData); 
        // ซึ่งช้ากว่ามากถ้าข้อมูลเยอะ)

      } else {
        console.warn("⚠️ ไม่มีข้อมูลที่ต้องบันทึก (allEntries ว่าง)");
        if (ackCallback) ackCallback({
          status: "no_data",
          message: "ไม่มีข้อมูลที่บันทึก (ข้ามการ insert)",
        });
      }
      
    } catch (err) {
      console.error("⚠️ ข้อผิดพลาดขณะจัดการข้อความ:", err);
      if (ackCallback) ackCallback({ status: "error", message: err.message });
    }
  });

 
  // 6. เมื่อ Client หลุดออก
  socket.on('disconnect', () => {
    console.log("🔴 Client หลุดการเชื่อมต่อ:", socket.id);
  });
});





// ***************************************************************************************************
// WebSocket Server (Port 4002) - รับส่งข้อมูลเหมือน Socket.IO
// ***************************************************************************************************
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 4002 });

wss.on('connection', (ws) => {
  console.log('🟢 Client (WebSocket) เชื่อมต่อที่ port 4002');
  
  // รับข้อมูลจาก WebSocket Client
  ws.on('message', async (message) => {
    if (!coll) {
      console.warn("⚠️ [WebSocket] DB not ready, ignoring data");
      // ตอบกลับว่า DB ยังไม่พร้อม
      return ws.send(JSON.stringify({
        type: 'response',
        status: 'error',
        message: 'Database ยังไม่พร้อม กรุณาลองใหม่อีกครั้ง'
      }));
    }
    
    try {
      const parsedData = JSON.parse(message.toString());
      console.log(`📦 รับข้อมูลจาก WebSocket client: ${Array.isArray(parsedData) ? "Array" : typeof parsedData}`);
      
      let allEntries = [];
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

      // Logic การแปลงข้อมูล (เหมือน Socket.IO)
      dataArray.forEach((d) => {
        const deviceId = d.deviceId || "unknown_device";
        const t = d.time || 0;
        const pos = d.position3D || [];
        const vel = d.velocity3D || [];
        const acc = d.acceleration3D || [];
        const pos2 = d.position2D || [];
        const vel2 = d.velocity2D || [];

        if (Array.isArray(pos[0])) { 
          pos.forEach((p, i) => {
            allEntries.push({
              deviceId,
              time: Array.isArray(t) ? t[i] : t + i,
              position3D: p,
              velocity3D: vel[i] || [0, 0, 0],
              acceleration3D: acc[i] || [0, 0, 0],
              position2D: pos2[i] || [0, 0],
              velocity2D: vel2[i] || [0, 0],
            });
          });
        } else if (pos.length > 0) { 
          allEntries.push({
            deviceId, time: t, position3D: pos, velocity3D: vel,
            acceleration3D: acc, position2D: pos2, velocity2D: vel2,
          });
        } else {
          console.warn("⚠️ ข้อมูลตำแหน่ง 3D ว่างเปล่า (WS):", d);
        }
      });

      // บันทึกข้อมูลลง MongoDB
      if (allEntries.length > 0) {
        await coll.insertMany(allEntries);
        console.log("✅ [WebSocket] บันทึกข้อมูลสำเร็จ:", allEntries.length, "จุด");

        // ตอบกลับว่าบันทึกสำเร็จ
        ws.send(JSON.stringify({
          type: 'response',
          status: 'success',
          message: `ได้รับและบันทึกข้อมูลเรียบร้อยแล้ว ${allEntries.length} จุด`
        }));

        // Broadcast ข้อมูลใหม่ไปยัง Client ทุกตัว (WebSocket)
        wss.clients.forEach((client) => {
          if (client.readyState === 1) { // 1 = OPEN
            client.send(JSON.stringify({ 
              type: 'newData', 
              data: allEntries 
            }));
          }
        });

        // Broadcast ไปยัง Socket.IO clients ด้วย
        io.emit('newData', allEntries);

      } else {
        console.warn("⚠️ [WebSocket] ไม่มีข้อมูลที่ต้องบันทึก");
        // ตอบกลับว่าไม่มีข้อมูลที่ถูกต้อง
        ws.send(JSON.stringify({
          type: 'response',
          status: 'error',
          message: 'ไม่พบข้อมูลที่ถูกต้องสำหรับบันทึก (ตรวจสอบ position3D)'
        }));
      }
      
    } catch (err) {
      console.error("⚠️ ข้อผิดพลาดขณะจัดการข้อความ (WS):", err);
      // ตอบกลับว่าเกิดข้อผิดพลาด
      ws.send(JSON.stringify({
        type: 'response',
        status: 'error',
        message: `เกิดข้อผิดพลาด: ${err.message}`
      }));
    }
  });

  ws.on('close', () => {
    console.log("� WebSocket Client หลุดการเชื่อมต่อ");
  });

  ws.on('error', (error) => {
    console.error("⚠️ WebSocket Error:", error);
  });
});

console.log(`🚀 WebSocket Server (ws://) กำลังทำงานที่ ws://localhost:4002`);

// 7. เริ่มต้น Server
server.listen(PORT, () => {
  console.log(`🚀 Server (Socket.IO สำหรับ React) กำลังทำงานที่ http://localhost:${PORT}`);
});