import mongoose from 'mongoose';

/**
 * Target Model - สำหรับจัดการข้อมูลเป้าหมาย/วัตถุที่ติดตาม
 * 
 * ใช้เมื่อต้องการ:
 * - สร้าง/แก้ไข/ลบข้อมูลเป้าหมายที่โดรนติดตาม
 * - Validate ข้อมูลก่อนบันทึกลง MongoDB
 * - Query ข้อมูล target พร้อม geospatial search
 * 
 * ตัวอย่างการใช้งาน:
 * - const target = new Target({ id: 'TGT-001', name: 'Target Alpha', type: 'person', ... });
 * - await target.save();
 * - const targets = await Target.find({ status: 'tracking' });
 * - const nearbyTargets = await Target.find({ location: { $near: { ... } } });
 */

const targetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true  // รหัส target ต้องไม่ซ้ำ
  },
  name: {
    type: String,
    required: true  // ชื่อ target ต้องมี
  },
  type: {
    type: String,
    enum: ['person', 'vehicle', 'object', 'area'],  // ประเภทเป้าหมาย
    default: 'person'
  },
  status: {
    type: String,
    enum: ['tracking', 'lost', 'identified'],  // สถานะการติดตาม
    default: 'tracking'
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
  description: String,  // รายละเอียดเพิ่มเติม
  imageUrl: String,  // URL รูปภาพของ target
  lastSeen: {
    type: Date,
    default: Date.now  // เวลาที่พบเห็นล่าสุด
  }
}, {
  timestamps: true  // สร้าง createdAt และ updatedAt อัตโนมัติ
});

// สร้าง geospatial index สำหรับ query ตามตำแหน่ง
// เช่น หา target ที่อยู่ใกล้จุดที่กำหนด หรือ target ในพื้นที่
targetSchema.index({ location: '2dsphere' });

const Target = mongoose.model('Target', targetSchema);

export default Target;
