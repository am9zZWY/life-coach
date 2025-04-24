import { onScopeDispose, readonly, ref, shallowRef } from 'vue'
import {
  type ChatCompletion,
  type ChatCompletionChunk,
  type ChatCompletionMessageParam,
  type ChatOptions as WebLLMChatOptions,
  CreateWebWorkerMLCEngine,
  type InitProgressReport,
  type LogLevel,
  WebWorkerMLCEngine
} from '@mlc-ai/web-llm'
import LLMWorker from './llm.worker.ts?worker'

export type TextGenerationInput = ChatCompletionMessageParam[];
export type ModelLoadProgress = InitProgressReport;
export type Status = 'idle' | 'loading' | 'ready' | 'generating' | 'success' | 'error' | 'interrupted';

export interface LLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  max_gen_len?: number;
  logLevel?: LogLevel;
}

export interface RunOptions {
  config?: Partial<LLMConfig>;
  stream?: boolean;
  onUpdate?: (chunk: string, finalMessage: string | null) => void;
}

export function useWebLLMTextGeneration(initialConfig: LLMConfig) {
  const engine = shallowRef<WebWorkerMLCEngine | null>(null)
  const status = ref<Status>('idle')
  const progress = ref(0)
  const progressText = ref('Initializing...')
  const result = shallowRef<string | null>(null)
  const errorMessage = ref<string | null>(null)
  const currentConfig = ref<LLMConfig>(initialConfig)
  const currentModel = ref<string | null>(null)
  let isInterrupting = false

  async function initializeOrReloadEngine(config: LLMConfig) {
    if (isInterrupting) {
      return
    }
    status.value = 'loading'
    progress.value = 0
    progressText.value = 'Initializing engine...'
    errorMessage.value = null
    result.value = null
    currentModel.value = null

    try {
      engine.value ??= await CreateWebWorkerMLCEngine(new LLMWorker(), config.model, {
        logLevel: config.logLevel ?? 'WARN'
      })
      engine.value.setInitProgressCallback((report: InitProgressReport) => {
        progressText.value = report.text
        progress.value = report.progress
        status.value = 'loading'
      })
      progressText.value = `Loading model: ${config.model}...`
      await engine.value.reload(config.model, { chatOpts: config })
      status.value = 'ready'
      progressText.value = 'Model ready.'
      currentConfig.value = config
      currentModel.value = config.model
    } catch (err: any) {
      status.value = 'error'
      errorMessage.value = String(err.message ?? err)
      progressText.value = 'Error loading model.'
    }
  }

  function terminateEngine() {
    if (engine.value) {
      engine.value.unload()
      engine.value = null
    }
    status.value = 'idle'
    progressText.value = 'Engine terminated.'
    progress.value = 0
    result.value = null
    errorMessage.value = null
    currentModel.value = null
  }

  async function run(
    inputData: TextGenerationInput,
    options: RunOptions = {}
  ): Promise<string> {
    const { stream = false, onUpdate, config: runConfig } = options
    if (isInterrupting) {
      return Promise.reject(new Error('Interrupt in progress.'))
    }
    const config = { ...currentConfig.value, ...runConfig }

    if (!engine.value || currentModel.value !== config.model || ['idle', 'error', 'success'].includes(status.value)) {
      await initializeOrReloadEngine(config)
      if (status.value !== 'ready') {
        return Promise.reject(new Error(errorMessage.value ?? 'Engine not ready.'))
      }
    } else if (status.value !== 'ready') {
      return Promise.reject(new Error(`Engine not ready (status: ${status.value})`))
    }

    status.value = 'generating'
    errorMessage.value = null
    result.value = null
    let accumulated = ''
    let finalResult: string | null = null

    try {
      const webLLMOptions: WebLLMChatOptions = {
        temperature: config.temperature,
        top_p: config.top_p,
        max_gen_len: config.max_gen_len
      }
      const completion = await engine.value.chat.completions.create({
        messages: inputData,
        stream,
        ...(Object.keys(webLLMOptions).length ? webLLMOptions : {}),
        ...(stream ? { stream_options: { include_usage: true } } : {})
      })

      if (stream) {
        for await (const chunk of completion as AsyncIterable<ChatCompletionChunk>) {
          if (isInterrupting) {
            status.value = 'interrupted'
            throw new Error('Generation interrupted')
          }
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            accumulated += delta
            onUpdate?.(delta, null)
          }
        }
        finalResult = accumulated
        onUpdate?.('', finalResult)
      } else {
        const chatCompletion = completion as ChatCompletion
        finalResult = chatCompletion.choices[0]?.message?.content ?? null
      }
      if (finalResult == null) {
        throw new Error('LLM returned empty content.')
      }
      result.value = finalResult
      status.value = 'success'
      return finalResult
    } catch (err: any) {
      if (status.value !== 'interrupted') {
        status.value = 'error'
        errorMessage.value = String(err.message || err)
      } else {
        errorMessage.value = 'Generation interrupted'
      }
      result.value = accumulated || null
      throw err
    } finally {
      if (status.value === 'generating') {
        status.value = 'error'
        errorMessage.value = errorMessage.value || 'Generation finished unexpectedly.'
      }
    }
  }

  async function interrupt() {
    if (status.value === 'generating' && engine.value && !isInterrupting) {
      isInterrupting = true
      status.value = 'interrupted'
      errorMessage.value = 'Interrupting generation...'
      try {
        await engine.value.interruptGenerate()
      } catch {
        errorMessage.value = 'Failed to interrupt generation.'
      } finally {
        isInterrupting = false
      }
    }
  }

  onScopeDispose(terminateEngine)

  return {
    status: readonly(status),
    progressText: readonly(progressText),
    progress: readonly(progress),
    result: readonly(result),
    errorMessage: readonly(errorMessage),
    currentModel: readonly(currentModel),
    run,
    interrupt,
    load: initializeOrReloadEngine,
    terminate: terminateEngine
  }
}
