<script setup lang="ts">
import { useTaskStore } from '@/stores/task'
import { computed, ref } from 'vue'
import Task from '@/components/task/Task.vue'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const taskStore = useTaskStore()
const tasks = computed(() => taskStore.tasks)
const taskCount = computed(() => taskStore.flatTasks.length)

const isGenerating = ref(false)
const generateTasksFromCalendar = () => {
  if (isGenerating.value) {
    return
  }
  isGenerating.value = true
  taskStore.llmGenerateTasksFromCalendar()
    .finally(() => {
      isGenerating.value = false
    })
}
</script>


<template>
  <Card class="shadow-md rounded-xl">
    <CardHeader class="pb-2">
      <div class="flex justify-between items-center">
        <CardTitle class="font-semibold text-lg">Aufgaben</CardTitle>
        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {{ taskCount }}
              </span>
      </div>
    </CardHeader>
    <CardContent class="overflow-y-auto px-3">
      <div>
        <div class="tasks-list">
          <Task v-for="task in tasks" :key="task.id" :task="task" />
        </div>

        <!-- Add new task button -->
        <Input
          type="text"
          placeholder="Füge eine neue Aufgabe hinzu"
          @keyup.enter="taskStore.addFromTitle($event.target.value); $event.target.value = ''"
          class="mt-4"
        />
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.tasks-list > :not(:last-child) {
  @apply border-b;
}
</style>
