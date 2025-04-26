<script setup lang="ts">
import '@/styles/global.css'

import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
    <AppHeader />

    <!-- App Container -->
    <main class="flex-1 px-4 py-2 space-y-4 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>
