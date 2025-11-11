import express from 'express';
const app = express();
const PORT = 3000;

// Middleware สำหรับ parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ให้บริการ static files จากโฟลเดอร์ 'public'
app.use(express.static('public'));

// Route หลัก
app.get('/', (req, res) => {
  res.json({ 
    message: 'ยินดีต้อนรับสู่ Express Server!',
    status: 'success' 
  });
});

// Route ตัวอย่าง - GET
app.get('/api/hello', (req, res) => {
  res.json({ message: 'สวัสดีครับ!' });
});

// Route ตัวอย่าง - POST
app.post('/api/data', (req, res) => {
  const data = req.body;
  res.json({ 
    message: 'รับข้อมูลเรียบร้อย',
    receivedData: data 
  });
});

// Route สำหรับจัดการ 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'ไม่พบหน้าที่ต้องการ',
    path: req.path 
  });
});

// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`🚀 Server กำลังรันที่ http://localhost:${PORT}`);
});