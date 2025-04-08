// useWebLLMTextGeneration.ts
import { onScopeDispose, readonly, ref, shallowRef } from 'vue';
import log from 'loglevel'; // Optional: for logging
import {
    type ChatCompletion,
    type ChatCompletionChunk,
    type ChatCompletionFinishReason,
    type ChatCompletionMessageParam,
    type ChatOptions as WebLLMChatOptions,
    type CompletionUsage,
    type InitProgressReport,
    type LogLevel,
    WebWorkerMLCEngine
} from "@mlc-ai/web-llm";

// Import your worker script
import LLMWorker from './llm.worker.js?worker'; // Use the provided worker file

// --- Types ---

/** Input format for the text generation model (matches ChatCompletionMessageParam) */
export type TextGenerationInput = ChatCompletionMessageParam[];

/** Output format (the generated text string) */
export type TextGenerationOutput = string;

/** Progress update during model loading */
export type ModelLoadProgress = InitProgressReport; // Use the official type

/** Status of the LLM interaction */
export type Status = 'idle' | 'loading' | 'ready' | 'generating' | 'success' | 'error' | 'interrupted';

/** Configuration for the LLM model and generation */
export interface LLMConfig {
    model: string; // e.g., "gemma-2b-it-q4f32_1"
    temperature?: number;
    top_p?: number;
    max_gen_len?: number; // Max generation length
    // Add other relevant config options from webLLM if needed
    logLevel?: LogLevel; // Control engine logging level
}

/** Options for the run function */
export interface RunOptions {
    config?: Partial<LLMConfig>; // Allow overriding parts of the config for a run
    stream?: boolean; // Enable streaming output
    onUpdate?: (chunk: string, finalMessage: string | null) => void; // Callback for streaming updates
}

/**
 * A Vue composable for text generation using webLLM's WebWorkerMLCEngine.
 * Manages the engine, model loading, and chat completions.
 *
 * @param initialConfig The initial configuration for the LLM model.
 * @returns An object with reactive state and control functions.
 *
 * @example
 * import { useWebLLMTextGeneration } from './useWebLLMTextGeneration';
 * import { ref, watch } from 'vue';
 *
 * const initialConfig = { model: "gemma-2b-it-q4f32_1" }; // Or your desired model
 * const { status, progressText, progress, result, errorMessage, run, interrupt, currentModel } = useWebLLMTextGeneration(initialConfig);
 *
 * const inputText = ref<TextGenerationInput>([{ role: 'user', content: 'Write a short poem about Vue.' }]);
 * const generatedText = ref('');
 *
 * watch(status, (newStatus) => console.log('LLM Status:', newStatus));
 * watch(progressText, (newProgress) => console.log('LLM Load Progress:', newProgress));
 * watch(result, (newResult) => {
 *   if(newResult) console.log('Final Generated Text:', newResult);
 * });
 *
 * async function generate() {
 *   console.log('Starting generation...');
 *   generatedText.value = ''; // Clear previous output for streaming
 *   try {
 *     const finalResult = await run(inputText.value, {
 *        stream: true, // Enable streaming
 *        onUpdate: (chunk, finalMessage) => {
 *           generatedText.value += chunk; // Append chunk to display
 *           console.log("Received chunk:", chunk);
 *           if (finalMessage !== null) {
 *              console.log("Streaming finished.");
 *              // finalMessage contains the complete text if needed,
 *              // but generatedText.value should also be complete here.
 *           }
 *        },
 *        // Optionally override config for this run:
 *        // config: { temperature: 0.8 }
 *     });
 *     console.log('Generation finished successfully. Final result:', finalResult);
 *     // result.value also holds the final generated text
 *   } catch (e: any) {
 *     console.error('Generation failed:', e);
 *     // errorMessage.value will contain the error message
 *   }
 * }
 *
 * // Call generate() when ready (e.g., on button click, check if status is 'ready')
 */
