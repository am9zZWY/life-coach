<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Priority, type Task } from '@/models/task'
import { useTaskStore } from '@/stores/task.ts'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  task: Task,
}>()

const { task } = toRefs(props)

const taskStore = useTaskStore()

// Check if task is overdue
const isOverdue = computed(() => {
  if (!task.value.dueDate) {
    return false
  }
  return new Date(task.value.dueDate) < new Date() && !props.task.completed
})

// Format date to readable string
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get priority label based on priority number
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

// Get badge variant based on priority
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

// Toggle task completion
const toggleTaskCompletion = () => {
  const updatedTask = {
    ...task.value,
    completed: !task.value.completed
  }
  taskStore.updateTask(task.value.id, updatedTask)
}

const isBreakingDown = ref(false)
const handleBreakDownTask = () => {
  if (isBreakingDown.value) {
    return
  }

  isBreakingDown.value = true
  taskStore.llmBreakTaskIntoSubtasks(task.value)
    .then(() => {
      isBreakingDown.value = false
    }).catch(() => {
    isBreakingDown.value = false
  })
}
</script>

<template>
  <Card class="task-card shadow-none" :class="{ 'border-success': task.completed }">
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <div class="flex items-center space-x-2">
        <Checkbox
          :model-value="task.completed"
          @update:model-value="toggleTaskCompletion"
        />
        <CardTitle class="cursor-pointer" :class="{ 'line-through messages-muted-foreground': task.completed }">
          <Input v-model="task.title" />
        </CardTitle>
      </div>
      <Badge :variant="getPriorityVariant(task.priority)">
        {{ getPriorityLabel(task.priority) }}
      </Badge>
    </CardHeader>

    <CardContent v-if="task.description" class="pb-2">
      <p class="messages-sm messages-muted-foreground">{{ task.description }}</p>
    </CardContent>

    <CardFooter class="flex justify-between pt-0" v-if="(task.dueDate || task.createdDate)">
      <div class="flex flex-col space-y-1">
        <Badge class="messages-xs messages-muted-foreground">
          Erstellt am: {{ formatDate(task.createdDate) }}
        </Badge>
        <Badge v-if="task.dueDate" class="messages-xs"
               :class="isOverdue ? 'messages-destructive' : 'messages-muted-foreground'">
          Fällig: {{ formatDate(task.dueDate) }}
        </Badge>
      </div>
      <Button
        variant="outline"
        size="sm"
        class="messages-xs messages-muted-foreground hover:messages-primary"
        :class="{ 'animate-pulse cursor-not-allowed': isBreakingDown }"
        @click="handleBreakDownTask"
      >
        Runterbrechen
      </Button>
    </CardFooter>

    <!-- Render subtasks recursively if they exist -->
    <div v-if="task.subTasks && task.subTasks.length > 0" class="pl-6 mt-2 border-l">
      <Task
        v-for="subTask in task.subTasks"
        :key="subTask.id"
        :task="subTask"
      />
    </div>
  </Card>
</template>

<style scoped>
.task-card {
  margin-bottom: 0.75rem;
  transition: all 0.2s;
}

.task-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
