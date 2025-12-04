import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import multer from 'multer' 
import path from 'path' 
import { fileURLToPath } from 'url' 
import fs from 'fs' 
import mqtt from 'mqtt'

dotenv.config();

const app = express()

const server = http.createServer(app) 
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

// --- การตั้งค่า Multer (สำหรับอัปโหลดรูป) ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true)
  } else {
    cb(new Error('รองรับเฉพาะไฟล์ jpeg และ png เท่านั้น'), false)
  }
}

const upload = multer({ storage: storage, fileFilter: fileFilter })

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// --- จบการตั้งค่า Multer ---

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
})

// Middleware (สำหรับตรวจสอบ Token)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ status: 'error', message: 'ไม่พบ Token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded 
    next()
  } catch (err) {
    return res.status(403).json({ status: 'error', message: 'Token ไม่ถูกต้อง' })
  }
}


// ====================================
// --- Endpoint: สมัครสมาชิก (Register)
// ====================================
app.post('/register', upload.single('avatar_url'), async (req, res) => {
  const { username, password, fname, lname, email } = req.body

  let avatarPath = null
  if (req.file) {
    avatarPath = req.file.path.replace(/\\/g, '/') 
  }

  if (!username || !password || !fname || !email) {
    return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
  }

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [
      username,
      email,
    ])

    if (existingUser.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Username หรือ Email นี้ถูกใช้งานแล้ว',
      })
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    const defaultRoleId = 3 // 3 = 'User Level 2'

    // ตรงนี้ไม่ต้องแก้ เพราะ Insert ไม่ต้องระบุ ID (Auto increment)
    await db.query(
      'INSERT INTO users (username, password, fname, lname, email, role_id, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, fname, lname, email, defaultRoleId, avatarPath],
    )

    res.status(201).json({ status: 'success', message: 'สมัครสมาชิกสำเร็จ!' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// ====================================
// --- Endpoint: เข้าสู่ระบบ (Login)
// ====================================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const sql = `
      SELECT users.*, roles.role_name 
      FROM users 
      JOIN roles ON users.role_id = roles.role_id 
      WHERE users.username = ?
    `;
    const [results] = await db.query(sql, [username]);

    if (results.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // สร้าง Token
    const token = jwt.sign(
      { 
        id: user.user_id,   // ใช้ user_id ตาม DB
        username: user.username, 
        role_name: user.role_name 
      },
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: "4h" }
    );

    res.json({ status: "success", token, user });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ====================================
// --- Endpoint: ดึงข้อมูลโปรไฟล์ (Get Profile)
// ====================================
app.get('/profile', verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT 
                users.user_id, 
                users.username, 
                users.fname, 
                users.lname, 
                users.email, 
                users.avatar_url, 
                roles.role_name  
            FROM users 
            JOIN roles ON users.role_id = roles.role_id 
            WHERE users.user_id = ? 
        `;

        // ใช้ req.user.id เพราะตอน Login เรา sign มาด้วย key ชื่อ "id"
        const [results] = await db.query(sql, [req.user.id]);
        
        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ user: results[0] }); 

    } catch (err) {
        console.error("Profile Error:", err);
        res.status(500).json({ message: "Server error fetching profile" });
    }
});

// ====================================
// --- Endpoint: อัปเดตโปรไฟล์ (Update Profile)
// *** แก้ไขจุดสำคัญตรงนี้ ***
// ====================================
app.put(
  '/profile',
  verifyToken,
  // verifyLevel1_Or_Admin, // อาจจะปิดไว้ก่อนถ้า role_name ใน Token ไม่ตรง หรือเปิดไว้ถ้ามั่นใจ
  upload.single('avatar_url'), // แก้ชื่อให้ตรงกับ Frontend (avatar_url หรือ profileImage)
  async (req, res) => {
    const { fname, lname, email } = req.body
    
    // *** แก้ไข 1: ใช้ req.user.id (ไม่ใช่ userId) ***
    const userId = req.user.id 

    try {
      let avatarPath = null
      if (req.file) {
        avatarPath = req.file.path.replace(/\\/g, '/')
      }

      let query = 'UPDATE users SET fname = ?, lname = ?, email = ?'
      let params = [fname, lname, email]

      if (avatarPath) {
        query += ', avatar_url = ?'
        params.push(avatarPath)
      }

      // *** แก้ไข 2: เปลี่ยน WHERE id เป็น WHERE user_id ***
      query += ' WHERE user_id = ?'
      params.push(userId)

      await db.query(query, params)

      res.json({
        status: 'success',
        message: 'อัปเดตข้อมูลสำเร็จ',
        avatar_url: avatarPath,
      })
    } catch (err) {
      console.error("Update Error:", err);
      res.status(500).json({ status: 'error', message: err.message })
    }
  },
)

