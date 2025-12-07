<template>
    <div class="TheNavBar" v-if="shouldShowNavbar">
        <nav class="bg-indigo-600 shadow-md">
            <div class="max-w mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">

                    <div class="flex-shrink-0 mr-auto">
                        <router-link to="/TheDashboard" class="flex items-center">
                            <button
                                class="text-2xl font-bold text-white tracking-wider hover:text-indigo-200 transition duration-150 focus:outline-none">
                                PuaTC
                            </button>
                        </router-link>
                    </div>

                    <div class="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                        
                        <router-link to="/TheSetting">
                            <button
                                class="text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition duration-150 flex items-center">
                                <span class="mr-1">⚙</span> ตั้งค่า
                            </button>
                        </router-link>

                        <div class="flex items-center space-x-2 border-l border-indigo-400 pl-4 ml-2">
                            <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                <img :src="avatarUrl" alt="User Avatar" class="w-full h-full object-cover bg-gray-300">
                            </div>
                            
                            <button @click="logout"
                                class="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-sm font-medium transition shadow-sm">
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>

                    <div class="-mr-2 flex items-center sm:hidden">
                        <button @click="isMenuOpen = !isMenuOpen" type="button"
                            class="inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                            <span class="sr-only">Open main menu</span>
                            <svg v-if="!isMenuOpen" class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg v-else class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div v-show="isMenuOpen" class="sm:hidden bg-indigo-700">
                <div class="px-2 pt-2 pb-3 space-y-1">
                    <router-link to="/TheDashboard" @click="isMenuOpen = false">
                        <button
                            class="text-indigo-100 hover:bg-indigo-500 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium">
                            📊 Dashboard
                        </button>
                    </router-link>

                    <router-link to="/TheSetting" @click="isMenuOpen = false">
                        <button
                            class="text-indigo-100 hover:bg-indigo-500 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium">
                            ⚙ ตั้งค่า
                        </button>
                    </router-link>

                    <button @click="logout"
                        class="mt-2 bg-red-500 hover:bg-red-600 text-white block w-full text-left font-semibold py-2 px-3 rounded-md text-base transition duration-150">
                        ออกจากระบบ
                    </button>
                </div>
            </div>
        </nav>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // import useRoute เพิ่ม
import axios from 'axios';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute(); // ตัวแปรสำหรับเช็คหน้าปัจจุบัน

const isMenuOpen = ref(false);
const userProfile = ref(null);
const BASE_URL = 'http://localhost:3000';

// --- 1. Logic ซ่อน Navbar ---
// จะเป็น true ก็ต่อเมื่อ path ไม่ใช่ /TheLogin และ /TheRegister
const shouldShowNavbar = computed(() => {
    const hiddenPages = ['/TheLogin', '/TheRegister', '/']; // เพิ่ม path ที่อยากซ่อนได้ที่นี่
    // ถ้า path ปัจจุบันอยู่ในรายการ hiddenPages ให้ return false (ซ่อน)
    return !hiddenPages.includes(route.path);
});

// --- 2. Logic รูปภาพ ---
const avatarUrl = computed(() => {
    if (userProfile.value && userProfile.value.avatar_url) {
        return `${BASE_URL}/${userProfile.value.avatar_url}`;
    }
    return 'https://placehold.co/100x100/374151/FFFFFF?text=User';
});

// --- 3. Logic Logout ---
const logout = () => {
    isMenuOpen.value = false;
    Swal.fire({
        title: 'ยืนยันการออกจากระบบ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token'); // ลบ Token
            router.push('/TheLogin'); // ดีดไปหน้า Login
        }
    });
};

// --- 4. ดึงข้อมูลผู้ใช้ ---
onMounted(async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // ถ้าไม่มี token ก็ไม่ต้องดึง (เดี๋ยว router guard จัดการเอง)

    try {
        const response = await axios.get(`${BASE_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        userProfile.value = response.data.user;
    } catch (error) {
        // เงียบไว้ หรือจัดการตามความเหมาะสม
        console.error("Profile fetch error:", error);
    }
});
</script>