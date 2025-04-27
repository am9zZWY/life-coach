<script setup lang="ts">
import { computed, ref, toRefs } from 'vue'
import { Priority, type Task } from '@/models/task'
import { useTaskStore } from '@/stores/task.ts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Check, ChevronRight, WandSparkles, X } from 'lucide-vue-next'

const props = defineProps<{ task: Task }>()
const { task } = toRefs(props)
const taskStore = useTaskStore()
const isCollapsed = ref(true)
const isBreakingDown = ref(false)
const isEditing = ref(false)
const editedTitle = ref('')

const isOverdue = computed(() =>
  task.value.dueDate && new Date(task.value.dueDate) < new Date() && !task.value.completed
)

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('de-DE', { year: '2-digit', month: '2-digit', day: '2-digit' })

const getPriorityVariant = (priority: number) => {
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

const handleBreakDownTask = () => {
  if (isBreakingDown.value) {
    return
  }
  isBreakingDown.value = true
  taskStore.llmBreakTaskIntoSubtasks(task.value).finally(() => {
    isBreakingDown.value = false
    isCollapsed.value = false
  })
}

const startEditing = () => {
  editedTitle.value = task.value.title
  isEditing.value = true
}

const saveEditing = () => {
  if (editedTitle.value.trim()) {
    taskStore.update(task.value.id, { ...task.value, title: editedTitle.value })
  }
  isEditing.value = false
}
</script>

<template>
  <div class="border-b">
    <!-- Main task row - clean and minimal -->
    <div class="flex items-center px-4 py-1 gap-3 group">
      <Checkbox
        :checked="task.completed"
        @update:checked="toggleTaskCompletion"
      />

      <Input
        v-if="isEditing"
        v-model="editedTitle"
        type="text"
        placeholder="Aufgabe bearbeiten"
        class="flex-grow"
        @keyup.enter="saveEditing"
        @blur="saveEditing"
      />
      <span
        v-else
        class="flex-grow truncate"
        :class="{ 'line-through text-muted-foreground': task.completed }"
        @dblclick="startEditing"
      >
        {{ task.title }}
      </span>

      <!-- Action buttons - shown on hover -->
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8"
          :disabled="isBreakingDown"
          :class="{ 'animate-pulse': isBreakingDown }"
          @click="handleBreakDownTask"
          title="Break down task"
        >
          <WandSparkles class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8"
          @click="taskStore.remove(task.id)"
          title="Delete task"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <!-- Chevron for details expansion -->
      <Button
        variant="ghost"
        size="sm"
        @click="isCollapsed = !isCollapsed"
        class="h-8 w-8"
      >
        <ChevronRight
          class="h-4 w-4 transition-transform duration-200"
          :class="{ 'rotate-90': !isCollapsed }"
        />
      </Button>
    </div>

    <!-- Details section - only visible when expanded -->
    <div v-if="!isCollapsed" class="border-t px-4 py-3 space-y-3">
      <!-- Description if exists -->
      <p v-if="task.description" class="text-muted-foreground text-sm">
        {{ task.description }}
      </p>

      <div v-if="task.subTasks?.length" class="space-y-2 mt-2">
        <div v-for="subTask in task.subTasks" :key="subTask.id">
          <Task :task="subTask" />
        </div>
      </div>

      <!-- Add subtask input -->
      <div class="flex gap-2">
        <Input
          type="text"
          placeholder="Unteraufgabe hinzufügen"
          class="flex-grow"
          @keyup.enter="($event.target as HTMLInputElement).value &&
            taskStore.addFromTitle(($event.target as HTMLInputElement).value, task.id);
            ($event.target as HTMLInputElement).value = ''"
        />
        <Button
          variant="outline"
          size="icon"
          @click="($event.target.previousElementSibling as HTMLInputElement).value &&
            taskStore.addFromTitle(($event.target.previousElementSibling as HTMLInputElement).value, task.id);
            ($event.target.previousElementSibling as HTMLInputElement).value = ''"
        >
          <Check class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>


<style scoped>
.task-card:hover .opacity-0 {
  @apply opacity-100;
}
</style>
