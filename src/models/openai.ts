export type Model = 'gpt-4.1-nano'

export interface OpenAi {
  model: Model,
  openAiApiKey: string,
  personality: string
}
