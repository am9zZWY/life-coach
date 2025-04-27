<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Tasks from '@/components/task/Tasks.vue'
import Calendar from '@/components/Calendar.vue'
import { useTaskStore } from '@/stores/task.ts'
import GptCookingSuggestion from '@/components/suggestion/GptCookingSuggestion.vue'
import Summary from '@/components/Summary.vue'

const taskStore = useTaskStore()
const taskCount = computed(() => taskStore.flatTasks.length)
</script>

<template>
  <div class="container mx-auto px-2 sm:px-4 py-4">
    <div class="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <!-- Main Content Area -->
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Left Column: Summary & Tasks (stacked vertically) -->
        <div class="lg:w-1/2 flex flex-col gap-4">
          <!-- Summary is already a card component -->
          <Summary />

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

          <Card class="w-full shadow-md rounded-xl mt-4 md:mt-0">
            <!-- Right Column: Calendar -->
            <Card class="lg:w-1/2">
              <CardHeader class="pb-2">
                <CardTitle class="font-semibold text-lg sm:text-xl">Kalender</CardTitle>
                <CardDescription class="text-sm sm:text-base">Dein Kalender.</CardDescription>
                <CardTitle class="font-semibold">Kalender</CardTitle>
                <CardDescription>Dein Kalender</CardDescription>
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
