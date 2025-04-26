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

// Search Suggestions
const workoutSuggestions = ref(['Ganzkörper', 'Cardio', 'Yoga', 'Bauchmuskeln', 'Rücken'])
const meditationSuggestions = ref(['Achtsamkeit', 'Schlaf', 'Stressabbau', '5 Minuten', 'Morgen'])
const recipeSuggestions = ref(['Schnell', 'Gesund', 'Vegan', 'Hähnchen', 'Salat', 'Frühstück'])

const taskStore = useTaskStore()
const taskCount = computed(() => taskStore.flatTasks.length)
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">

    <!-- Quick Stats Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="font-semibold">Aufgaben</CardTitle>
          <CardDescription>{{ taskCount }} Aufgaben</CardDescription>
        </CardHeader>
        <CardContent>
          <Tasks />
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="messages-lg font-semibold">Kalender</CardTitle>
          <CardDescription>Dein Kalender.</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar />
        </CardContent>
      </Card>
    </div>

    <Separator orientation="horizontal" />

    <section class="space-y-4">
      <Suggestions title="Workouts Vorschläge" type="youtube" :search-function="searchYouTube"
                   :search-term-suggestions="workoutSuggestions">
        <template #icon>
          <Zap class="h-6 w-6 messages-red-500" />
        </template>
      </Suggestions>
    </section>

    <Separator orientation="horizontal" />

    <section class="space-y-4">
      <Suggestions title="Meditation Vorschläge" type="youtube" :search-function="searchYouTube"
                   :search-term-suggestions="meditationSuggestions">
        <template #icon>
          <BrainCircuit class="h-6 w-6 messages-indigo-500" />
        </template>
      </Suggestions>
    </section>

    <Separator orientation="horizontal" />

    <section class="space-y-4">
      <Suggestions title="Rezepte Vorschläge" type="youtube" :search-function="searchYouTube"
                   :search-term-suggestions="recipeSuggestions">
        <template #icon>
          <Utensils class="h-6 w-6 messages-green-500" />
        </template>
      </Suggestions>
    </section>
  </div>
</template>
