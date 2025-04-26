import { ref, watch } from 'vue'
import OpenAI from 'openai'
import { useDB } from '@/composables/db.ts'
import { defineStore } from 'pinia'

export type Model = 'gpt-4.1-nano'

export const useGptStore = defineStore('gpt', () => {

  const db = useDB()
  const openAiApiKey = ref<string>(db.get('openai-key') ?? '')
  watch(openAiApiKey, (apiKey) => {
    db.set('openai-key', apiKey)
  })

  const personalInformation = ref<string>('')
  const model = ref<Model>('gpt-4.1-nano')

  async function run(input: string, systemPrompt: string) {
    const client = new OpenAI({
      apiKey: openAiApiKey.value,
      dangerouslyAllowBrowser: true
    })

    const enhancedSystemPrompt = systemPrompt + '. Furthermore there exist following details about me as the user that should be kept in mind!\n\n' + personalInformation.value

    const response = await client.responses.create({
      model: model.value,
      input: [
        {
          role: 'developer',
          content: enhancedSystemPrompt
        },
        {
          role: 'user',
          content: input
        }
      ]
    })

    return response.output_text
  }

  return {
    run,
    openAiApiKey,
    model,
    personalInformation
  }
})
