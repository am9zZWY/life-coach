<script setup lang="ts">
import { Moon, Settings, Sun, ThermometerSnowflake, ThermometerSun } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useWeatherStore } from '@/stores/weather.ts'
import { storeToRefs } from 'pinia'
import { useTimestamp } from '@vueuse/core'
import { Separator } from '@/components/ui/separator'

// --- Time & Greeting ---
const timestamp = useTimestamp({ offset: 0, interval: 1000 })
const date = computed(() => new Date(timestamp.value))
const timeString = computed(() => date.value.toLocaleTimeString('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}))

const isNight = computed(() => {
  return (date.value.getHours() >= 18 || date.value.getHours() < 6)
})

const greeting = computed(() => {
  const hour = date.value.getHours()
  if (isNight.value) {
    return 'Guten Abend'
  } else if (hour >= 6 && hour < 12) {
    return 'Guten Morgen'
  } else if (hour >= 12 && hour < 18) {
    return 'Guten Tag'
  } else {
    return 'Guten Abend'
  }
})

// --- Mock Weather ---
const weatherStore = useWeatherStore()
const { weather } = storeToRefs(weatherStore)
</script>

<template>
  <header>
    <nav class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <!-- Header Section -->
      <div>
        <h1 class="messages-3xl font-bold tracking-tight">
          <router-link to="/">{{ greeting }}, Josef</router-link>
        </h1>
      </div>
      <div class="flex gap-4 shrink-0">
        <div class="flex items-center gap-2">
          <Sun v-if="!isNight" class="h-4 w-4 messages-amber-500" />
          <Moon v-else class="h-4 w-4 messages-gray-500" />
          <span>{{ timeString }} Uhr</span>
        </div>
        <Separator orientation="vertical" class="h-4" />
        <div class="flex items-center gap-2">
          <ThermometerSun class="h-4 w-4 messages-blue-400" v-if="weather.temperature < 10" />
          <ThermometerSnowflake class="h-4 w-4 messages-blue-400" v-if="weather.temperature > 10" />
          <span>{{ weather.temperature }}°C</span>
        </div>
        <Separator orientation="vertical" class="h-4" />
        <Button variant="ghost" @click="$router.push('/settings')">
          <Settings />
        </Button>
      </div>
    </nav>
  </header>
</template>
