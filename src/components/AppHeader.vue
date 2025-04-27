<script setup lang="ts">
import { Moon, Settings, Sun, ThermometerSnowflake, ThermometerSun } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useWeatherStore } from '@/stores/weather.ts'
import { storeToRefs } from 'pinia'
import { useDateFormat, useNow, useTimestamp } from '@vueuse/core'
import { Separator } from '@/components/ui/separator'
import { useUserStore } from '@/stores/user.ts'
import { Badge } from '@/components/ui/badge'

// --- Time & Greeting ---
const timestamp = useTimestamp({ offset: 0, interval: 1000 })
const date = computed(() => new Date(timestamp.value))
const currentDate = useDateFormat(useNow({ interval: 1000 * 60 }), 'dddd, D. MMMM YYYY, HH:mm')
const isNight = computed(() => {
  return (date.value.getHours() >= 18 || date.value.getHours() < 6)
})

const userStore = useUserStore()
const greeting = computed(() => {
  const hour = date.value.getHours()
  let g = ''
  if (isNight.value) {
    g += 'Guten Abend'
  } else if (hour >= 6 && hour < 12) {
    g += 'Guten Morgen'
  } else if (hour >= 12 && hour < 18) {
    g += 'Guten Tag'
  } else {
    g += 'Guten Abend'
  }

  if (userStore.user.name !== '') {
    g += `, ${userStore.user.name}`
  }
  return g
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
          <router-link to="/">{{ greeting }}</router-link>
        </h1>
      </div>
      <div class="flex gap-4 shrink-0">
        <div class="flex items-center gap-2">
          <Badge variant="outline">
            <Sun v-if="!isNight" class="h-4 w-4 messages-amber-500" />
            <Moon v-else class="h-4 w-4 messages-gray-500" />
            {{ currentDate }} Uhr
          </Badge>
        </div>
        <Separator orientation="vertical" class="h-4" />
        <div class="flex items-center gap-2">
          <Badge variant="secondary">
            <ThermometerSun class="h-4 w-4 messages-blue-400" v-if="weather.temperature > 10" />
            <ThermometerSnowflake class="h-4 w-4 messages-blue-400" v-if="weather.temperature < 10" />
            {{ weather.temperature }}°C
          </Badge>
        </div>
        <Separator orientation="vertical" class="h-4" />
        <Button variant="ghost" @click="$router.push('/settings')">
          <Settings />
        </Button>
      </div>
    </nav>
  </header>
</template>
