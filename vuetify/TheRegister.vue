<template>
  <div class="TheSetting">
    <div class="p-5 min-h-screen bg-gray-100 flex items-center justify-center">

      <div class="w-full max-w-md mx-auto">
        <div class="bg-white p-8 sm:p-10 rounded-lg shadow-xl border border-gray-400">

          <form @submit.prevent="handleSubmit">

            <h1 class="text-3xl text-center font-bold mb-6 text-gray-800">
              สมัครสมาชิก
            </h1>

            <div class="mb-4">
              <label for="username" class="block text-sm font-medium text-gray-700 py-2">Username</label>
              <input id="username" v-model="formData.username" type="text" placeholder="Username"
                class="w-full p-2 form-control-tailwind" required />
            </div>

            <div class="mb-4">
              <label for="fname" class="block text-sm font-medium text-gray-700 py-2">ชื่อจริง</label>
              <input id="fname" v-model="formData.fname" type="text" placeholder="ชื่อจริง"
                class="w-full p-2 form-control-tailwind" required />
            </div>

            <div class="mb-4">
              <label for="lname" class="block text-sm font-medium text-gray-700 py-2">นามสกุล</label>
              <input id="lname" v-model="formData.lname" type="text" placeholder="นามสกุล"
                class="w-full p-2 form-control-tailwind" />
            </div>

            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 py-2">password</label>
              <input id="password" v-model="formData.password" type="password" placeholder="password"
                class="w-full p-2 form-control-tailwind" required />
            </div>

            <div class="mb-4">
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 py-2">confirmPassword</label>
              <input id="confirmPassword" v-model="formData.confirmPassword" type="password"
                placeholder="confirmPassword" class="w-full p-2 form-control-tailwind" required />
              <p v-if="formData.password !== formData.confirmPassword && formData.confirmPassword"
                class="w-full p-2 text-red-500 text-xs mt-1">
                Passwords do not match.
              </p>
            </div>

            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-700 py-2">email</label>
              <input id="email" v-model="formData.email" type="email" placeholder="email" class="w-full p-2 form-control-tailwind"
                required />
            </div>

            <div class="mb-4">
              <label for="avatar_url" class="block text-sm font-medium text-gray-700 py-2">รูปภาพ</label>
              <input id="avatar_url" @change="handleFileUpload" type="file" accept="image/jpeg, image/png" class="block w-full p-2 text-sm text-gray-500 py-2
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100" />
              <p v-if="formData.avatar" class="text-sm text-gray-600 mt-1 pl-1">Selected: **{{ formData.avatar.name }}**
              </p>
            </div>

            <button type="submit"
              class="w-full py-2 mt-4 text-lg font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-150">
              สมัครสมาชิก
            </button>
          </form>

          <div class="text-center text-sm text-gray-600 mt-4 py-2">
            ถ้ามีบัญชีอยู่แล้ว
            <router-link to="TheLogin" class="underline text-blue-600">คลิ๊กที่นี่</router-link>
            เพื่อเข้าสู่ระบบ
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

const router = useRouter();

// สร้างตัวแปรให้ตรงกับ v-model ใน Template เป๊ะๆ
const formData = reactive({
  username: '',
  fname: '',
  lname: '',
  password: '',
  confirmPassword: '',
  email: '',
  avatar: null // ตัวแปรสำหรับเก็บไฟล์รูปภาพ
});

// ฟังก์ชันสำหรับดึงไฟล์เมื่อมีการเลือกรูปภาพ
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.avatar = file; // เก็บไฟล์ลงใน object
  }
};

// ฟังก์ชันเมื่อกดปุ่ม Submit
const handleSubmit = async () => {
  // 1. ตรวจสอบรหัสผ่านว่าตรงกันไหม
  if (formData.password !== formData.confirmPassword) {
    Swal.fire({
      icon: 'error',
      title: 'รหัสผ่านไม่ตรงกัน',
      text: 'กรุณากรอกรหัสผ่านและยืนยันรหัสผ่านให้เหมือนกัน'
    });
    return;
  }

  try {
    // 2. เตรียมข้อมูลใส่ FormData (จำเป็นสำหรับการส่งไฟล์)
    const data = new FormData();
    data.append('username', formData.username);
    data.append('password', formData.password);
    data.append('fname', formData.fname);
    data.append('lname', formData.lname || ''); // ถ้าไม่มีนามสกุลให้ส่งค่าว่าง
    data.append('email', formData.email);

    // เช็คว่ามีการเลือกไฟล์ไหม
    if (formData.avatar) {
      // ชื่อ key 'avatar_url' ต้องตรงกับที่ Server.js คาดหวัง (upload.single("avatar_url"))
      data.append('avatar_url', formData.avatar); 
    }

    // 3. ยิง Request ไปที่ Server
    const response = await axios.post('http://localhost:3000/register', data, {
      headers: {
        'Content-Type': 'multipart/form-data' // Header จำเป็นสำหรับการอัปโหลดไฟล์
      }
    });

    // 4. ถ้าสำเร็จ
    if (response.status === 201 || response.data.status === 'success') {
      await Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกสำเร็จ',
        text: 'กำลังพาท่านไปหน้าเข้าสู่ระบบ...',
        timer: 1500,
        showConfirmButton: false
      });
      
      // ย้ายไปหน้า Login
      router.push('/TheLogin');
    }

  } catch (error) {
    // 5. ถ้าเกิดข้อผิดพลาด
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'สมัครสมาชิกไม่สำเร็จ',
      text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Server'
    });
  }
};
</script>