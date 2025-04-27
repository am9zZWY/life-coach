<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAssistant } from '@/stores/assistant.ts'
import { useTaskStore } from '@/stores/task.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWeatherStore } from '@/stores/weather.ts'
import { useDB } from '@/composables/db.ts'
import { useDateFormat } from '@vueuse/core'
import { Badge } from '@/components/ui/badge'
import { MessageSquareQuote, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { storeToRefs } from 'pinia'

const gptStore = useAssistant()
const weatherStore = useWeatherStore()
const taskStore = useTaskStore()
const { flatTasks } = storeToRefs(taskStore)

const summary = ref('')
const loading = ref(false)
const currentDate = useDateFormat(new Date(), 'dddd, D. MMMM YYYY')

const timeOfDay = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) {
    return 'morning'
  }
  if (hour >= 11 && hour < 15) {
    return 'lunch'
  }
  if (hour >= 17 && hour < 23) {
    return 'evening'
  }
  return 'night'
})

const systemPrompt = computed(() => `FORMATIERUNG:
- Du antwortest in einfachem Text, kein Markdown erlaubt, keine Sternchen, keine Überschriften
- Du verwendest gelegentlich Emojis, aber sparsam und geschmackvoll
- Du sprichst mich immer direkt an, als ob wir ein Gespräch führen
- Du antwortest IMMER auf Deutsch und gelegentlich mischt du ein zwei französischen Phrasen!
- Du unterschreibst mit "- Jean-Philippe" und gelegentlich einer kurzen französischen Phrase

FORMATIERUNG:
- Du antwortest in einfachem Text, kein Markdown erlaubt, keine Sternchen, keine Überschriften!
- Du verwendest gelegentlich Emojis, aber sparsam und geschmackvoll
- Du sprichst mich immer direkt an, als ob wir ein Gespräch führen
- Du unterschreibst mit "- Jean-Philippe" und gelegentlich einer kurzen französischen Phrase

CURRENT MODE: ${timeOfDay.value.toUpperCase()}
`)

// Update user prompt based on time of day
const userPrompt = computed(() => {
  const baseContext = `Es ist ${currentDate.value} und das Wetter ist ${weatherStore.weather.temperature}°C in ${weatherStore.weather.location}.`
  const tasksContext = flatTasks.value.length > 0
    ? `Meine aktuellen Aufgaben: ${taskStore.toString()}`
    : 'Ich habe momentan keine Aufgaben geplant.'

  switch (timeOfDay.value) {
    case 'morning':
      return `Bonjour! ${baseContext}

Als mein vertrauter persönlicher Assistent seit 3 Jahren, bitte überprüfe meinen bevorstehenden Tag mit deiner charakteristischen französischen Effizienz. Ich brauche:
1. Eine kurze, personalisierte Morgengrußformel, die Bezug auf das Wetter oder meinen Zeitplan nimmt
2. Deine Top-3-Prioritätsempfehlungen (sei sehr spezifisch darüber, was zuerst Aufmerksamkeit benötigt)
3. Weise auf Terminüberschneidungen oder Zeitmanagementprobleme hin, die dir auffallen
4. Einen praktischen Vorschlag zur Verbesserung meiner Produktivität heute

${tasksContext}`

    case 'lunch':
      return `Bon midi! ${baseContext}

Es ist Mittagszeit, und ich könnte deine kulinarische Expertise gebrauchen. Bitte:
1. Schlage ein anspruchsvolles, aber praktisches Mittagsrezept vor, das dich beeindrucken würde
2. Füge deinen kulturellen Kommentar hinzu, warum dieses Gericht für heute angemessen ist
3. Ergänze eine kurze Notiz zu meinem Nachmittagsplan

${tasksContext}`

    case 'evening':
      return `Bonsoir! ${baseContext}

Der Arbeitstag neigt sich dem Ende zu. Bitte teile mit:
1. Entweder einen einfachen Rezeptvorschlag für das morgige Mittagessen oder eine Filmempfehlung, die meinem Geschmack entspricht
2. Eine kurze Reflexion über die heutigen Erfolge
3. Eine Sache, auf die ich mich für morgen vorbereiten sollte

${tasksContext}`

    case 'night':
      return `Bonne nuit! ${baseContext}

Bevor ich mich für den Abend zurückziehe, bitte stelle bereit:
1. Einen kurzen Überblick über den morgigen Zeitplan
2. Eine Sache, die ich heute Abend nicht vergessen sollte vorzubereiten
3. Eine geistreiche französische Beobachtung über Erholung oder Produktivität

${tasksContext}`
  }
})

const db = useDB()
const generateSummary = async (force: boolean = false) => {
  loading.value = true
  const CACHE_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours
  const cachedSummary = db.get('assistant-summary') as {
    summary: string,
    date: string,
  }
  console.log(cachedSummary)
  if (
    !force &&
    cachedSummary &&
    new Date(cachedSummary.date).getTime() + CACHE_DURATION_MS > Date.now()
  ) {
    summary.value = cachedSummary.summary
    loading.value = false
    return
  }

  try {
    summary.value = await gptStore.run({
      systemPrompt: systemPrompt.value,
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
  generateSummary()
})
watch(flatTasks, () => generateSummary(true))
</script>

<template>
  <Card class="shadow-md rounded-xl">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <MessageSquareQuote />
        Une Note von Jean-Philippe
      </CardTitle>
      <CardDescription class="flex items-center justify-between">
        <div class="flex gap-2">
          <Badge variant="outline">{{ currentDate }}</Badge>
          <Badge variant="secondary">{{ weatherStore.weather.temperature
            }}°C in {{ weatherStore.weather.location }}
          </Badge>
        </div>
        <Button @click="() => generateSummary(true)" variant="outline" size="sm">
          <RotateCcw />
        </Button>
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
        <span class="text-lg font-medium">Jean-Philippe denkt...</span>
      </div>
      <div v-else-if="summary" class="whitespace-pre-line text-base leading-relaxed">
        <div class="prose dark:prose-invert max-w-none" v-html="summary"></div>
      </div>
    </CardContent>
  </Card>
</template>
