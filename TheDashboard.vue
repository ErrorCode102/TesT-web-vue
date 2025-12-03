<template>
  <div class="TheDashboard">
    <div class="max-w mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">IoT Sensor Dashboard</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center">
          <h5 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">AVG Temp (24h)</h5>
          <h1 class="text-5xl font-extrabold mb-1" :style="{ color: averageStats.tempColor }">
            {{ averageStats.avgTemp.toFixed(1) }} °C
          </h1>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center">
          <h5 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">AVG Humidity (24h)</h5>
          <h1 class="text-5xl font-extrabold text-blue-500 mb-1">
            {{ averageStats.avgHum.toFixed(1) }} %
          </h1>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h5 class="text-lg font-semibold text-gray-700 mb-2">Max Temperature</h5>
          <p class="text-3xl font-bold text-red-500">{{ maxTemp.toFixed(1) }} °C</p>
          <p class="text-sm text-gray-500 mt-2">Time: {{ maxTempTime }}</p>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h5 class="text-lg font-semibold text-gray-700 mb-2">System Status</h5>
          <p v-if="isOnline" class="text-3xl font-bold text-green-500 animate-pulse">
            Online
          </p>
          <p v-else class="text-3xl font-bold text-red-500">
            Offline
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Last seen: {{ lastSeenTime }}
          </p>
        </div>

      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="lg:col-span-3">
          <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h5 class="text-xl font-semibold text-gray-800 mb-4">Sensor Trends (Temp & Humid)</h5>
            <div class="h-80 w-full">
              <Line v-if="chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
              <div v-else class="h-full flex items-center justify-center text-gray-400">
                รอข้อมูลกราฟ...
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3">
          <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full">
            <h5 class="text-xl font-semibold text-gray-800 mb-4">Recent Logs</h5>
            <div class="overflow-y-auto h-80">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Temp</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Humid</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(reading, index) in recentReadings" :key="index">
                    <td class="px-3 py-2 whitespace-nowrap text-sm font-bold" :class="getTempColorClass(reading.value)">
                      {{ reading.value.toFixed(1) }} °C
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm font-bold text-blue-500">
                      {{ reading.humidity.toFixed(1) }} %
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {{ reading.timestamp }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

// Import Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const router = useRouter();
const socket = io('http://localhost:3000'); 

// --- State Variables ---
const recentReadings = ref([]);
const averageStats = ref({ avgTemp: 0, avgHum: 0, tempColor: '#374151' });
const maxTemp = ref(0);
const maxTempTime = ref('-');

// --- Status State ---
const isOnline = ref(false);
const lastSeenTime = ref('-');
const lastDataTimestamp = ref(0); 
let onlineCheckInterval = null;

// --- Chart Config (แก้ไขตรงนี้) ---
const chartData = computed(() => {
  const reversedData = [...recentReadings.value].reverse();
  return {
    labels: reversedData.map(item => item.timestamp.split(' ')[1]),
    datasets: [
      {
        label: 'Temp (°C)',
        backgroundColor: '#ef4444', // สีแดง
        borderColor: '#ef4444',
        data: reversedData.map(item => item.value),
        tension: 0.4,
        yAxisID: 'y' // ผูกกับแกน Y ซ้าย
      },
      {
        label: 'Humidity (%)', // เพิ่มเส้นความชื้น
        backgroundColor: '#3b82f6', // สีฟ้า
        borderColor: '#3b82f6',
        data: reversedData.map(item => item.humidity), // ดึงค่า humidity
        tension: 0.4,
        yAxisID: 'y1' // ผูกกับแกน Y ขวา
      }
    ]
  }
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index', // เอาเมาส์ชี้แล้วขึ้นทั้ง 2 ค่า
    intersect: false,
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left', // แกนอุณหภูมิอยู่ซ้าย
      title: { display: true, text: 'Temperature (°C)' }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right', // แกนความชื้นอยู่ขวา
      title: { display: true, text: 'Humidity (%)' },
      grid: {
        drawOnChartArea: false, // ซ่อนเส้นตารางของแกนขวาจะได้ไม่รก
      },
    },
  }
};

// --- API & Logic ---
const fetchData = async () => {
  const token = localStorage.getItem('token');
  if (!token) { router.push('/TheLogin'); return; }

  try {
    const response = await axios.get('http://localhost:3000/api/sensor-data', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data;
    const avg = data.average || {};
    
    averageStats.value.avgTemp = Number(avg.avg_temp) || 0;
    averageStats.value.avgHum = Number(avg.avg_hum) || 0;
    averageStats.value.tempColor = averageStats.value.avgTemp > 30 ? '#ef4444' : '#10b981';

    const historyList = Array.isArray(data.history) ? data.history : [];
    recentReadings.value = historyList.map(item => ({
      sensor: 'Sensor 1',
      value: Number(item.temperature), 
      humidity: Number(item.humidity), 
      timestamp: new Date(item.received_at).toLocaleString('th-TH')
    }));

    if (historyList.length > 0) {
      const maxRecord = historyList.reduce((prev, current) => 
        (Number(prev.temperature) > Number(current.temperature)) ? prev : current
      );
      maxTemp.value = Number(maxRecord.temperature) || 0;
      maxTempTime.value = new Date(maxRecord.received_at).toLocaleTimeString('th-TH');

      const latestData = historyList[0];
      if (latestData) {
        lastDataTimestamp.value = new Date(latestData.received_at).getTime();
        lastSeenTime.value = new Date(latestData.received_at).toLocaleTimeString('th-TH');
        checkOnlineStatus();
      }
    }

  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      router.push('/TheLogin');
    }
  }
};

const getTempColorClass = (temp) => {
  const val = Number(temp);
  if (val >= 35) return 'text-red-600 font-bold';
  if (val >= 25) return 'text-green-600';
  return 'text-blue-600';
};

const checkOnlineStatus = () => {
  const now = Date.now();
  const diff = now - lastDataTimestamp.value;
  if (diff > 60000) { 
    isOnline.value = false;
  } else {
    isOnline.value = true;
  }
};

// --- Lifecycle ---
onMounted(() => {
  fetchData();
  
  socket.on('new_sensor_data', () => {
    fetchData();
  });

  onlineCheckInterval = setInterval(() => {
    checkOnlineStatus();
  }, 1000);
});

onUnmounted(() => {
  if (socket) socket.disconnect();
  if (onlineCheckInterval) clearInterval(onlineCheckInterval);
});
</script>