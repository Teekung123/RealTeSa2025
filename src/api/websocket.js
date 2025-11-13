import { WebSocketServer } from 'ws';
import { transformDataToEntries } from './utils/transform.js';
import { transformDataToEntries2 } from './utils/Defform.js';

/**
 * ตั้งค่าและจัดการ WebSocket Server
 * @param {Number} port - Port สำหรับ WebSocket Server
 * @param {Function} getCollection - ฟังก์ชันสำหรับดึง collection
 * @param {Object} socketIO - Socket.IO instance สำหรับ cross-broadcast
 * @returns {Object} wss - WebSocket Server instance
 */
export function setupWebSocket(port, getCollection, socketIO) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    console.log('🟢 [WebSocket] Client เชื่อมต่อที่ port', port);

    // รับข้อมูลจาก WebSocket Client
    ws.on('message', async (message) => {
      const collections = getCollection();
      if (!collections || !collections.targetColl || !collections.cameraColl) {
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
        
        // แสดงข้อมูลกล้องที่ตรวจจับ (ถ้ามี)
        if (Array.isArray(parsedData)) {
          parsedData.forEach(d => {
            if (d.cameraId || d.detectedBy) {
              console.log(`📷 [WebSocket] ตรวจจับโดยกล้อง: ${d.cameraId || d.detectedBy} -> เป้าหมาย: ${d.deviceId || 'unknown'}`);
            }
          });
        } else if (parsedData.cameraId || parsedData.detectedBy) {
          console.log(`📷 [WebSocket] ตรวจจับโดยกล้อง: ${parsedData.cameraId || parsedData.detectedBy} -> เป้าหมาย: ${parsedData.deviceId || 'unknown'}`);
        }

        // ใช้ฟังก์ชันแปลงข้อมูล
        const { targets, cameras } = transformDataToEntries2(parsedData);

        // บันทึกข้อมูลลง MongoDB แยกตาม collection
        let totalSaved = 0;
        
        if (targets.length > 0) {
          await collections.targetColl.insertMany(targets);
          console.log("✅ [WebSocket] บันทึกข้อมูลเป้าหมาย:", targets.length, "จุด");
          totalSaved += targets.length;
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
            message: `ได้รับและบันทึกข้อมูลเรียบร้อยแล้ว ${totalSaved} รายการ (เป้าหมาย: ${targets.length}, กล้อง: ${cameras.length})`
          }));

          // Broadcast ข้อมูลใหม่ไปยัง WebSocket Clients ทุกตัว
          const allData = [...targets, ...cameras];
          if (allData.length > 0) {
            wss.clients.forEach((client) => {
              if (client.readyState === 1) { // 1 = OPEN
                client.send(JSON.stringify({
                  type: 'newData',
                  data: allData
                }));
              }
            });

            // Cross-broadcast ไปยัง Socket.IO clients ด้วย (ทั้ง targets และ cameras)
            if (socketIO) {
              console.log(`📡 [WebSocket] ส่งข้อมูลไปยัง Socket.IO (เป้าหมาย: ${targets.length}, กล้อง: ${cameras.length})`);
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
