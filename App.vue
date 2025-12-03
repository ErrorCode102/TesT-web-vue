<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <header>
    <TheNavBar></TheNavBar>
  </header>
  <Beforlogin></Beforlogin>
  <RouterView />
</template>

<script>
import TheNavBar from './components/TheNavBar.vue';
import Beforlogin from './components/Beforlogin.vue';

export default {
  name: 'app',
  component: {
    TheNavBar,
    Beforlogin,
  }
}
</script>