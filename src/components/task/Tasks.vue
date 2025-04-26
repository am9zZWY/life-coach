<script setup lang="ts">
import { useTaskStore } from '@/stores/task'
import { computed, ref } from 'vue'
import Task from '@/components/task/Task.vue'
import { Input } from '@/components/ui/input'
import { WandSparkles } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

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
  <div>
    <div class="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        :disabled="isGenerating"
        :class="{ 'animate-pulse': isGenerating }"
        @click="generateTasksFromCalendar"
        aria-label="Break down task into subtasks"
      >
        <WandSparkles class="w-4 h-4" />
      </Button>
    </div>
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
  </div>
</template>
