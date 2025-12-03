<template>
  <div class="TheLogin">
    <div class="p-5 min-h-screen bg-gray-100 flex items-center justify-center">

      <div class="w-full max-w-md mx-auto">
        <div class="bg-white p-8 sm:p-10 rounded-lg shadow-xl border border-gray-400">

          <form @submit.prevent="handleSubmit">

            <h1 class="text-3xl text-center font-bold mb-6 text-gray-800">
              เข้าสู่ระบบ
            </h1>

            <!-- Username Field -->
            <div class="mb-4">
              <label for="username" class="block text-sm font-medium text-gray-700 py-2">Username</label>
              <input id="username" v-model="formData.username" type="text" placeholder="Username"
                class="w-full form-control-tailwind p-2" required />
            </div>

            <!-- Password Field -->
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700 py-2">password</label>
              <input id="password" v-model="formData.password" type="password" placeholder="password"
                class="w-full form-control-tailwind p-2" required />
            </div>

            <!-- Submit Button -->
            
            <label for="" class="block py-2">    </label>

            <button type="submit"
              class="w-full py-2 mt-4 text-lg font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-150">
              เข้าสู่ระบบ
            </button>

          </form>

          <!-- Registration Link -->
          <div class="text-center text-sm text-gray-600 mt-4 py-2">
            ถ้ายังไม่มีบัญชี
            <router-link to="/TheRegister" class="underline text-blue-600">คลิ๊กที่นี่</router-link>
            เพื่อสมัครสมาชิก
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

// ตัวแปรเก็บข้อมูลจากฟอร์ม
const formData = reactive({
  username: '',
  password: ''
});

const handleSubmit = async () => {
  try {
    // 1. ยิง Request ไปที่ Server
    const response = await axios.post('http://localhost:3000/login', {
      username: formData.username,
      password: formData.password
    });

    // 2. ถ้า Login สำเร็จ
    if (response.data.status === 'success') {
      // เก็บ Token ลงใน LocalStorage
      localStorage.setItem('token', response.data.token);
      
      // แจ้งเตือนสำเร็จ
      await Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: 'กำลังพาท่านไปที่หน้า Dashboard...',
        timer: 1500,
        showConfirmButton: false
      });

      // ย้ายหน้าไป Dashboard (ต้องตั้งชื่อ path ใน router ให้ตรงกัน)
      router.push('/TheDashboard'); 
    }

  } catch (error) {
    // 3. ถ้า Login ไม่สำเร็จ (เช่น รหัสผิด)
    Swal.fire({
      icon: 'error',
      title: 'เข้าสู่ระบบล้มเหลว',
      text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
    });
  }
};
</script>