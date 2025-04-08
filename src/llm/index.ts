// useLLMTask.ts
import { onScopeDispose, readonly, ref, shallowRef } from 'vue';
import SummarizeWorker from './llm.summarize.worker.js?worker';
import RankWorker from './llm.rank.worker.js?worker';
import T2TWorker from './llm.generation.worker.js?worker';

// Define specific input/output types for better clarity
type SummarizeInput = string[];
type SummarizeOutput = string[];
type RankInput = { query: string; documents: string[] };
type RankOutput = Array<{ corpus_id: number; score: number; text?: string }>;
type TextGenerationInput = { role: string, content: string }[];
type TextGenerationOutput = string;

// Union types for input/output based on task
type TaskInput<T extends Task> = T extends 'summarize' ? SummarizeInput : T extends 'rank' ? RankInput : T extends 'generation' ? TextGenerationInput : never;
type TaskOutput<T extends Task> = T extends 'summarize' ? SummarizeOutput : T extends 'rank' ? RankOutput : T extends 'generation' ? TextGenerationOutput : never;

type Task = 'summarize' | 'rank' | 'generation';
// Simplified status: idle (before load), loading (model download), ready (model loaded), processing, success, error
type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'success' | 'error';

/**
 * A simplified composable to run a specific LLM task (summarize or rank).
 * Manages the underlying Web Worker automatically.
 *
 * @param task The task the worker should perform ('summarize' or 'rank').
 * @returns An object with reactive status, result, and an async function to run the task.
 *
 * @example
 * // Summarization
 * const { status, result, run } = useLLMTask('summarize');
 * watch(status, (newStatus) => console.log('Summarizer status:', newStatus));
 * async function summarizeMyText() {
 *   try {
 *     const summaryData = await run(['Long text 1...', 'Long text 2...']);
 *     console.log('Summaries:', summaryData);
 *     // result.value will also be updated
 *   } catch (e) {
 *     console.error('Summarization failed:', e);
 *   }
 * }
 *
 * // Ranking
 * const { status: rankStatus, result: rankResult, run: runRank } = useLLMTask('rank');
 * async function rankMyDocs() {
 *    try {
 *       const rankedData = await runRank({ query: 'search query', documents: ['doc A', 'doc B', 'doc C'] });
 *       console.log('Ranked Docs:', rankedData);
 *       // rankResult.value will also be updated
 *    } catch (e) {
 *       console.error('Ranking failed:', e);
 *    }
 * }
 */
export function useLLMTask<T extends Task>(task: T) {
    const worker = shallowRef<Worker | null>(null);
    const status = ref<Status>('idle');
    const modelDownloads = ref<{ [key: string]: number }>({})
    // Use shallowRef for potentially large result arrays/objects to avoid deep reactivity overhead
    const result = shallowRef<TaskOutput<T> | null>(null);
    const errorMessage = ref<string | null>(null);

    // Store promise resolvers for the current run
    let currentTaskPromiseResolve: ((value: TaskOutput<T>) => void) | null = null;
    let currentTaskPromiseReject: ((reason?: any) => void) | null = null;

    // --- Worker Initialization ---
    function initializeWorker() {
        if (worker.value) {
            console.warn(`Worker for task ${task} already initialized.`);
            return;
        }

        status.value = 'loading';
        errorMessage.value = null;
        result.value = null;

        let workerInstance: Worker;
        switch (task) {
            case 'summarize':
                workerInstance = new SummarizeWorker();
                break;
            case 'rank':
                workerInstance = new RankWorker();
                break;
            case 'generation':
                workerInstance = new T2TWorker();
                break;
            default:
                console.error(`Unknown task type: ${task}`);
                return;
        }
        workerInstance.onmessage = (event: MessageEvent<any>) => {
            const msg = event.data;
            console.log(`[${task} worker] Message:`, msg);

            switch (msg.status) {
                case 'loading':
                    status.value = 'loading'
                    break;
                case 'initiate':
                    status.value = 'loading';
                    modelDownloads.value[msg.name + "/" + msg.file] = 0
                    break
                case 'progress':
                    status.value = 'loading';
                    // Update download progress
                    modelDownloads.value[msg.name + "/" + msg.file] = msg.progress;
                    break;
                case 'ready':
                    status.value = 'ready';
                    break;
                case 'start':
                    status.value = 'processing';
                    break;
                case 'finished':
                    status.value = 'success';
                    result.value = msg.data as TaskOutput<T>;
                    console.debug(`[${task} worker] Result:`, result.value);
                    if (currentTaskPromiseResolve) {
                        currentTaskPromiseResolve(msg.data as TaskOutput<T>);
                    }
                    resetPromiseHandlers();
                    break;
                case 'error':
                    console.error(`[${task} worker] Error:`, msg.error);
                    status.value = 'error';
                    errorMessage.value = msg.error?.message || msg.error || 'Unknown worker error';
                    if (currentTaskPromiseReject) {
                        currentTaskPromiseReject(new Error(errorMessage.value ?? 'Worker Error'));
                    }
                    resetPromiseHandlers();
                    break;
                default:
                    console.warn(`[${task} worker] Unknown message type:`, msg.status);
            }
        };

        workerInstance.onerror = (event: ErrorEvent) => {
            console.error(`[${task} worker] Uncaught error:`, event.message, event);
            status.value = 'error';
            errorMessage.value = event.message || 'Unknown worker error';
            if (currentTaskPromiseReject) {
                currentTaskPromiseReject(new Error(errorMessage.value));
            }
            resetPromiseHandlers();
            // Attempt to clean up
            terminateWorker();
        };

        worker.value = workerInstance;
        // Send init message
        worker.value.postMessage({ type: 'init' });
    }

    function terminateWorker() {
        if (worker.value) {
            worker.value.postMessage({ type: 'interrupt' });
            console.debug(`Terminating worker for task ${task}...`);
            worker.value.terminate();
            worker.value = null;
            status.value = 'idle'; // Reset status
            resetPromiseHandlers();
        }
    }

    function resetPromiseHandlers() {
        currentTaskPromiseResolve = null;
        currentTaskPromiseReject = null;
    }

    // Initialize worker when composable is used
    initializeWorker();

    // Terminate worker when the component using the composable is unmounted
    onScopeDispose(() => {
        terminateWorker();
    });

    // --- Task Execution ---
    async function run(inputData: TaskInput<T>): Promise<TaskOutput<T>> {
        if (!worker.value) {
            console.warn("Worker not initialized. Initializing now...");
            initializeWorker();
            return Promise.reject(new Error("Worker is not initialized."));
        }

        if (status.value === 'processing') {
            return Promise.reject(new Error(`Worker for task ${task} is busy (status: ${status.value}).`));
        }

        return new Promise<TaskOutput<T>>((resolve, reject) => {
            currentTaskPromiseResolve = resolve;
            currentTaskPromiseReject = reject;

            status.value = 'processing';
            errorMessage.value = null;
            result.value = null;

            console.debug(`[${task} worker] Sending data:`, inputData);
            worker.value?.postMessage({ type: 'run', data: inputData });
        });
    }

    return {
        /** Reactive status: 'idle', 'loading', 'ready', 'processing', 'success', 'error' */
        status: readonly(status),
        download: readonly(modelDownloads),
        /** Reactive result of the last successful task run */
        result: readonly(result),
        /** Reactive error message if status is 'error' */
        errorMessage: readonly(errorMessage),
        /** Async function to execute the task. Returns a Promise with the result. */
        run,
    };
}
