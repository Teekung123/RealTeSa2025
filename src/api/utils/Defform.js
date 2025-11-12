/**
 * ฟังก์ชันแปลงข้อมูลจาก Client เป็นรูปแบบที่บันทึกใน MongoDB
 * @param {Object|Array} parsedData - ข้อมูลที่ได้รับจาก Client
 * @returns {Array} allEntries - Array ของข้อมูลที่พร้อมบันทึก
 */
export function transformDataToEntries_Def(parsedData) {
  const allEntries = [];
  const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

  dataArray.forEach((d) => {
    const deviceId = d.deviceId || "unknown_device";
    const t = d.time || 0;
    const lat = d.latitude;
    const lon = d.longitude;
    const alt = d.altitude;
    const pos = d.position3D || [];

    // กรณี position3D เป็น Array ของ Arrays (หลายจุด)
    if (Array.isArray(pos) && pos.length > 0 && Array.isArray(pos[0])) {
      pos.forEach((p, i) => {
        allEntries.push({
          deviceId,
          time: Array.isArray(t) ? t[i] : t + i,
          latitude: p[1] ?? lat?.[i] ?? 0,
          longitude: p[0] ?? lon?.[i] ?? 0,
          altitude: p[2] ?? alt?.[i] ?? 0,
        });
      });
    } 
    // กรณี position3D เป็น Array ธรรมดา (จุดเดียว)
    else if (Array.isArray(pos) && pos.length === 3) {
      allEntries.push({
        deviceId,
        time: t,
        latitude: pos[1] ?? lat ?? 0,
        longitude: pos[0] ?? lon ?? 0,
        altitude: pos[2] ?? alt ?? 0,
      });
    } 
    // ไม่มีข้อมูลตำแหน่ง
    else {
      console.warn("⚠️ ข้อมูลตำแหน่ง 3D ว่างเปล่า:", d);
    }
  });

  return allEntries;
}
