/**
 * ฟังก์ชันสำหรับจำลองข้อมูลทดสอบ
 * ใช้สำหรับทดสอบระบบโดยไม่ต้องมีข้อมูลจริง
 */

/**
 * สร้างข้อมูลจุดเดียว (Single Point)
 */
export function generateSinglePoint(deviceId, type = "drone") {
  return {
    deviceId: deviceId || "DRONE-001",
    time: Date.now(),
    latitude: 13.7563 + (Math.random() - 0.5) * 0.1, // รอบๆ กรุงเทพ
    longitude: 100.5018 + (Math.random() - 0.5) * 0.1,
    altitude: Math.floor(Math.random() * 500) + 100, // 100-600 เมตร
    type: type
  };
}

/**
 * สร้างข้อมูลหลายจุด (Multiple Points) - Array
 */
export function generateMultiplePoints(deviceId, pointCount = 10, type = "drone") {
  const startLat = 13.7563;
  const startLon = 100.5018;
  const startTime = Date.now();
  
  const latitudes = [];
  const longitudes = [];
  const altitudes = [];
  const times = [];
  
  for (let i = 0; i < pointCount; i++) {
    // สร้างเส้นทางเคลื่อนที่แบบสุ่ม
    latitudes.push(startLat + (Math.random() - 0.5) * 0.05 + (i * 0.001));
    longitudes.push(startLon + (Math.random() - 0.5) * 0.05 + (i * 0.001));
    altitudes.push(Math.floor(Math.random() * 500) + 100);
    times.push(startTime + (i * 10000)); // ห่างกัน 10 วินาที
  }
  
  return {
    deviceId: deviceId || "DRONE-MULTI",
    time: times,
    latitude: latitudes,
    longitude: longitudes,
    altitude: altitudes,
    type: type
  };
}

/**
 * สร้างข้อมูล Alert แบบจุดเดียว
 */
export function generateAlertPoint(deviceId, alertType = "danger") {
  return {
    deviceId: deviceId || "TARGET-001",
    time: Date.now(),
    latitude: 13.7563 + (Math.random() - 0.5) * 0.08,
    longitude: 100.5018 + (Math.random() - 0.5) * 0.08,
    altitude: Math.floor(Math.random() * 300) + 50,
    type: alertType, // "danger", "warning", "success"
    pointCount: 1
  };
}

/**
 * สร้างข้อมูล Alert แบบหลายจุด (เส้นทางการเคลื่อนที่)
 */
export function generateAlertPath(deviceId, pointCount = 5, alertType = "danger") {
  const startLat = 13.7563 + (Math.random() - 0.5) * 0.05;
  const startLon = 100.5018 + (Math.random() - 0.5) * 0.05;
  const startTime = Date.now();
  
  const latitudes = [];
  const longitudes = [];
  const altitudes = [];
  const times = [];
  
  for (let i = 0; i < pointCount; i++) {
    // สร้างเส้นทางเคลื่อนที่แบบต่อเนื่อง
    latitudes.push(startLat + (i * 0.002) + (Math.random() - 0.5) * 0.001);
    longitudes.push(startLon + (i * 0.002) + (Math.random() - 0.5) * 0.001);
    altitudes.push(Math.floor(Math.random() * 200) + 50);
    times.push(startTime + (i * 15000)); // ห่างกัน 15 วินาที
  }
  
  return {
    deviceId: deviceId || "TARGET-MOVING",
    time: times,
    latitude: latitudes,
    longitude: longitudes,
    altitude: altitudes,
    type: alertType,
    pointCount: pointCount
  };
}

/**
 * สร้างข้อมูลทดสอบแบบสมบูรณ์ (Mixed Data)
 */
export function generateMockDataSet() {
  return [
    // โดรนของเรา (สีเขียว)
    generateMultiplePoints("DRONE-ALPHA", 15, "drone"),
    generateMultiplePoints("DRONE-BETA", 12, "drone"),
    generateSinglePoint("DRONE-CHARLIE", "drone"),
    
    // Target/Alert (สีแดง)
    generateAlertPoint("TARGET-001", "danger"),
    generateAlertPoint("TARGET-002", "warning"),
    generateAlertPath("TARGET-MOVING-01", 8, "danger"),
    generateAlertPath("TARGET-MOVING-02", 6, "warning"),
    
    // ข้อมูลที่ resolve แล้ว
    generateAlertPoint("TARGET-003", "success")
  ];
}

/**
 * สร้างข้อมูลแบบสุ่มต่อเนื่อง (Streaming)
 */
export function generateStreamingData(deviceId, type = "drone") {
  const data = generateSinglePoint(deviceId, type);
  return data;
}

/**
 * สร้างข้อมูล Alert แบบสุ่มสำหรับทดสอบ real-time
 */
export function generateRandomAlert() {
  const alertTypes = ["danger", "warning", "success"];
  const deviceIds = ["TARGET-A", "TARGET-B", "TARGET-C", "TARGET-D"];
  
  return generateAlertPoint(
    deviceIds[Math.floor(Math.random() * deviceIds.length)],
    alertTypes[Math.floor(Math.random() * alertTypes.length)]
  );
}

/**
 * ตัวอย่างการใช้งาน
 */
export function testMockData() {
  console.log("=== 📍 Single Point ===");
  console.log(generateSinglePoint("DRONE-TEST"));
  
  console.log("\n=== 📊 Multiple Points ===");
  console.log(generateMultiplePoints("DRONE-PATH", 5));
  
  console.log("\n=== 🚨 Alert Point ===");
  console.log(generateAlertPoint("TARGET-DANGER"));
  
  console.log("\n=== 🛤️ Alert Path ===");
  console.log(generateAlertPath("TARGET-TRACK", 4));
  
  console.log("\n=== 📦 Complete Mock Data Set ===");
  console.log(generateMockDataSet());
}

// ตัวอย่างข้อมูล Static
export const mockStaticData = {
  // จุดเดียว
  singlePoint: {
    deviceId: "DRONE-001",
    time: 1699776000000,
    latitude: 13.7563,
    longitude: 100.5018,
    altitude: 250,
    type: "drone"
  },
  
  // หลายจุด (Array)
  multiplePoints: {
    deviceId: "DRONE-002",
    time: [1699776000000, 1699776010000, 1699776020000, 1699776030000],
    latitude: [13.7563, 13.7573, 13.7583, 13.7593],
    longitude: [100.5018, 100.5028, 100.5038, 100.5048],
    altitude: [250, 260, 270, 280],
    type: "drone"
  },
  
  // Alert แบบจุดเดียว
  alertSingle: {
    deviceId: "TARGET-001",
    time: 1699776000000,
    latitude: 13.7500,
    longitude: 100.5100,
    altitude: 150,
    type: "danger",
    pointCount: 1
  },
  
  // Alert แบบหลายจุด
  alertPath: {
    deviceId: "TARGET-MOVING",
    time: [1699776000000, 1699776015000, 1699776030000, 1699776045000, 1699776060000],
    latitude: [13.7500, 13.7510, 13.7520, 13.7530, 13.7540],
    longitude: [100.5100, 100.5110, 100.5120, 100.5130, 100.5140],
    altitude: [150, 155, 160, 165, 170],
    type: "danger",
    pointCount: 5
  }
};

export default {
  generateSinglePoint,
  generateMultiplePoints,
  generateAlertPoint,
  generateAlertPath,
  generateMockDataSet,
  generateStreamingData,
  generateRandomAlert,
  testMockData,
  mockStaticData
};
