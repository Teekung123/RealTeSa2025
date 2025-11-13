/**
 * ฟังก์ชันแปลงข้อมูลจาก Client เป็นรูปแบบที่บันทึกใน MongoDB
 * แยก collection ตามประเภทข้อมูล: Mydrone_location, Log_data_location, Camera_locations
 * @param {Object|Array} parsedData - ข้อมูลที่ได้รับจาก Client
 * @returns {Object} { myDrones: Array, opponents: Array, cameras: Array } - ข้อมูลแยกตาม collection
 */
export function transformDataToEntries2(parsedData) {
  const myDrones = []; // ข้อมูลโดรนฝั่งเรา
  const opponents = []; // ข้อมูลเป้าหมายฝั่งตรงข้าม
  const cameras = []; // ข้อมูลกล้อง
  const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

  dataArray.forEach((d) => {
    const deviceId = d.deviceId || d.cameraId || "unknown_device";
    const cameraId = d.cameraId || d.detectedBy || null;
    const t = d.time || Math.floor(Date.now() / 1000); // unix timestamp
    const lat = d.latitude;
    const lon = d.longitude;
    const alt = d.altitude;
    const type = d.type || "warning";
    
    // ตรวจสอบว่าเป็นข้อมูลกล้องหรือไม่
    const isCamera = d.isCameraData === true || 
                     (deviceId && (deviceId.startsWith('CAM-') || deviceId.includes('camera')));
    
    // ตรวจสอบว่าเป็นโดรนฝั่งเราหรือไม่
    const isMyDrone = d.isMyDrone === true || 
                      (deviceId && (
                        deviceId.startsWith('MYDRONE-') || 
                        deviceId.includes('MYDRONE') ||
                        deviceId.includes('ALPHA') ||
                        deviceId.includes('BETA') ||
                        deviceId.includes('CHARLIE')
                      ));

    // ✅ กรณี latitude/longitude/altitude เป็น Array (หลายจุด)
    if (Array.isArray(lat) && Array.isArray(lon)) {
      const count = Math.min(lat.length, lon.length, alt?.length || lat.length, Array.isArray(t) ? t.length : lat.length);
      for (let i = 0; i < count; i++) {
        const entry = {
          deviceId,
          cameraId,
          time: Array.isArray(t) ? t[i] : t + i,
          latitude: lat[i] ?? 0,
          longitude: lon[i] ?? 0,
          altitude: alt?.[i] ?? 0,
          type,
          timestamp: new Date()
        };
        
        if (isCamera) {
          // เพิ่มข้อมูลเฉพาะกล้อง
          cameras.push({
            ...entry,
            name: d.name || `กล้อง ${deviceId}`,
            status: d.status || 'active',
            direction: d.direction || 0,
            fov: d.fov || 90,
            detectionRange: d.detectionRange || 500
          });
        } else if (isMyDrone) {
          // โดรนฝั่งเรา
          myDrones.push(entry);
        } else {
          // ฝั่งตรงข้าม
          opponents.push(entry);
        }
      }
    }
    // ✅ กรณี latitude/longitude/altitude เป็นค่าตัวเดียว
    else if (typeof lat === "number" && typeof lon === "number") {
      const entry = {
        deviceId,
        cameraId,
        time: t,
        latitude: lat ?? 0,
        longitude: lon ?? 0,
        altitude: alt ?? 0,
        type,
        timestamp: new Date()
      };
      
      if (isCamera) {
        // เพิ่มข้อมูลเฉพาะกล้อง
        cameras.push({
          ...entry,
          name: d.name || `กล้อง ${deviceId}`,
          status: d.status || 'active',
          direction: d.direction || 0,
          fov: d.fov || 90,
          detectionRange: d.detectionRange || 500
        });
      } else if (isMyDrone) {
        // โดรนฝั่งเรา
        myDrones.push(entry);
      } else {
        // ฝั่งตรงข้าม
        opponents.push(entry);
      }
    }
    // ⚠️ ไม่มีข้อมูลพิกัด
    else {
      console.warn("⚠️ ข้อมูลตำแหน่งไม่ถูกต้องหรือว่างเปล่า:", d);
    }
  });

  return { myDrones, opponents, cameras };
}
