<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Priority, type Task } from '@/models/task'
import { useTaskStore } from '@/stores/task.ts'
import { Input } from '@/components/ui/input'
import { WandSparkles, X } from 'lucide-vue-next'

const props = defineProps<{ task: Task }>()
const { task } = toRefs(props)
const taskStore = useTaskStore()

const isOverdue = computed(() => {
  if (!task.value.dueDate) {
    return false
  }
  return new Date(task.value.dueDate) < new Date() && !props.task.completed
})

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('de-DE', { year: '2-digit', month: '2-digit', day: '2-digit' })

const getPriorityLabel = (priority: number) => {
  switch (priority) {
    case Priority.Low:
      return 'Low'
    case Priority.Medium:
      return 'Medium'
    case Priority.High:
      return 'High'
    case Priority.Urgent:
      return 'Urgent'
    case Priority.Critical:
      return 'Critical'
    default:
      return 'Unknown'
  }
}

const getPriorityVariant = (priority: number): 'outline' | 'default' | 'destructive' | 'secondary' => {
  switch (priority) {
    case Priority.Low:
      return 'outline'
    case Priority.Medium:
      return 'secondary'
    case Priority.High:
      return 'default'
    case Priority.Urgent:
    case Priority.Critical:
      return 'destructive'
    default:
      return 'outline'
  }
}

const toggleTaskCompletion = () => {
  const updatedTask = { ...task.value, completed: !task.value.completed }
  taskStore.update(task.value.id, updatedTask)
}

const isBreakingDown = ref(false)
const handleBreakDownTask = () => {
  if (isBreakingDown.value) {
    return
  }
  isBreakingDown.value = true
  taskStore.llmBreakTaskIntoSubtasks(task.value)
    .finally(() => {
      isBreakingDown.value = false
    })
}
</script>

<template>
  <Card
    class="task-card transition-shadow hover:shadow-md border"
    :class="{
      'border-green-400 bg-green-50/30': task.completed,
      'border-red-500/50': isOverdue && !task.completed
    }"
  >
    <CardHeader class="flex flex-row items-start justify-between gap-2 pb-2">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <Checkbox
          :model-value="task.completed"
          @update:model-value="toggleTaskCompletion"
          class="mt-1"
        />
        <CardTitle
          class="flex-1 min-w-0 text-lg"
          :class="{
            'line-through text-muted-foreground': task.completed,
            'font-semibold': !task.completed
          }"
        >
          <Input
            v-model="task.title"
            class="bg-transparent border-none px-0 py-0 text-base font-medium truncate focus-visible:ring-0 focus-visible:outline-none"
            :readonly="task.completed"
          />
        </CardTitle>
      </div>
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          :disabled="isBreakingDown"
          :class="{ 'animate-pulse': isBreakingDown }"
          @click="handleBreakDownTask"
          aria-label="Break down task into subtasks"
        >
          <WandSparkles class="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          @click="taskStore.remove(task.id)"
          aria-label="Delete task"
        >
          <X class="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>

    <CardContent v-if="task.description" class="pb-2 pt-0">
      <p class="text-sm text-muted-foreground">{{ task.description }}</p>
    </CardContent>

    <CardFooter class="flex flex-col items-start pt-0 gap-2">
      <div class="flex flex-wrap gap-2">
        <Badge :variant="getPriorityVariant(task.priority)" class="text-xs">
          {{ getPriorityLabel(task.priority) }}
        </Badge>
        <Badge variant="secondary" class="text-xs">
          Created: {{ formatDate(task.createdDate) }}
        </Badge>
        <Badge
          v-if="task.dueDate"
          :variant="isOverdue ? 'destructive' : 'secondary'"
          class="text-xs"
        >
          Due: {{ formatDate(task.dueDate) }}
        </Badge>
      </div>

      <!-- Recursive Subtasks Rendering -->
      <div v-if="task.subTasks && task.subTasks.length > 0" class="w-full mt-2 space-y-2">
        <Task
          v-for="subTask in task.subTasks"
          :key="subTask.id"
          :task="subTask"
          class="ml-4"
        />

      </div>

      <Input
        type="messages"
        placeholder="Füge eine neue Aufgabe hinzu"
        @keyup.enter="taskStore.addFromTitle($event.target.value, task.id); $event.target.value = ''"
        class="mt-4"
      />
    </CardFooter>
  </Card>
</template>

<style scoped>
.task-card {
  margin-bottom: 1rem;
  transition: box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out, background 0.2s ease-in-out;
}
</style>
