<script setup lang="ts">
import { useTaskStore } from "@/stores/task";
import { computed, ref, watch } from "vue";
import Task from "@/components/task/Task.vue";
import { type Task as TaskType } from "@/models/task";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type LLMConfig, type TextGenerationInput, useWebLLMTextGeneration } from "@/llm";

const taskStore = useTaskStore()
const tasks = computed(() => taskStore.getTasks)

// Add sample data for testing
const exampleTask: TaskType = {
    subTasks: [],
    id: "1",
    title: "Hausarbeit",
    description: "",
    completed: false,
    dueDate: new Date(),
    createdDate: new Date(),
    priority: 2
}
taskStore.addTask(exampleTask)

const initialConfig: LLMConfig = { model: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", temperature: 0.8, top_p: 0.95 };
const {
    status,
    progressText,
    progress,
    result,
    errorMessage,
    run,
    interrupt,
    currentModel
} = useWebLLMTextGeneration(initialConfig);

const generatedText = ref('');

watch(status, (newStatus) => console.log('LLM Status:', newStatus));
watch(progressText, (newProgress) => console.log('LLM Load Progress:', newProgress));
watch(result, (newResult) => {
    if (newResult) {
        console.log('Final Generated Text:', newResult);
    }
});

async function generate(task: TaskType) {

    console.log('Starting generation...');
    generatedText.value = '';
    const generationInput: TextGenerationInput = [
        {
            role: 'system',
            content: 'You are a task management assistant. Break tasks into smaller subtasks. You must ONLY return a valid JSON array of strings. Example input: "Clean house". Example output format: ["Clean kitchen", "Mop kitchen", "Clean bathroom", "Vacuum living room"]. DO NOT include any other text or explanations. DO NOT use markdown formatting. ONLY RETURN THE JSON ARRAY.'
        },
        {
            role: 'user',
            content: `Break this task into 3-5 subtasks. Return only a JSON array of strings.
    Task: ${task?.title}
    Description: ${task?.description || ''}`
        }
    ]

    try {
        const finalResult = await run(generationInput, {
            stream: true, // Enable streaming
            onUpdate: (chunk, finalMessage) => {
                generatedText.value += chunk; // Append chunk to display
                console.log("Received chunk:", chunk);
                if (finalMessage !== null) {
                    console.log("Streaming finished.");
                    // finalMessage contains the complete text if needed,
                    // but generatedText.value should also be complete here.
                }
            },
            // Optionally override config for this run:
            // config: { temperature: 0.8 }
        });
        /** Clean up the generated text:
         * "```json
         * [\"Design project plan\", \"Compile research materials\", \"Interview key partners\", \"Plan team meetings\", \"Create budget and timelines\", \"Choose software tools for collaboration\", \"Prepare marketing materials for the campaign\"]
         * ```"
         *
         * ```json
         * [\"Design and construct the kitchen garden for the concept project\",
         *  \"Plan and implement the living room art exhibition\",
         *  \"Design and create the dining table for the concept project\",
         *  \"Obtain necessary materials and tools for the painting workshop\",
         *  \"Run the painting workshop to complete the art exhibition\",
         *  \"Create and deliver the art exhibition to the public\"
         * ]
         * ```
         */
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
            .replace(/(])[\s`"]*$/, '$1');
        console.log('Generated text:', generatedText.value);

        // Parse the generated text
        const parsedResult = JSON.parse(generatedText.value);
        // Update the task with the generated subtasks
        const subtasks = parsedResult.map((subtask: string) => ({
            title: subtask,
            description: '',
            completed: false,
            dueDate: new Date(),
            createdDate: new Date(),
            priority: 2
        }));
        taskStore.updateTask(task.id, {
            ...task,
            subTasks: subtasks
        });
        // result.value also holds the final generated text
    } catch (e: any) {
        console.error('Generation failed:', e);
        // errorMessage.value will contain the error message
    }
}


const disableBreakDownTaskButton = computed(() => status.value !== 'idle')
</script>


<template>
    <Card>
        <CardHeader class="pb-2">
            <CardTitle class="messages-lg font-semibold">Aufgaben</CardTitle>
            <CardDescription>{{ tasks.length }} Aufgaben</CardDescription>
        </CardHeader>
        <CardContent>
            <div v-for="task in tasks" :key="task.id">
                <Task :task="task" @update:task="taskStore.updateTask(task.id, $event)"
                      :disableBreakDownTaskButton="disableBreakDownTaskButton"
                      @breakdown-task="generate(task)"/>
            </div>

            <!-- Add new task button -->
            <Input
                type="messages"
                placeholder="Füge eine neue Aufgabe hinzu"
                @keyup.enter="taskStore.addTaskFromName($event.target.value)"
                class="mt-4"
            />
        </CardContent>
    </Card>
</template>
