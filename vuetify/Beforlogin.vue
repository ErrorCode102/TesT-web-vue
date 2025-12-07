<template>
    <div class="Beforlogin" v-if="ShowBeforlogin">
        <div class="min-h-screen bg-gray-100 p-5 flex items-center justify-center">
            <div class="container mx-auto max-w-6xl">

                <!-- Card ใหญ่สุด -->
                <div class="bg-white rounded-lg shadow-xl p-8 border border-gray-300">

                    <!-- Grid Layout (เลียนแบบ row ของ bootstrap) -->
                    <!-- แสดง 1 แถวในมือถือ, 2 แถวในแท็บเล็ต, 2 แถวในจอคอม -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">

                        <!-- 1. สมาชิก (User) -->
                        <router-link to="/TheLogin"
                            class="group block transform transition hover:-translate-y-2 duration-300">
                            <div class="border rounded-lg overflow-hidden shadow-md h-full">
                                <div
                                    class="bg-blue-600 text-white text-center py-4 text-xl font-bold group-hover:bg-blue-700 transition">
                                    เข้าสู่ระบบ
                                </div>
                                <div class="p-6 flex justify-center bg-gray-50">
                                    <!-- ใส่ path รูปให้ถูกต้อง (แนะนำให้วางรูปใน folder public/img/) -->
                                    <img src="/Login.png" alt="Login"
                                        class="w-32 h-32 object-contain">
                                </div>
                            </div>
                        </router-link>

                        <router-link to="/TheRegister"
                            class="group block transform transition hover:-translate-y-2 duration-300">
                            <div class="border rounded-lg overflow-hidden shadow-md h-full">
                                <div
                                    class="bg-green-600 text-white text-center py-4 text-xl font-bold group-hover:bg-green-700 transition">
                                    สมัครมาชิก
                                </div>
                                <div class="p-6 flex justify-center bg-gray-50">
                                    <img src="/Register.png" alt="Register"
                                        class="w-32 h-32 object-contain">
                                </div>
                            </div>
                        </router-link>

                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

    const ShowBeforlogin = computed(() => {
    const hiddenPages = ['/TheLogin', '/TheRegister','/TheSetting','/TheDashboard']; // เพิ่ม path ที่อยากซ่อนได้ที่นี่
    // ถ้า path ปัจจุบันอยู่ในรายการ hiddenPages ให้ return false (ซ่อน)
    return !hiddenPages.includes(route.path);
});
</script>