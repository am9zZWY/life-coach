<script setup lang="ts">
import { useTaskStore } from '@/stores/task'
import { computed } from 'vue'
import Task from '@/components/task/Task.vue'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const taskStore = useTaskStore()
const tasks = computed(() => taskStore.tasks)
const taskCount = computed(() => taskStore.flatTasks.length)
</script>


<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="font-semibold">Aufgaben</CardTitle>
      <CardDescription>{{ taskCount }} Aufgaben</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-for="task in tasks" :key="task.id">
        <Task :task="task" />
      </div>

      <!-- Add new task button -->
      <Input
        type="messages"
        placeholder="Füge eine neue Aufgabe hinzu"
        @keyup.enter="taskStore.addFromTitle($event.target.value); $event.target.value = ''"
        class="mt-4"
      />
    </CardContent>
  </Card>
</template>
