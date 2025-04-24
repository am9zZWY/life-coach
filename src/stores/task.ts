// noinspection t

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { type Task } from '@/models/task'
import { v4 as uuidv4 } from 'uuid'
import type { LLMConfig, TextGenerationInput } from '@/llm'
import { useWebLLMTextGeneration } from '@/llm'

export const useTaskStore = defineStore('tasks', () => {
    // State
    const tasks = ref<Task[]>([])

    // Getters
    const getTasks = computed(() => tasks.value)

    const getTaskById = computed(() => {
      return (id: string) => tasks.value.find(task => task.id === id)
    })

    const getCompletedTasks = computed(() => {
      return tasks.value.filter(task => task.completed)
    })

    const getPendingTasks = computed(() => {
      return tasks.value.filter(task => !task.completed)
    })

    const getTasksByPriority = computed(() => {
      return (priority: number) => tasks.value.filter(task => task.priority === priority)
    })
    const getTotalTasks = computed(() => getAllTasks.value.length)
    const getAllTasks = computed(() => getAllTasksR(tasks.value))

    function getAllTasksR(base: Task[]): Task[] {
      return [...base, ...base.flatMap(task => getAllTasksR(task.subTasks))]
    }

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
      }

      tasks.value.push(newTask)
      return newTask.id
    }

    // Actions
    function addTask(task: Omit<Task, 'id' | 'subTasks'> & { subTasks?: Task[] }): string {
      const newTask: Task = {
        id: uuidv4(),
        ...task,
        subTasks: task.subTasks || [],
        createdDate: new Date() // Default to current date if not provided
      }

      tasks.value.push(newTask)
      return newTask.id
    }

    function removeTask(taskId: string): boolean {
      const initialLength = tasks.value.length
      tasks.value = tasks.value.filter(task => task.id !== taskId)

      // Also remove from subtasks if it exists there
      tasks.value.forEach(task => {
        task.subTasks = task.subTasks.filter(subTask => subTask.id !== taskId)
      })

      return tasks.value.length < initialLength
    }

    function updateTask(taskId: string, updates: Partial<Omit<Task, 'id'>>): boolean {
      const taskIndex = tasks.value.findIndex(task => task.id === taskId)

      if (taskIndex === -1) {
        return false
      }

      tasks.value[taskIndex] = {
        ...tasks.value[taskIndex],
        ...updates
      }

      return true
    }

    function toggleTaskCompletion(taskId: string): boolean {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) {
        return false
      }

      task.completed = !task.completed
      return true
    }

    function sortTasks(sortBy: 'priority' | 'dueDate' | 'createdDate', ascending = true): void {
      tasks.value.sort((a, b) => {
        if (sortBy === 'priority') {
          return ascending ? a.priority - b.priority : b.priority - a.priority
        } else if (sortBy === 'dueDate') {
          if (!a.dueDate) {
            return ascending ? 1 : -1
          }
          if (!b.dueDate) {
            return ascending ? -1 : 1
          }
          return ascending
            ? a.dueDate.getTime() - b.dueDate.getTime()
            : b.dueDate.getTime() - a.dueDate.getTime()
        } else { // createdDate
          return ascending
            ? a.createdDate.getTime() - b.createdDate.getTime()
            : b.createdDate.getTime() - a.createdDate.getTime()
        }
      })
    }

    function breakTaskIntoSubtasks(
      taskId: string,
      subTasksToAdd: Array<Omit<Task, 'id' | 'subTasks'>>
    ): boolean {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task) {
        return false
      }

      // Create new subtasks with IDs
      const newSubTasks = subTasksToAdd.map(subTask => ({
        id: uuidv4(),
        ...subTask,
        subTasks: [],
        createdDate: new Date()
      }))

      task.subTasks.push(...newSubTasks)
      return true
    }

    async function llmBreakTaskIntoSubtasks(
      task: Task
    ) {
      const initialConfig: LLMConfig = { model: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', temperature: 0.8, top_p: 0.95 }
      const { run } = useWebLLMTextGeneration(initialConfig)

      const generatedText = ref('')


      console.log('Starting generation...')
      generatedText.value = ''
      const generationInput: TextGenerationInput = [
        {
          role: 'system',
          content: 'You are a task management assistant. Break tasks into smaller subtasks. You must ONLY return a valid JSON array of strings. Example input: "Clean house". Example output format: ["Clean kitchen", "Mop kitchen", "Clean bathroom", "Vacuum living room"]. DO NOT include any other text or explanations. DO NOT use markdown formatting. ONLY RETURN THE JSON ARRAY.'
        },
        {
          role: 'user',
          content: `Break this task into 3-5 subtasks. Return only a JSON array of strings.
    Task: ${task?.title}
    Description: ${task?.description ?? ''}`
        }
      ]

      try {
        generatedText.value = await run(generationInput)
        generatedText.value = generatedText.value
          // Remove empty lines
          .replace(/^\s*[\r\n]/gm, '')
          // Remove opening code block marker
          .replace(/^```json\s*/m, '')
          // Remove closing code block marker
          .replace(/```\s*$/m, '')
          // Remove backticks at start of lines
          .replace(/^`/gm, '')
          // Remove leading quote before the opening bracket
          .replace(/^"(\[)/, '$1')
          // Remove trailing backtick and quote
          .replace(/(])[\s`"]*$/, '$1')
        console.debug('Generated text:', generatedText.value)

        // Parse the generated text
        const parsedResult = JSON.parse(generatedText.value)
        // Update the task with the generated subtasks
        const subtasks = parsedResult.map((subtask: string) => ({
          title: subtask,
          description: '',
          completed: false,
          dueDate: new Date(),
          createdDate: new Date(),
          priority: 2
        }))
        breakTaskIntoSubtasks(task.id, subtasks)
      } catch (e: any) {
        console.error('Generation failed:', e)
      }
    }

    function moveSubtaskToMain(subtaskId: string): boolean {
      // Find which task contains this subtask
      for (const task of tasks.value) {
        const subtaskIndex = task.subTasks.findIndex(st => st.id === subtaskId)
        if (subtaskIndex !== -1) {
          // Get the subtask
          const subtask = task.subTasks[subtaskIndex]
          // Remove from subtasks
          task.subTasks.splice(subtaskIndex, 1)
          // Add to main tasks
          tasks.value.push(subtask)
          return true
        }
      }
      return false
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
      getAllTasks,
      getTotalTasks,

      // Actions
      addTask,
      addTaskFromName,
      removeTask,
      updateTask,
      toggleTaskCompletion,
      sortTasks,
      breakTaskIntoSubtasks,
      llmBreakTaskIntoSubtasks,
      moveSubtaskToMain
    }
  }
)
