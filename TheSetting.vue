<template>
  <div class="TheSetting">
    <div class="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w mx-auto">

        <!-- Grid Container: Two Columns on md screens and above -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

          <!-- === LEFT COLUMN: Profile Data Management === -->
          <div class="mb-4">
            <div class="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 h-full">

              <!-- Card Header -->
              <div class="bg-gray-900 text-white p-4">
                <b class="text-lg">จัดการข้อมูล</b>
              </div>

              <!-- Card Body -->
              <div class="p-6">
                <h1 class="text-3xl text-center font-extrabold text-gray-800 mb-6">ตั้งค่า</h1>

                <form @submit.prevent="handleProfileSubmit" class="space-y-4">

                  <!-- Username (Disabled) -->
                  <div>
                    <label for="username" class="input-label">Username</label>
                    <input type="text" disabled v-model="profileForm.username" id="username"
                      class="w-full p-2 form-control-tailwind bg-gray-100 cursor-not-allowed">
                  </div>

                  <!-- First Name -->
                  <div>
                    <label for="fname" class="input-label">ชื่อจริง</label>
                    <input type="text" v-model="profileForm.fname" id="fname" class="w-full p-2 form-control-tailwind">
                  </div>

                  <!-- Last Name -->
                  <div>
                    <label for="lname" class="input-label">นามสกุล</label>
                    <input type="text" v-model="profileForm.lname" id="lname" class="w-full p-2 form-control-tailwind">
                  </div>

                  <!-- Email -->
                  <div>
                    <label for="email" class="input-label">Email</label>
                    <input type="email" v-model="profileForm.email" id="email" class="w-full p-2 form-control-tailwind">
                  </div>

                  <!-- Profile Image Upload -->
                  <div>
                    <label for="profileImage" class="input-label">
                      รูปภาพ
                      <span class="text-red-500 font-normal text-sm">ใช้ได้เฉพาะ jpeg, png</span>
                    </label>
                    <input type="file" @change="handleImageUpload" id="profileImage"
                      class="block w-full p-2 form-control-tailwind file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      accept="image/jpeg, image/png">
                  </div>

                  <!-- Submit Button -->
                  <div class="pt-4">
                    <button type="submit"
                      class="w-full py-2 px-4 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 transition duration-150 focus:outline-none focus:ring-4 focus:ring-yellow-300">
                      แก้ไขข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- === RIGHT COLUMN: Password Management === -->
          <div class="mb-4">
            <div class="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 h-full">

              <!-- Card Header -->
              <div class="bg-gray-900 text-white p-4">
                <b class="text-lg">จัดการแก้ไขรหัสผ่าน</b>
              </div>

              <!-- Card Body -->
              <div class="p-6">
                <h1 class="text-3xl text-center font-extrabold text-gray-800 mb-6">แก้ไขรหัสผ่าน</h1>

                <form @submit.prevent="handlePasswordSubmit" class="space-y-4">

                  <!-- Old Password -->
                  <div>
                    <label for="oldPassword" class="input-label">รหัสผ่านเดิม</label>
                    <input type="password" v-model="passwordForm.oldPassword" id="oldPassword"
                      class="w-full p-2 form-control-tailwind" required>
                  </div>

                  <!-- New Password -->
                  <div>
                    <label for="newPassword" class="input-label">รหัสผ่านใหม่</label>
                    <input type="password" v-model="passwordForm.newPassword" id="newPassword"
                      class="w-full p-2 form-control-tailwind" required>
                  </div>

                  <!-- Confirm New Password -->
                  <div>
                    <label for="confirmPassword" class="input-label">ยืนยันรหัสผ่านใหม่</label>
                    <input type="password" v-model="passwordForm.confirmPassword" id="confirmPassword"
                      class="w-full p-2 form-control-tailwind" required>
                  </div>

                  <!-- Submit Button -->
                  <div class="pt-4">
                    <button type="submit"
                      class="w-full py-2 px-4 bg-yellow-500 text-white font-bold rounded-lg shadow-md hover:bg-yellow-600 transition duration-150 focus:outline-none focus:ring-4 focus:ring-yellow-300">
                      แก้ไขรหัสผ่าน
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

const router = useRouter();
const token = localStorage.getItem('token');
const BASE_URL = 'http://localhost:3000'; 

