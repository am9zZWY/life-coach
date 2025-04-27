<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Tasks from '@/components/task/Tasks.vue'
import Calendar from '@/components/Calendar.vue'
import { useTaskStore } from '@/stores/task.ts'
import Summary from '@/components/Summary.vue'
import CookingSuggestion from '@/components/CookingSuggestion.vue'

const taskStore = useTaskStore()
const taskCount = computed(() => taskStore.flatTasks.length)
</script>

<template>
  <div class="container mx-auto">
    <!-- Main Content Area -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Left Column: Summary & Tasks (stacked vertically) -->
      <div class="lg:w-1/2 flex flex-col gap-4">
        <!-- Summary is already a card component -->
        <Summary />

        <!-- Tasks Card (only one tasks card) -->
        <Card class="shadow-md rounded-xl">
          <CardHeader class="pb-2">
            <div class="flex justify-between items-center">
              <CardTitle class="font-semibold text-lg">Aufgaben</CardTitle>
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
          <CardTitle class="font-semibold text-lg">Kalender</CardTitle>
          <CardDescription>Dein Kalender.</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar />
        </CardContent>
      </Card>
    </div>

    <Separator orientation="horizontal" class="my-8 opacity-70" />

    <!-- Cooking Suggestion Section -->
    <section>
      <CookingSuggestion />
    </section>
  </div>
</template>
