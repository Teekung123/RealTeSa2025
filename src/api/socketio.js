import { Server } from "socket.io";
import { transformDataToEntries } from './utils/transform.js';
import { transformDataToEntries2 } from './utils/Defform.js';

/**
 * ตั้งค่าและจัดการ Socket.IO Server
 * @param {Object} server - HTTP Server instance
 * @param {Object} coll - MongoDB Collection
 * @param {Function} getCollection - ฟังก์ชันสำหรับดึง collection
 * @returns {Object} io - Socket.IO instance
 */
export function setupSocketIO(server, getCollection) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 [Socket.IO] Client connected:', socket.id);

    // ส่งข้อมูลเริ่มต้นจาก MongoDB ให้ Client ที่เพิ่งเชื่อมเข้ามา
    (async () => {
      const coll = getCollection();
      if (!coll) {
        console.warn("⚠️ [Socket.IO] DB Collection not ready, skipping initial data.");
        return socket.emit('error', { message: 'Database collection not ready yet.' });
      }
      try {
        const initialData = await coll.find().toArray();
        // socket.emit('initialData', initialData);
        console.log(`📤 [Socket.IO] ส่งข้อมูลเริ่มต้น ${initialData.length} รายการ`);
      } catch (err) {
        console.error("⚠️ [Socket.IO] เกิดข้อผิดพลาดขณะดึงข้อมูล:", err);
        socket.emit('error', { message: err.message });
      }
    })();

    // รับข้อมูลจาก Client ผ่าน event 'sendData'
    socket.on('sendData', async (parsedData, ackCallback) => {
      const coll = getCollection();
      if (!coll) {
        if (ackCallback) ackCallback({ status: "error", message: "DB not ready" });
        return;
      }

      try {
        console.log(`📦 [Socket.IO] ชนิดข้อมูลจาก Client: ${Array.isArray(parsedData) ? "Array" : typeof parsedData}`);

        // ใช้ฟังก์ชันแปลงข้อมูล
        const allEntries = transformDataToEntries2(parsedData);

        // บันทึกข้อมูลลง MongoDB
        if (allEntries.length > 0) {
          await coll.insertMany(allEntries);
          console.log("✅ [Socket.IO] บันทึกข้อมูลสำเร็จ:", allEntries.length, "จุด");

          // ส่งข้อความตอบกลับไปยัง Client ที่ส่งข้อมูลมา
          if (ackCallback) {
            ackCallback({
              status: "ok",
              message: `บันทึกข้อมูลสำเร็จ ${allEntries.length} จุด`,
            });
          }

          // Broadcast ข้อมูลใหม่ไปให้ Client ทุกคน
          io.emit('newData', allEntries);

        } else {
          console.warn("⚠️ [Socket.IO] ไม่มีข้อมูลที่ต้องบันทึก");
          if (ackCallback) {
            ackCallback({
              status: "no_data",
              message: "ไม่มีข้อมูลที่บันทึก (ข้ามการ insert)",
            });
          }
        }

      } catch (err) {
        console.error("⚠️ [Socket.IO] ข้อผิดพลาดขณะจัดการข้อความ:", err);
        if (ackCallback) ackCallback({ status: "error", message: err.message });
      }
    });

    // เมื่อ Client หลุดออก
    socket.on('disconnect', () => {
      console.log("🔴 [Socket.IO] Client หลุดการเชื่อมต่อ:", socket.id);
    });
  });

  return io;
}
