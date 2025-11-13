/**
 * ฟังก์ชันแปลงข้อมูลจาก Client เป็นรูปแบบที่บันทึกใน MongoDB
 * @param {Object|Array} parsedData - ข้อมูลที่ได้รับจาก Client
 * @returns {Array} allEntries - Array ของข้อมูลที่พร้อมบันทึก
 */
export function transformDataToEntries2(parsedData) {
  const allEntries = [];
  const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

  dataArray.forEach((d) => {
    const deviceId = d.deviceId || "unknown_device";
    const cameraId = d.cameraId || d.detectedBy || null; // เพิ่ม cameraId
    const t = d.time || 0;
    const lat = d.latitude;
    const lon = d.longitude;
    const alt = d.altitude;
    const type = d.type || "unknown";

    // ✅ กรณี latitude/longitude/altitude เป็น Array (หลายจุด)
    if (Array.isArray(lat) && Array.isArray(lon)) {
      const count = Math.min(lat.length, lon.length, alt?.length || lat.length, Array.isArray(t) ? t.length : lat.length);
      for (let i = 0; i < count; i++) {
        allEntries.push({
            deviceId,
            cameraId, // เพิ่มฟิลด์ cameraId
            time: Array.isArray(t) ? t[i] : t + i,
            latitude: lat[i] ?? 0,
            longitude: lon[i] ?? 0,
            altitude: alt?.[i] ?? 0,
            type,
        });
      }
    }
    // ✅ กรณี latitude/longitude/altitude เป็นค่าตัวเดียว
    else if (typeof lat === "number" && typeof lon === "number") {
      allEntries.push({
        deviceId,
        cameraId, // เพิ่มฟิลด์ cameraId
        time: t,
        latitude: lat ?? 0,
        longitude: lon ?? 0,
        altitude: alt ?? 0,
        type,
      });
    }
    // ⚠️ ไม่มีข้อมูลพิกัด
    else {
      console.warn("⚠️ ข้อมูลตำแหน่งไม่ถูกต้องหรือว่างเปล่า:", d);
    }
  });

  return allEntries;
}
