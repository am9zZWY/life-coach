// noinspection t

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { type Task } from '@/models/task';
import { v4 as uuidv4 } from 'uuid';

export const useTaskStore = defineStore('tasks', () => {
        // State
        const tasks = ref<Task[]>([]);

        // Getters
        const getTasks = computed(() => tasks.value);

        const getTaskById = computed(() => {
            return (id: string) => tasks.value.find(task => task.id === id);
        });

        const getCompletedTasks = computed(() => {
            return tasks.value.filter(task => task.completed);
        });

        const getPendingTasks = computed(() => {
            return tasks.value.filter(task => !task.completed);
        });

        const getTasksByPriority = computed(() => {
            return (priority: number) => tasks.value.filter(task => task.priority === priority);
        });

        function addTaskFromName(taskName: string): string {
            const newTask: Task = {
                id: uuidv4(),
                title: taskName,
                description: '',
                createdDate: new Date(),
                dueDate: undefined,
                priority: 3, // Default priority
                completed: false,
                subTasks: []
            };

            tasks.value.push(newTask);
            return newTask.id;
        }

        // Actions
        function addTask(task: Omit<Task, 'id' | 'subTasks'> & { subTasks?: Task[] }): string {
            const newTask: Task = {
                id: uuidv4(),
                ...task,
                subTasks: task.subTasks || [],
                createdDate: new Date() // Default to current date if not provided
            };

            tasks.value.push(newTask);
            return newTask.id;
        }

        function removeTask(taskId: string): boolean {
            const initialLength = tasks.value.length;
            tasks.value = tasks.value.filter(task => task.id !== taskId);

            // Also remove from subtasks if it exists there
            tasks.value.forEach(task => {
                task.subTasks = task.subTasks.filter(subTask => subTask.id !== taskId);
            });

            return tasks.value.length < initialLength;
        }

        function updateTask(taskId: string, updates: Partial<Omit<Task, 'id'>>): boolean {
            const taskIndex = tasks.value.findIndex(task => task.id === taskId);

            if (taskIndex === -1) {
                return false;
            }

            tasks.value[taskIndex] = {
                ...tasks.value[taskIndex],
                ...updates
            };

            return true;
        }

        function toggleTaskCompletion(taskId: string): boolean {
            const task = tasks.value.find(t => t.id === taskId);
            if (!task) {
                return false;
            }

            task.completed = !task.completed;
            return true;
        }

        function sortTasks(sortBy: 'priority' | 'dueDate' | 'createdDate', ascending = true): void {
            tasks.value.sort((a, b) => {
                if (sortBy === 'priority') {
                    return ascending ? a.priority - b.priority : b.priority - a.priority;
                } else if (sortBy === 'dueDate') {
                    if (!a.dueDate) {
                        return ascending ? 1 : -1;
                    }
                    if (!b.dueDate) {
                        return ascending ? -1 : 1;
                    }
                    return ascending
                        ? a.dueDate.getTime() - b.dueDate.getTime()
                        : b.dueDate.getTime() - a.dueDate.getTime();
                } else { // createdDate
                    return ascending
                        ? a.createdDate.getTime() - b.createdDate.getTime()
                        : b.createdDate.getTime() - a.createdDate.getTime();
                }
            });
        }

        function breakTaskIntoSubtasks(
            taskId: string,
            subTasksToAdd: Array<Omit<Task, 'id' | 'subTasks'>>
        ): boolean {
            const task = tasks.value.find(t => t.id === taskId);
            if (!task) {
                return false;
            }

            // Create new subtasks with IDs
            const newSubTasks = subTasksToAdd.map(subTask => ({
                id: uuidv4(),
                ...subTask,
                subTasks: [],
                createdDate: new Date()
            }));

            task.subTasks.push(...newSubTasks);
            return true;
        }

        function moveSubtaskToMain(subtaskId: string): boolean {
            // Find which task contains this subtask
            for (const task of tasks.value) {
                const subtaskIndex = task.subTasks.findIndex(st => st.id === subtaskId);
                if (subtaskIndex !== -1) {
                    // Get the subtask
                    const subtask = task.subTasks[subtaskIndex];
                    // Remove from subtasks
                    task.subTasks.splice(subtaskIndex, 1);
                    // Add to main tasks
                    tasks.value.push(subtask);
                    return true;
                }
            }
            return false;
        }

        return {
            // State
            tasks,

            // Getters
            getTasks,
            getTaskById,
            getCompletedTasks,
            getPendingTasks,
            getTasksByPriority,

            // Actions
            addTask,
            addTaskFromName,
            removeTask,
            updateTask,
            toggleTaskCompletion,
            sortTasks,
            breakTaskIntoSubtasks,
            moveSubtaskToMain
        };
    }
);
