<script setup lang="ts">
import { useTaskStore } from "@/stores/task";
import { computed } from "vue";
import Task from "@/components/task/Task.vue";
import { type Task as TaskType } from "@/models/task";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLLMTask } from "@/llm";

const taskStore = useTaskStore()
const tasks = computed(() => taskStore.getTasks)

// Add sample data for testing
const exampleTask: TaskType = {
    subTasks: [],
    id: "1",
    title: "Do homework",
    description: "This is a test task.",
    completed: false,
    dueDate: new Date(),
    createdDate: new Date(),
    priority: 2
}
taskStore.addTask(exampleTask)

const { status, run, download } = useLLMTask('generation')

function breakDownTask(taskId: string) {
    const task = tasks.value.find((task: TaskType) => task.id === taskId);
    if (!task) {
        return;
    }
    const generationInput = [
        {
            role: 'system',
            content: 'You are a task management assistant. Break tasks into smaller subtasks. You must ONLY return a valid JSON array of strings. Example output format: ["First subtask", "Second subtask", "Third subtask"]. ONLY RETURN THE ARRAY!'
        },
        {
            role: 'user',
            content: `Break this task into 3-5 subtasks. Return only a JSON array of strings.
    Task: ${task?.title}
    Description: ${task?.description || ''}
    Expected format: ["Subtask 1", "Subtask 2", "Subtask 3"]`
        }
    ]

    run(generationInput).then(() => console.log('Test'));
}

const disableBreakDownTaskButton = computed(() => status.value !== 'idle')
</script>


<template>
    <Card>
        <CardHeader class="pb-2">
            <CardTitle class="messages-lg font-semibold">Aufgaben</CardTitle>
            <CardDescription>{{ tasks.length }} Aufgaben</CardDescription>
        </CardHeader>
        <CardContent>
            {{ download }}
            <div v-for="task in tasks" :key="task.id">
                <Task :task="task" @update:task="taskStore.updateTask(task.id, $event)"
                      :disableBreakDownTaskButton="disableBreakDownTaskButton"
                      @breakdown-task="breakDownTask(task.id)"/>
            </div>

            <!-- Add new task button -->
            <Input
                type="messages"
                placeholder="Füge eine neue Aufgabe hinzu"
                @keyup.enter="taskStore.addTaskFromName($event.target.value)"
                class="mt-4"
            />
        </CardContent>
    </Card>
</template>
