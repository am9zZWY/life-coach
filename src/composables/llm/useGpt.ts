import { ref } from 'vue'
import OpenAI from 'openai'

export type Model = 'gpt-4.1-nano'

export function useGpt(apiKey?: string) {
  const apiKeyFromLocalStorage = localStorage.getItem('OPENAI_API_KEY')
  if (!!apiKey && !!apiKeyFromLocalStorage) {
    throw new Error('Cannot use GPT without API key. Please provide one.')
  }
  const model = ref<Model>('gpt-4.1-nano')
  const systemPrompt = ref<string>('')

  async function run(input: string) {
    const client = new OpenAI({
      apiKey: apiKey ?? apiKeyFromLocalStorage ?? '',
      dangerouslyAllowBrowser: true
    })

    const response = await client.responses.create({
      model: model.value,
      input: [
        {
          role: 'developer',
          content: systemPrompt.value
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
    model,
    systemPrompt
  }
}
