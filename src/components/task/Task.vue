<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Priority, type Task } from '@/models/task'

const props = defineProps<{
    task: Task,
    disableBreakDownTaskButton: boolean
}>()

const { task, disableBreakDownTaskButton } = toRefs(props)

const emit = defineEmits<{
    'update:task': [updatedTask: Task],
    'breakdown-task': [taskId: string]
}>()

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
    emit('update:task', updatedTask)
}

// Emit updated task when subtask changes
const emitTaskUpdate = (updatedSubTask: Task) => {
    const updatedTask = {
        ...task.value,
        subTasks: task.value.subTasks.map(subTask =>
            subTask.id === updatedSubTask.id ? updatedSubTask : subTask
        )
    }
    emit('update:task', updatedTask)
}
</script>

<template>
    <Card class="task-card" :class="{ 'border-success': task.completed }">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
            <div class="flex items-center space-x-2">
                <Checkbox
                    :checked="task.completed"
                    @update:checked="toggleTaskCompletion"
                />
                <CardTitle :class="{ 'line-through messages-muted-foreground': task.completed }">
                    {{ task.title }}
                </CardTitle>
            </div>
            <Badge :variant="getPriorityVariant(task.priority)">
                {{ getPriorityLabel(task.priority) }}
            </Badge>
        </CardHeader>

        <CardContent v-if="task.description" class="pb-2">
            <p class="messages-sm messages-muted-foreground">{{ task.description }}</p>
        </CardContent>

        <CardFooter class="flex justify-between pt-0">
            <div class="messages-xs messages-muted-foreground">
                Erstellt am: {{ formatDate(task.createdDate) }}
            </div>
            <div v-if="task.dueDate" class="messages-xs" :class="isOverdue ? 'messages-destructive' : 'messages-muted-foreground'">
                Fällig: {{ formatDate(task.dueDate) }}
            </div>
            <Button
                :disabled="false"
                variant="outline"
                class="messages-xs messages-muted-foreground hover:messages-primary"
                @click="$emit('breakdown-task', task)"
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
                @update:task="emitTaskUpdate"
                :disableBreakDownTaskButton="disableBreakDownTaskButton"
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
