<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useAssistant } from '@/stores/assistant.ts'
import { useTaskStore } from '@/stores/task.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWeatherStore } from '@/stores/weather.ts'
import { useDB } from '@/composables/db.ts'
import { useDateFormat } from '@vueuse/core'
import { Badge } from '@/components/ui/badge'

const gptStore = useAssistant()
const weatherStore = useWeatherStore()
const taskStore = useTaskStore()

const summary = ref('')
const loading = ref(false)
const currentDate = useDateFormat(new Date(), 'dddd, D. MMMM YYYY')

const systemPrompt = `FORMATTING:
- You answer in plain text, no Markdown allowed, no stars, no headers
- You occasionally use emoji, but sparingly and tastefully
- You always address me directly, as if we're having a conversation
- You sign off with "- Jean-Philippe" and occasionally a brief French phrase
`
const userPrompt = computed(() => `Good day. It is ${currentDate}. Please review my schedule and provide:

1. A brief, personalized greeting referencing the weather or my day ahead
2. Your top 3 priority recommendations for today (be specific about what needs attention)
3. Any schedule conflicts, timing issues, or concerns about my workload
4. One practical suggestion to improve my day, considering the weather conditions

Add your personal touch and occasional French expressions as appropriate. Remember our history working together and refer to past patterns if relevant.

My current tasks: ${taskStore.toString()}
Current weather: ${weatherStore.weather.temperature}°C in ${weatherStore.weather.location}`
)

const db = useDB()
const generateSummary = async () => {
  loading.value = true
  const CACHE_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours
  const cachedSummary = db.get('assistant-summary') as {
    summary: string,
    date: string,
  }
  console.log(cachedSummary)
  if (
    cachedSummary &&
    new Date(cachedSummary.date).getTime() + CACHE_DURATION_MS > Date.now()
  ) {
    summary.value = cachedSummary.summary
    loading.value = false
    return
  }

  try {
    summary.value = await gptStore.run({
      systemPrompt,
      userPrompt: userPrompt.value
    })
    db.set('assistant-summary', {
      summary: summary.value,
      date: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to generate summary:', error)
    summary.value = 'Failed to generate summary. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (taskStore.tasks.length > 0) {
    generateSummary()
  }
})
</script>

<template>
  <Card class="shadow-md rounded-xl">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
          <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
          <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
        </svg>
        A Note From Jean-Philippe
      </CardTitle>
      <CardDescription class="flex items-center gap-2">
        <Badge variant="outline">{{ currentDate }}</Badge>
        <Badge variant="secondary">{{ weatherStore.weather.temperature
          }}°C in {{ weatherStore.weather.location }}</Badge>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="flex justify-center items-center py-8">
        <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg font-medium">Jean-Philippe is thinking...</span>
      </div>
      <div v-else-if="summary" class="whitespace-pre-line text-base leading-relaxed">
        <div class="prose dark:prose-invert max-w-none" v-html="summary"></div>
      </div>
      <div v-else class="flex flex-col items-center py-8 text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-4">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
        <p class="text-lg">No tasks available for Jean-Philippe to review.</p>
        <p class="text-sm mt-2">Add some tasks to get your personalized daily briefing.</p>
      </div>
    </CardContent>
  </Card>
</template>