// --- 1. ตัวแปรสำหรับเก็บข้อมูล Profile ---
const profileForm = reactive({
  username: 'กำลังโหลด...', // ค่าเริ่มต้นก่อนข้อมูลมา
  fname: '',
  lname: '',
  email: '',
  avatarPath: null 
});

// ตัวแปรสำหรับรูปภาพใหม่ (ถ้ามีการเปลี่ยนรูป)
const newAvatarFile = ref(null);
const previewImage = ref(null);

// --- 2. ตัวแปรสำหรับเปลี่ยนรหัสผ่าน ---
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// --- 3. Computed: จัดการ URL รูปภาพ ---
const currentAvatar = computed(() => {
  // ถ้ามีการเลือกรูปใหม่ (Preview) ให้โชว์รูปนั้นก่อน
  if (previewImage.value) {
    return previewImage.value;
  }
  // ถ้ามีรูปเดิมจาก Database ให้โชว์รูปนั้น
  if (profileForm.avatarPath) {
    return `${BASE_URL}/${profileForm.avatarPath}`;
  }
  // ถ้าไม่มีอะไรเลย ให้โชว์รูป Default
  return 'https://via.placeholder.com/150';
});

// --- 4. เริ่มต้นทำงาน (Lifecycle) ---
onMounted(async () => {
  if (!token) {
    Swal.fire('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน', 'warning');
    router.push('/TheLogin');
    return;
  }
  await fetchUserProfile();
});

// --- 5. ฟังก์ชันดึงข้อมูลจาก Database ---
const fetchUserProfile = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Debug ดูข้อมูลที่ได้จาก Server
    console.log("Data from DB:", res.data);

    // ดึง user object ออกมา (รองรับทั้ง res.data.user และ res.data)
    const user = res.data.user || res.data;

    if (user) {
      // เอาข้อมูลจาก DB ยัดใส่ Form
      profileForm.username = user.username;
      profileForm.fname = user.fname || ''; // ถ้าเป็น null ให้ใส่ค่าว่าง
      profileForm.lname = user.lname || '';
      profileForm.email = user.email || '';
      profileForm.role_name = user.role_name || '';
      profileForm.avatarPath = user.avatar_url; // Path รูปจาก DB เช่น 'uploads/xxx.jpg'
    }

  } catch (error) {
    console.error("Fetch Error:", error);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
       Swal.fire('Session หมดอายุ', 'กรุณาเข้าสู่ระบบใหม่', 'error');
       localStorage.removeItem('token');
       router.push('/TheLogin');
    }
  }
};

// --- 6. ฟังก์ชันเมื่อเลือกรูปภาพ ---
const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    newAvatarFile.value = file;
    // สร้าง URL ชั่วคราวเพื่อให้ user เห็นรูปทันทีที่เลือก
    previewImage.value = URL.createObjectURL(file);
  }
};

// --- 7. ฟังก์ชันบันทึกข้อมูลส่วนตัว ---
const handleProfileSubmit = async () => {
  try {
    const formData = new FormData();
    formData.append('fname', profileForm.fname);
    formData.append('lname', profileForm.lname);
    formData.append('email', profileForm.email);

    // ถ้ามีรูปใหม่ ส่งไปด้วย
    if (newAvatarFile.value) {
      formData.append('avatar_url', newAvatarFile.value);
    }

    const res = await axios.put(`${BASE_URL}/profile`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    if (res.status === 200 || res.data.status === 'success') {
      await Swal.fire('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อย', 'success');
      // รีโหลดหน้าเพื่อให้มั่นใจว่าข้อมูลล่าสุดถูกดึงมา
      window.location.reload();
    }
  } catch (error) {
    Swal.fire('เกิดข้อผิดพลาด', error.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
  }
};

// --- 8. ฟังก์ชันเปลี่ยนรหัสผ่าน ---
const handlePasswordSubmit = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return Swal.fire('รหัสผ่านไม่ตรงกัน', 'กรุณากรอกรหัสผ่านใหม่ให้เหมือนกัน', 'warning');
  }

  try {
    const res = await axios.put(`${BASE_URL}/change-password`, {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 200 || res.data.status === 'success') {
      Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อย', 'success');
      passwordForm.oldPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
    }
  } catch (error) {
    Swal.fire('ผิดพลาด', error.response?.data?.message || 'รหัสผ่านเดิมไม่ถูกต้อง', 'error');
  }
};
</script>