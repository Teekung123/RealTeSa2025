import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketIO } from './socketio.js';
import { setupWebSocket } from './websocket.js';

// กำหนด __dirname สำหรับ ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// โหลด .env จาก root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const SOCKETIO_PORT = 4001;
const WEBSOCKET_PORT = 4002;
const MONGODB_URI = process.env.MONGODB_URI;

// ------------------------------------
// MongoDB Configuration
// ------------------------------------
let coll = null;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ! (WebSocket Server)');
    const db = mongoose.connection.useDb('Wep_socket_DB');
    coll = db.collection('Log_data_location');
    console.log("✅ Collection 'Log_data_location' is ready.");
  })
  .catch((err) => {
    console.error('❌ เชื่อมต่อ MongoDB ไม่สำเร็จ:', err);
    process.exit(1);
  });

// ฟังก์ชันสำหรับดึง collection
const getCollection = () => coll;

// ------------------------------------
// ตั้งค่า HTTP Server และ Socket.IO
// ------------------------------------
const server = http.createServer(app);
const io = setupSocketIO(server, getCollection);

// ------------------------------------
// ตั้งค่า WebSocket Server
// ------------------------------------
const wss = setupWebSocket(WEBSOCKET_PORT, getCollection, io);

// ------------------------------------
// เริ่มต้น Server
// ------------------------------------
server.listen(SOCKETIO_PORT, () => {
  console.log(`🚀 Socket.IO Server กำลังทำงานที่ http://localhost:${SOCKETIO_PORT}`);
});
