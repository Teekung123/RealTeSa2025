import { WebSocketServer } from 'ws';
import { transformDataToEntries } from './utils/transform.js';
import { transformDataToEntries2 } from './utils/Defform.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// สร้างโฟลเดอร์สำหรับเก็บรูปภาพ
const IMAGE_DIR = path.resolve(__dirname, '../../public/IMG');
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  console.log('📁 สร้างโฟลเดอร์:', IMAGE_DIR);
}

/**
 * บันทึกรูปภาพจาก base64
 * @param {String} base64Data - ข้อมูลรูปภาพ base64
 * @param {String} deviceId - ID ของอุปกรณ์
 * @returns {String} path ของไฟล์ที่บันทึก
 */
function saveImage(base64Data, deviceId) {
  try {
    // ลบ prefix data:image/...;base64, ออก (ถ้ามี)
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    // สร้างชื่อไฟล์ด้วย timestamp และ deviceId
    const timestamp = Date.now();
    const filename = `${deviceId}_${timestamp}.jpg`;
    const filepath = path.join(IMAGE_DIR, filename);
    
    // บันทึกไฟล์
    fs.writeFileSync(filepath, buffer);
    
    // return URL แบบเต็มสำหรับเข้าถึงจาก browser
    const imageUrl = `http://localhost:3000/IMG/${filename}`;
    console.log('✅ บันทึกรูปภาพ:', imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการบันทึกรูปภาพ:', error);
    return null;
  }
}

/**
 * ตั้งค่าและจัดการ WebSocket Server
 * @param {Number} port - Port สำหรับ WebSocket Server
 * @param {Function} getCollection - ฟังก์ชันสำหรับดึง collection
 * @param {Object} socketIO - Socket.IO instance สำหรับ cross-broadcast
 * @param {Object} mongooseInstance - Mongoose instance สำหรับเข้าถึง database
 * @returns {Object} wss - WebSocket Server instance
 */
export function setupWebSocket(port, getCollection, socketIO, mongooseInstance = null) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    console.log('🟢 [WebSocket] Client เชื่อมต่อที่ port', port);

    // รับข้อมูลจาก WebSocket Client
    ws.on('message', async (message) => {
      const collections = getCollection();
      if (!collections || !collections.myDroneColl || !collections.targetColl || !collections.cameraColl) {
        console.warn("⚠️ [WebSocket] DB not ready, ignoring data");
        return ws.send(JSON.stringify({
          type: 'response',
          status: 'error',
          message: 'Database ยังไม่พร้อม กรุณาลองใหม่อีกครั้ง'
        }));
      }

      try {
        const parsedData = JSON.parse(message.toString());
        console.log(`📦 [WebSocket] รับข้อมูล: ${Array.isArray(parsedData) ? "Array" : typeof parsedData}`);
        
        // ตรวจสอบว่ามีรูปภาพส่งมาด้วยหรือไม่
        let imageUrl = null;
        if (parsedData.imageData || parsedData.image || parsedData.imageBase64) {
          const imageData = parsedData.imageData || parsedData.image || parsedData.imageBase64;
          const deviceId = parsedData.deviceId || parsedData.cameraId || 'unknown';
          imageUrl = saveImage(imageData, deviceId);
          
          if (imageUrl) {
            // เพิ่ม imageUrl เข้าไปใน parsedData
            if (Array.isArray(parsedData)) {
              parsedData.forEach(item => {
                item.imageUrl = imageUrl;
              });
            } else {
              parsedData.imageUrl = imageUrl;
            }
          }
        }
        
        // แสดงข้อมูลกล้องที่ตรวจจับ (ถ้ามี)
        if (Array.isArray(parsedData)) {
          parsedData.forEach(d => {
            if (d.cameraId || d.detectedBy) {
              console.log(`📷 [WebSocket] ตรวจจับโดยกล้อง: ${d.cameraId || d.detectedBy} -> เป้าหมาย: ${d.deviceId || 'unknown'}${d.imageUrl ? ' (มีรูปภาพ)' : ''}`);
            }
          });
        } else if (parsedData.cameraId || parsedData.detectedBy) {
          console.log(`📷 [WebSocket] ตรวจจับโดยกล้อง: ${parsedData.cameraId || parsedData.detectedBy} -> เป้าหมาย: ${parsedData.deviceId || 'unknown'}${parsedData.imageUrl ? ' (มีรูปภาพ)' : ''}`);
        }
        
        // บันทึก detection ลง collection Detections (ถ้ามีรูปภาพ)
        if (imageUrl && (parsedData.cameraId || parsedData.detectedBy)) {
          try {
            // เข้าถึง database โดยตรงจาก collection ที่มีอยู่
            let detectionsCollection;
            if (mongooseInstance) {
              const db = mongooseInstance.connection.useDb('Wep_socket_DB');
              detectionsCollection = db.collection('Detections');
            } else if (collections.myDroneColl) {
              const db = collections.myDroneColl.db || collections.myDroneColl.collection?.conn?.db;
              detectionsCollection = db.collection('Detections');
            } else {
              throw new Error('ไม่สามารถเข้าถึง database');
            }
            
            const detectionRecord = {
              cameraId: parsedData.cameraId || parsedData.detectedBy || parsedData.deviceId,
              deviceId: parsedData.cameraId || parsedData.deviceId,
              detectedDevice: parsedData.deviceId || parsedData.targetId,
              targetId: parsedData.targetId || parsedData.deviceId,
              latitude: Array.isArray(parsedData.latitude) ? parsedData.latitude[0] : parsedData.latitude,
              longitude: Array.isArray(parsedData.longitude) ? parsedData.longitude[0] : parsedData.longitude,
              altitude: Array.isArray(parsedData.altitude) ? parsedData.altitude[0] : parsedData.altitude || 0,
              type: parsedData.type || 'detection',
              status: parsedData.status || 'active',
              confidence: parsedData.confidence || null,
              imageUrl: imageUrl,
              description: parsedData.description || `Detected by ${parsedData.cameraId || 'camera'}`,
              timestamp: new Date(),
              time: parsedData.time || Math.floor(Date.now() / 1000)
            };
            
            await detectionsCollection.insertOne(detectionRecord);
            console.log('✅ [WebSocket] บันทึก detection พร้อมรูปภาพสำเร็จ');
          } catch (detectionErr) {
            console.error('❌ [WebSocket] ไม่สามารถบันทึก detection:', detectionErr);
          }
        }

        // ใช้ฟังก์ชันแปลงข้อมูล
        const { myDrones, opponents, cameras } = transformDataToEntries2(parsedData);
        
        // เพิ่ม imageUrl เข้าไปใน opponents ถ้ามี
        if (imageUrl && opponents.length > 0) {
          opponents.forEach(opponent => {
            opponent.imageUrl = imageUrl;
          });
        }

        // บันทึกข้อมูลลง MongoDB แยกตาม collection
        let totalSaved = 0;
        
        if (myDrones.length > 0) {
          await collections.myDroneColl.insertMany(myDrones);
          console.log("✅ [WebSocket] บันทึกข้อมูลโดรนฝั่งเรา:", myDrones.length, "ตัว");
          totalSaved += myDrones.length;
        }
        
        if (opponents.length > 0) {
          await collections.targetColl.insertMany(opponents);
          console.log("✅ [WebSocket] บันทึกข้อมูลฝั่งตรงข้าม:", opponents.length, "จุด");
          totalSaved += opponents.length;
        }
        
        if (cameras.length > 0) {
          await collections.cameraColl.insertMany(cameras);
          console.log("✅ [WebSocket] บันทึกข้อมูลกล้อง:", cameras.length, "ตัว");
          totalSaved += cameras.length;
        }

        if (totalSaved > 0) {

          // ตอบกลับว่าบันทึกสำเร็จ
          ws.send(JSON.stringify({
            type: 'response',
            status: 'success',
            message: `ได้รับและบันทึกข้อมูลเรียบร้อยแล้ว ${totalSaved} รายการ (โดรนเรา: ${myDrones.length}, ฝั่งตรงข้าม: ${opponents.length}, กล้อง: ${cameras.length})`
          }));

          // Broadcast ข้อมูลใหม่ไปยัง WebSocket Clients ทุกตัว
          const allData = [...myDrones, ...opponents, ...cameras];
          if (allData.length > 0) {
            wss.clients.forEach((client) => {
              if (client.readyState === 1) { // 1 = OPEN
                client.send(JSON.stringify({
                  type: 'newData',
                  data: allData
                }));
              }
            });

            // Cross-broadcast ไปยัง Socket.IO clients ด้วย (ทั้ง myDrones, opponents และ cameras)
            if (socketIO) {
              console.log(`📡 [WebSocket] ส่งข้อมูลไปยัง Socket.IO (โดรนเรา: ${myDrones.length}, ฝั่งตรงข้าม: ${opponents.length}, กล้อง: ${cameras.length})`);
              socketIO.emit('newData', allData);
            }
          }

        } else {
          console.warn("⚠️ [WebSocket] ไม่มีข้อมูลที่ต้องบันทึก");
          ws.send(JSON.stringify({
            type: 'response',
            status: 'error',
            message: 'ไม่พบข้อมูลที่ถูกต้องสำหรับบันทึก (ตรวจสอบ position3D)'
          }));
        }

      } catch (err) {
        console.error("⚠️ [WebSocket] ข้อผิดพลาดขณะจัดการข้อความ:", err);
        ws.send(JSON.stringify({
          type: 'response',
          status: 'error',
          message: `เกิดข้อผิดพลาด: ${err.message}`
        }));
      }
    });

    ws.on('close', () => {
      console.log("🔴 [WebSocket] Client หลุดการเชื่อมต่อ");
    });

    ws.on('error', (error) => {
      console.error("⚠️ [WebSocket] Error:", error);
    });
  });

  console.log(`🚀 WebSocket Server กำลังทำงานที่ ws://localhost:${port}`);
  return wss;
}
