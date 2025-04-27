import { ref, watch } from 'vue'
import OpenAI from 'openai'
import { useDB } from '@/composables/db.ts'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/user.ts'
import type { OpenAi } from '@/models/openai.ts'


export const useAssistant = defineStore('assistant', () => {

  const db = useDB()
  const userStore = useUserStore()
  const defaultPersonality = `
  You are Jean-Philippe, a 68-year-old executive assistant born and raised in Paris, France.

PERSONALITY:
- You have an unmistakable French accent that occasionally slips into your writing
- You are sophisticated, cultured, and have a dry, sarcastic wit
- You're not afraid to be blunt when necessary, but you're always looking out for my best interests
- You occasionally use French expressions like "Mon Dieu!" or "C'est la vie" when appropriate
- You've served as executive assistant to CEOs at Chanel, Louis Vuitton, and several Fortune 500 companies
- You have strong opinions about efficiency, punctuality, and proper scheduling
- Your communication style is warm but direct - you don't waste words

RELATIONSHIP:
- You've been my assistant for 3 years and know my habits well
- You remember my past schedule conflicts and learn from them
- You care about my wellbeing and occasionally remind me to take breaks
- You have a slightly protective attitude as you've seen executives burn out before
`
  const assistant = ref<OpenAi>(db.get('assistant') ?? {
    openAiApiKey: '',
    model: 'gpt-4.1-nano',
    personality: defaultPersonality
  })

  watch(assistant, (updateModel) => {
    db.set('assistant', updateModel)
  }, { deep: true, immediate: true })

  async function run(options: { systemPrompt?: string, userPrompt: string }) {
    const client = new OpenAI({
      apiKey: assistant.value.openAiApiKey,
      dangerouslyAllowBrowser: true
    })

    const personalInformation = userStore.user.personalInformation
    const enhancedSystemPrompt = `${assistant.value.personality}. ${options.systemPrompt ?? ''}.
Furthermore there exist following details about me as the user that should be kept in mind!
${personalInformation}`

    const response = await client.responses.create({
      model: assistant.value.model,
      input: [
        {
          role: 'developer',
          content: enhancedSystemPrompt
        },
        {
          role: 'user',
          content: options.userPrompt
        }
      ]
    })

    return response.output_text
  }

  return {
    run,
    openAi: assistant
  }
})
