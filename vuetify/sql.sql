/* ---------------------------------
  -- 1. สร้างฐานข้อมูล (ถ้ายังไม่มี)
  -- (ชื่อ 'mydb' ตามไฟล์ .env ของคุณ)
  ---------------------------------
*/
CREATE DATABASE IF NOT EXISTS mydb
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mydb;

/* ---------------------------------
  -- 2. ตารางสิทธิ์ (Roles)
  -- (เก็บ 3 ระดับตามเกณฑ์)
  ---------------------------------
*/
CREATE TABLE roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

/* ---------------------------------
  -- 3. ตารางผู้ใช้งาน (Users)
  -- (ตารางหลักสำหรับ Login/JWT)
  ---------------------------------
*/
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(65) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  fname VARCHAR(100),
  lname VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  avatar_url VARCHAR(255) DEFAULT NULL, /* (สำหรับเก็บ Path รูป) */
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

/* ---------------------------------
  -- 4. ตารางอุปกรณ์ (Devices)
  -- (เก็บตัว Hardware เช่น ESP32)
  ---------------------------------
*/
CREATE TABLE devices (
  device_id INT AUTO_INCREMENT PRIMARY KEY,
  device_name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP
);

/* ---------------------------------
  -- 5. ตารางข้อมูลเซ็นเซอร์ (Sensor Data)
  -- (ตารางสำหรับ "Database Logging" จาก MQTT)
  ---------------------------------
*/
CREATE TABLE sensor_data (
  data_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (device_id) REFERENCES devices(device_id)
);

/* ---------------------------------
  -- 6. ตารางประวัติการใช้งาน (Logs)
  -- (สำหรับ Audit Trail เพื่อเก็บคะแนน)
  ---------------------------------
*/
CREATE TABLE logs (
  log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

/* ---------------------------------
  -- 7. (สำคัญ!) ใส่ข้อมูล Roles เริ่มต้น
  -- (ต้องมี 3 สิทธิ์นี้เพื่อให้ JOIN ทำงานได้)
  ---------------------------------
*/
INSERT INTO roles (role_id, role_name) VALUES
(1, 'Administrator'),
(2, 'User Level 1'),
(3, 'User Level 2');

/* ---------------------------------
  -- 8. (สำคัญ!) ใส่ข้อมูล Device เริ่มต้น
  -- (เพื่อให้ server.js (MQTT) INSERT ข้อมูลได้)
  ---------------------------------
*/
INSERT INTO devices (device_id, device_name, location) 
VALUES (1, 'ESP32-Sensor-01', 'Test Room');