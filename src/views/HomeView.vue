<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Tasks from '@/components/task/Tasks.vue'
import Calendar from '@/components/Calendar.vue'
import { useTaskStore } from '@/stores/task.ts'
import GptCookingSuggestion from '@/components/suggestion/GptCookingSuggestion.vue'

const taskStore = useTaskStore()
const taskCount = computed(() => taskStore.flatTasks.length)
</script>

<template>
  <div class="container mx-auto px-2 sm:px-4 py-4">

    <!-- Quick Stats Section -->
    <div class="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-4">
      <Card class="w-full shadow-md rounded-xl">
        <CardHeader class="pb-2">
          <CardTitle class="font-semibold text-lg sm:text-xl">Aufgaben</CardTitle>
          <CardDescription class="text-sm sm:text-base">{{ taskCount }} Aufgaben</CardDescription>
        </CardHeader>
        <CardContent>
          <Tasks />
        </CardContent>
      </Card>

      <Card class="w-full shadow-md rounded-xl mt-4 md:mt-0">
        <CardHeader class="pb-2">
          <CardTitle class="font-semibold text-lg sm:text-xl">Kalender</CardTitle>
          <CardDescription class="text-sm sm:text-base">Dein Kalender.</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar />
        </CardContent>
      </Card>
    </div>

    <Separator orientation="horizontal" class="my-8 opacity-70" />

    <section class="space-y-4">
      <GptCookingSuggestion />
    </section>

  </div>
</template>