export function useWebLLMTextGeneration(initialConfig: LLMConfig) {
    // Use shallowRef for the engine instance
    const engine = shallowRef<WebWorkerMLCEngine | null>(null);
    const status = ref<Status>('idle');
    const progress = ref<number>(0); // Overall loading progress (0-1)
    const progressText = ref<string>('Initializing...');
    const result = shallowRef<TextGenerationOutput | null>(null);
    const errorMessage = ref<string | null>(null);
    const currentConfig = ref<LLMConfig>(initialConfig); // Store the active config
    const currentModel = ref<string | null>(null); // Store the loaded model ID

    let isInterrupting = false; // Flag to prevent race conditions on interrupt

    // --- Engine Initialization & Model Loading ---
    async function initializeOrReloadEngine(configToLoad: LLMConfig) {
        if (isInterrupting) {
            log.warn("Initialization skipped: Interrupt in progress.");
            return; // Don't try to load while interrupting
        }

        status.value = 'loading';
        progress.value = 0;
        progressText.value = 'Initializing engine...';
        errorMessage.value = null;
        result.value = null;
        currentModel.value = null; // Clear current model while loading

        try {
            if (!engine.value) {
                log.info("Creating WebWorkerMLCEngine...");
                // Pass the worker instance directly to the engine
                const worker = new LLMWorker();
                const newEngine = new WebWorkerMLCEngine(worker, {
                    logLevel: configToLoad.logLevel ?? 'WARN', // Use config log level or default
                    // Configure other engine options if needed
                });
                engine.value = newEngine;
            } else {
                log.info("Engine exists, preparing to reload model...");
            }

            // Set progress callback
            engine.value.setInitProgressCallback((report: InitProgressReport) => {
                log.debug(`[Main Thread] Init Progress:`, report);
                progressText.value = report.text;
                progress.value = report.progress;
                status.value = 'loading'; // Ensure status stays loading during progress
            });

            log.info(`Loading model: ${configToLoad.model}`);
            progressText.value = `Loading model: ${configToLoad.model}...`;

            // Reload the engine with the specified model and config
            // This handles both initial load and subsequent model changes.
            await engine.value.reload(configToLoad.model, { chatOpts: configToLoad });

            log.info(`Model ${configToLoad.model} loaded successfully.`);
            status.value = 'ready';
            progressText.value = 'Model ready.';
            currentConfig.value = configToLoad; // Update the current config state
            currentModel.value = configToLoad.model; // Store loaded model ID

        } catch (err: any) {
            log.error("Engine initialization/reload failed:", err);
            status.value = 'error';
            errorMessage.value = String(err.message || err);
            progressText.value = 'Error loading model.';
            // Consider terminating the worker/engine on critical failure
            // terminateEngine();
        }
    }

    // --- Termination ---
    function terminateEngine() {
        if (engine.value) {
            log.info("Terminating WebLLM Engine...");
            engine.value.unload();
            engine.value = null;
            status.value = 'idle';
            progressText.value = 'Engine terminated.';
            progress.value = 0;
            result.value = null;
            errorMessage.value = null;
            currentModel.value = null;
        }
    }

    // --- Task Execution ---
    async function run(
        inputData: TextGenerationInput,
        options: RunOptions = {}
    ): Promise<TextGenerationOutput> {
        const { stream = false, onUpdate, config: runConfig } = options;

        if (isInterrupting) {
            const msg = "Cannot start generation: Interrupt in progress.";
            log.warn(msg);
            return Promise.reject(new Error(msg));
        }

        // Determine the config to use for this run
        const configForRun = { ...currentConfig.value, ...runConfig };

        // Check if engine needs initialization or model reload
        if (!engine.value || status.value === 'success' || status.value === 'idle' || status.value === 'error' || currentModel.value !== configForRun.model) {
            log.info(`Engine not ready or model changed (${currentModel.value} vs ${configForRun.model}). Initializing/Reloading...`);
            await initializeOrReloadEngine(configForRun);
            // If initialization failed, the status will be 'error'
            if (status.value !== 'ready') {
                const msg = `Engine failed to become ready (status: ${status.value}). Cannot generate.`;
                log.error(msg);
                return Promise.reject(new Error(errorMessage.value ?? msg));
            }
        } else if (status.value !== 'ready') {
            const msg = `Engine not ready (status: ${status.value}). Cannot start generation.`;
            log.warn(msg);
            return Promise.reject(new Error(msg));
        }

        status.value = 'generating';
        errorMessage.value = null;
        result.value = null; // Clear previous result
        let accumulatedResult = '';
        let finalResult: TextGenerationOutput | null = null;
        let usage: CompletionUsage | undefined;
        let stopReason: ChatCompletionFinishReason | undefined;

        try {
            log.debug(`[Main Thread] Starting chat completion (stream=${stream}) with model ${currentModel.value}`);

            const webLLMOptions: WebLLMChatOptions = {
                // Pass generation parameters from config
                temperature: configForRun.temperature,
                top_p: configForRun.top_p,
                max_gen_len: configForRun.max_gen_len,
                // Add other parameters as needed
            };

            // --- Call engine.chatCompletion ---
            const completion = await engine.value.chat.completions.create({
                messages: inputData,
                stream: stream,
                // Pass chat options if defined
                ...(Object.keys(webLLMOptions).length > 0 ? webLLMOptions : {}),
                // Include usage data if streaming
                ...(stream ? { stream_options: { include_usage: true } } : {}),
            });

            if (stream) {
                // Handle streaming response
                const asyncGenerator = completion as AsyncIterable<ChatCompletionChunk>;
                for await (const chunk of asyncGenerator) {
                    if (isInterrupting) {
                        log.info("Streaming interrupted by user.");
                        status.value = 'interrupted';
                        throw new Error("Generation interrupted");
                    }
                    const deltaContent = chunk.choices[0]?.delta?.content;
                    if (deltaContent) {
                        accumulatedResult += deltaContent;
                        onUpdate?.(deltaContent, null); // Pass chunk, indicate not final yet
                    }
                    if (chunk.usage) {
                        usage = chunk.usage; // Capture usage info
                    }
                    if (chunk.choices[0]?.finish_reason) {
                        stopReason = chunk.choices[0].finish_reason; // Capture stop reason
                    }
                }
                finalResult = accumulatedResult;
                onUpdate?.('', finalResult); // Signal completion by sending empty chunk and final message
                log.debug("Streaming finished. Stop reason:", stopReason, "Usage:", usage);

            } else {
                // Handle non-streaming response
                const chatCompletion = completion as ChatCompletion;
                finalResult = chatCompletion.choices[0]?.message?.content ?? null;
                usage = chatCompletion.usage;
                stopReason = chatCompletion.choices[0]?.finish_reason;
                log.debug("Non-streaming completion finished. Stop reason:", stopReason, "Usage:", usage);
            }

            if (finalResult === null) {
                throw new Error("LLM returned empty content.");
            }

            result.value = finalResult; // Store final result reactively
            status.value = 'success';
            return finalResult;

        } catch (err: any) {
            if (status.value !== 'interrupted') { // Don't overwrite interrupt status with error
                log.error("Chat completion failed:", err);
                status.value = 'error';
                errorMessage.value = String(err.message || err);
            } else {
                errorMessage.value = "Generation interrupted"; // Set specific message for interruption
            }
            result.value = accumulatedResult || null; // Store partial result if any
            throw err; // Re-throw error for the caller
        } finally {
            if (status.value === 'generating') {
                // If still 'generating' after loop/try-catch (shouldn't happen often), set to error
                status.value = 'error';
                errorMessage.value = errorMessage.value || "Generation finished unexpectedly.";
            }
        }
    }

    // --- Interrupt ---
    async function interrupt() {
        if (status.value === 'generating' && engine.value && !isInterrupting) {
            log.info("Attempting to interrupt generation...");
            isInterrupting = true; // Set flag
            status.value = 'interrupted'; // Set status immediately for feedback
            errorMessage.value = "Interrupting generation...";
            try {
                await engine.value.interruptGenerate();
                log.info("Interrupt signal sent.");
                // Status is already 'interrupted', keep it that way until next run
            } catch (err) {
                log.error("Failed to send interrupt signal:", err);
                // Reset status if interrupt failed? Or leave as interrupted?
                // Let's leave it as interrupted, the run promise should reject anyway.
                errorMessage.value = "Failed to interrupt generation.";
            } finally {
                isInterrupting = false; // Reset flag
            }
        } else {
            log.warn("Interrupt called but not in 'generating' state or engine not available.");
        }
    }

    // --- Lifecycle ---
    // Initialize on mount or first use? Let's initialize based on config changes.
    // Watch the initialConfig ref if it's reactive, or just load once.
    // For simplicity, let's assume initialConfig is static and load on first `run` or explicit call.
    // Or, trigger initial load here:
    // initializeOrReloadEngine(currentConfig.value); // Uncomment to load immediately

    // Cleanup on unmount
    onScopeDispose(() => {
        terminateEngine();
    });

    return {
        /** Reactive status: 'idle', 'loading', 'ready', 'generating', 'success', 'error', 'interrupted' */
        status: readonly(status),
        /** Reactive loading progress text */
        progressText: readonly(progressText),
        /** Reactive loading progress (0-1) */
        progress: readonly(progress),
        /** Reactive result of the last successful generation */
        result: readonly(result),
        /** Reactive error message */
        errorMessage: readonly(errorMessage),
        /** Reactive ID of the currently loaded model */
        currentModel: readonly(currentModel),
        /** Async function to run text generation */
        run,
        /** Function to attempt interrupting generation */
        interrupt,
        /** Function to explicitly load/reload the engine with a new config */
        load: initializeOrReloadEngine,
        /** Function to terminate the engine and worker */
        terminate: terminateEngine,
    };
}
