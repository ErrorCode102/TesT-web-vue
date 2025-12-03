import { createRouter, createWebHistory } from 'vue-router'
import TheRegister from '@/views/TheRegister.vue'
import TheLogin from '@/views/TheLogin.vue'
import TheDashboard from '@/views/TheDashboard.vue'
import TheSetting from '@/views/TheSetting.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/TheRegister',
      name: 'TheRegister',
      component: TheRegister,
    },
    {
      path: '/TheLogin' ,
      name: 'TheLogin' ,
      component: TheLogin,
    },
    {
      path: '/TheDashboard' ,
      name: 'TheDashboard' ,
      component: TheDashboard,
    },
    {
      path: '/TheSetting' ,
      name: 'TheSetting' ,
      component: TheSetting,
    },

  ],
})

export default router
