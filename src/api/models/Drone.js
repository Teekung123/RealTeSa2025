import mongoose from 'mongoose';

/**
 * Drone Model - สำหรับจัดการข้อมูลโดรนในระบบ
 * 
 * ใช้เมื่อต้องการ:
 * - สร้าง/แก้ไข/ลบข้อมูลโดรนใหม่
 * - Validate ข้อมูลก่อนบันทึกลง MongoDB
 * - Query ข้อมูลโดรนพร้อม geospatial search (ค้นหาตามระยะทาง/พื้นที่)
 * 
 * ตัวอย่างการใช้งาน:
 * - const drone = new Drone({ id: 'DRONE-001', name: 'Alpha', ... });
 * - await drone.save();
 * - const drones = await Drone.find({ status: 'active' });
 * - const nearbyDrones = await Drone.find({ location: { $near: { ... } } });
 */

const droneSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true  // รหัสโดรนต้องไม่ซ้ำ
  },
  name: {
    type: String,
    required: true  // ชื่อโดรนต้องมี
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],  // สถานะที่อนุญาต
    default: 'inactive'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],  // GeoJSON type สำหรับจุดพิกัด
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude] - ลองจิจูด, ละติจูด
      required: true
    }
  },
  battery: {
    type: Number,
    min: 0,
    max: 100,  // แบตเตอรี่ 0-100%
    default: 100
  },
  altitude: {
    type: Number,
    default: 0  // ความสูง (เมตร)
  },
  speed: {
    type: Number,
    default: 0  // ความเร็ว (km/h)
  },
  lastUpdate: {
    type: Date,
    default: Date.now  // เวลาอัปเดตล่าสุด
  }
}, {
  timestamps: true  // สร้าง createdAt และ updatedAt อัตโนมัติ
});

// สร้าง geospatial index สำหรับ query ตามตำแหน่ง
// เช่น หาโดรนที่อยู่ใกล้จุดที่กำหนด หรือโดรนในพื้นที่
droneSchema.index({ location: '2dsphere' });

const Drone = mongoose.model('Drone', droneSchema);

export default Drone;
