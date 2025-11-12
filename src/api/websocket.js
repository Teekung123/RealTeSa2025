import { WebSocketServer } from 'ws';
import { transformDataToEntries } from './utils/transform.js';

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
      const coll = getCollection();
      if (!coll) {
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

        // ใช้ฟังก์ชันแปลงข้อมูล
        const allEntries = transformDataToEntries(parsedData);

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

          // Broadcast ข้อมูลใหม่ไปยัง WebSocket Clients ทุกตัว
          wss.clients.forEach((client) => {
            if (client.readyState === 1) { // 1 = OPEN
              client.send(JSON.stringify({
                type: 'newData',
                data: allEntries
              }));
            }
          });

          // Cross-broadcast ไปยัง Socket.IO clients ด้วย
          if (socketIO) {
            socketIO.emit('newData', allEntries);
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
