<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BrainCircuit, Utensils, Zap } from 'lucide-vue-next'
import Suggestions from '@/components/suggestion/Suggestions.vue'
import { searchYouTube } from '@/lib/suggestions.ts'
import Tasks from '@/components/task/Tasks.vue'
import Calendar from '@/components/Calendar.vue'
import { useTaskStore } from '@/stores/task.ts'
import Summary from '@/components/Summary.vue'

// Search Suggestions
const workoutSuggestions = ref(['Ganzkörper', 'Cardio', 'Yoga', 'Bauchmuskeln', 'Rücken'])
const meditationSuggestions = ref(['Achtsamkeit', 'Schlaf', 'Stressabbau', '5 Minuten', 'Morgen'])
const recipeSuggestions = ref(['Schnell', 'Gesund', 'Vegan', 'Hähnchen', 'Salat', 'Frühstück'])

const taskStore = useTaskStore()
const taskCount = computed(() => taskStore.flatTasks.length)
</script>

<template>
  <div class="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
    <!-- Main Content Area -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Left Column: Summary & Tasks (stacked vertically) -->
      <div class="lg:w-1/2 flex flex-col gap-4">
        <!-- Summary is already a card component -->
        <Summary />

        <!-- Tasks Card -->
        <Card class="w-full max-w-2xl mx-auto">
          <CardHeader class="pb-2">
            <div class="flex justify-between items-center">
              <CardTitle class="font-semibold">Aufgaben</CardTitle>
              <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {{ taskCount }}
              </span>
            </div>
          </CardHeader>
          <CardContent class="overflow-y-auto max-h-[220px]">
            <Tasks />
          </CardContent>
        </Card>
      </div>

      <!-- Right Column: Calendar -->
      <Card class="lg:w-1/2">
        <CardHeader class="pb-2">
          <CardTitle class="font-semibold">Kalender</CardTitle>
          <CardDescription>Dein Kalender</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar />
        </CardContent>
      </Card>
    </div>

    <!-- Suggestions Sections - Compact and Consistent Design -->
    <div class="mt-6 space-y-6">
      <!-- Workout Suggestions -->
      <Card class="overflow-hidden border-l-4 border-rose-500">
        <CardHeader class="bg-rose-50 pb-2">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-rose-100 p-1.5">
              <Zap class="h-5 w-5 text-rose-600" />
            </div>
            <CardTitle class="font-semibold">Workouts Vorschläge</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="pt-4">
          <Suggestions
            type="youtube"
            :search-function="searchYouTube"
            :search-term-suggestions="workoutSuggestions"
          />
        </CardContent>
      </Card>

      <!-- Meditation Suggestions -->
      <Card class="overflow-hidden border-l-4 border-indigo-500">
        <CardHeader class="bg-indigo-50 pb-2">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-indigo-100 p-1.5">
              <BrainCircuit class="h-5 w-5 text-indigo-600" />
            </div>
            <CardTitle class="font-semibold">Meditation Vorschläge</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="pt-4">
          <Suggestions
            type="youtube"
            :search-function="searchYouTube"
            :search-term-suggestions="meditationSuggestions"
          />
        </CardContent>
      </Card>

      <!-- Recipe Suggestions -->
      <Card class="overflow-hidden border-l-4 border-emerald-500">
        <CardHeader class="bg-emerald-50 pb-2">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-emerald-100 p-1.5">
              <Utensils class="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle class="font-semibold">Rezepte Vorschläge</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="pt-4">
          <Suggestions
            type="youtube"
            :search-function="searchYouTube"
            :search-term-suggestions="recipeSuggestions"
          />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