// ====================================
// --- Endpoint: เปลี่ยนรหัสผ่าน (Change Password)
// *** แก้ไขจุดสำคัญตรงนี้ ***
// ====================================
app.put('/change-password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body
  
  // *** แก้ไข 1: ใช้ req.user.id ***
  const userId = req.user.id

  try {
    // *** แก้ไข 2: เปลี่ยน WHERE id เป็น WHERE user_id ***
    const [rows] = await db.query('SELECT password FROM users WHERE user_id = ?', [userId])
    
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' })
    }

    const user = rows[0]
    const isMatch = await bcrypt.compare(oldPassword, user.password)

    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'รหัสผ่านเดิมไม่ถูกต้อง' })
    }

    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // *** แก้ไข 3: เปลี่ยน WHERE id เป็น WHERE user_id ***
    await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedNewPassword, userId])

    res.json({ status: 'success', message: 'เปลี่ยนรหัสผ่านสำเร็จ' })
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// ====================================
// --- Endpoint: ดึงข้อมูล Dashboard
// ====================================
app.get('/api/sensor-data', verifyToken, async (req, res) => {
  try {
    console.log("Dashboard: Fetching data..."); // เช็คว่าเข้ามาทำงานไหม

    // 1. ดึงข้อมูลล่าสุด
    const [latest] = await db.query(
      'SELECT temperature, humidity FROM sensor_data ORDER BY received_at DESC LIMIT 1'
    );
    
    // 2. ดึงประวัติ (History)
    const [history] = await db.query(
      'SELECT temperature, humidity, received_at FROM sensor_data ORDER BY received_at DESC LIMIT 20'
    );

    // 3. ค่าเฉลี่ย 24 ชม. (แก้ SQL ให้รองรับกรณีไม่มีข้อมูล)
    const [avg] = await db.query(
      'SELECT AVG(temperature) as avg_temp, AVG(humidity) as avg_hum FROM sensor_data WHERE received_at >= NOW() - INTERVAL 24 HOUR'
    );

    const result = {
      status: 'success',
      latest: latest[0] || { temperature: 0, humidity: 0 },
      history: history || [], // ถ้าไม่มีให้ส่ง array ว่าง
      average: avg[0] || { avg_temp: 0, avg_hum: 0 }
    };

    console.log("Dashboard Data Ready:", result.latest); // ดูว่าได้ข้อมูลไหม
    res.json(result);

  } catch (err) {
    // *** ปริ้น Error สีแดงออกมาดูที่ Terminal ***
    console.error("SERVER ERROR at /api/sensor-data:", err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ====================================
// --- MQTT Code ---
// ====================================
const MQTT_BROKER = 'mqtt://192.168.30.247:1883'
const MQTT_TOPIC = 'PuaTC/sensor/temp_hum' 

const client = mqtt.connect(MQTT_BROKER)

client.on('connect', () => {
  console.log('MQTT Connected!')
  client.subscribe(MQTT_TOPIC, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${MQTT_TOPIC}`)
    }
  })
})

client.on('message', async (topic, message) => {
  if (topic === MQTT_TOPIC) {
    try {
      const data = JSON.parse(message.toString())
      console.log('Data from Arduino:', data)

      const now = new Date()

      await db.query(
        'INSERT INTO sensor_data (device_id, temperature, humidity, received_at) VALUES (?, ?, ?, ?)',
        [
          1,
          data.temp,
          data.hum,
          now, 
        ],
      )
      console.log('Saved to database!')
      io.emit('new_sensor_data') 
    } catch (err) {
      console.error('Failed to save to DB:', err.message)
    }
  }
})

server.listen(3000, () => {
  console.log('Server กำลังรัน (พร้อม Socket.io) ที่ http://localhost:3000')
})