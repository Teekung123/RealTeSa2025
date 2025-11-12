/**
 * ฟังก์ชันแปลงข้อมูลจาก Client เป็นรูปแบบที่บันทึกใน MongoDB
 * @param {Object|Array} parsedData - ข้อมูลที่ได้รับจาก Client
 * @returns {Array} allEntries - Array ของข้อมูลที่พร้อมบันทึก
 */
export function transformDataToEntries(parsedData) {
  let allEntries = [];
  const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

  dataArray.forEach((d) => {
    const deviceId = d.deviceId || "unknown_device";
    const t = d.time || 0;
    const pos = d.position3D || [];
    const vel = d.velocity3D || [];
    const acc = d.acceleration3D || [];
    const pos2 = d.position2D || [];
    const vel2 = d.velocity2D || [];

    // ถ้า position3D เป็น Array ของ Arrays (หลายจุด)
    if (Array.isArray(pos[0])) { 
      pos.forEach((p, i) => {
        allEntries.push({
          deviceId,
          time: Array.isArray(t) ? t[i] : t + i,
          position3D: p,
          velocity3D: vel[i] || [0, 0, 0],
          acceleration3D: acc[i] || [0, 0, 0],
          position2D: pos2[i] || [0, 0],
          velocity2D: vel2[i] || [0, 0],
        });
      });
    } 
    // ถ้า position3D เป็น Array ธรรมดา (จุดเดียว)
    else if (pos.length > 0) { 
      allEntries.push({
        deviceId, 
        time: t, 
        position3D: pos, 
        velocity3D: vel,
        acceleration3D: acc, 
        position2D: pos2, 
        velocity2D: vel2,
      });
    } 
    // ไม่มีข้อมูล position3D
    else {
      console.warn("⚠️ ข้อมูลตำแหน่ง 3D ว่างเปล่า:", d);
    }
  });

  return allEntries;
}
