import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  altitude: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['success', 'warning', 'danger'],
    default: 'success'
  },
  pointCount: {
    type: Number,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true // เพิ่ม createdAt, updatedAt อัตโนมัติ
});

// Index สำหรับค้นหาเรียงตามเวลา
alertSchema.index({ timestamp: -1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
