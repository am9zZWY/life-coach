<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { BrainCircuit, Moon, Snowflake, Sun, Utensils, Zap } from 'lucide-vue-next'
import Suggestions from "@/components/suggestion/Suggestions.vue";
import { searchYouTube } from "@/lib/suggestions.ts";

// --- Time & Greeting ---
const time = new Date()
const timeString = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
const isNight = ref(time.getHours() >= 18 || time.getHours() < 6)

const greeting = computed(() => {
    const hour = time.getHours()
    if (isNight.value) {
        return 'Guten Abend'
    } else if (hour >= 6 && hour < 12) {
        return 'Guten Morgen'
    } else if (hour >= 12 && hour < 18) {
        return 'Guten Tag'
    } else {
        return 'Guten Abend'
    }
})

// --- Mock Weather ---
const temperature = ref(18)

// --- Mock Energy Level ---
const energy = ref(75)
const energyMax = 100
const energyProgress = computed(() => (energy.value / energyMax) * 100)
const energyProgressColorClass = computed(() => {
    if (energyProgress.value >= 80) {
        return 'text-green-500'
    }
    if (energyProgress.value >= 50) {
        return 'text-amber-500'
    }
    return 'text-red-500'
})

// --- Mock Mood/Activity Placeholder ---
const moodProgress = ref(60)

// --- YouTube Content Integration ---

// Search Suggestions
const workoutSuggestions = ref(['Ganzkörper', 'Cardio', 'Yoga', 'Bauchmuskeln', 'Rücken'])
const meditationSuggestions = ref(['Achtsamkeit', 'Schlaf', 'Stressabbau', '5 Minuten', 'Morgen'])
const recipeSuggestions = ref(['Schnell', 'Gesund', 'Vegan', 'Hähnchen', 'Salat', 'Frühstück'])
</script>

<template>
    <div class="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">

        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">{{ greeting }}, Josef</h1>
                <p class="text-muted-foreground">Hier sind einige Vorschläge für deinen Tag.</p>
            </div>
            <div class="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                <div class="flex items-center gap-2">
                    <Sun v-if="!isNight" class="h-4 w-4 text-amber-500"/>
                    <Moon v-else class="h-4 w-4 text-gray-500"/>
                    <span>{{ timeString }} Uhr</span>
                </div>
                <Separator orientation="vertical" class="h-4"/>
                <div class="flex items-center gap-2">
                    <Snowflake class="h-4 w-4 text-blue-400"/>
                    <span>{{ temperature }}°C</span>
                </div>
            </div>
        </div>

        <!-- Quick Stats Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader class="pb-2">
                    <CardTitle class="text-lg font-semibold">Stimmung Heute</CardTitle>
                    <CardDescription>Wie fühlst du dich?</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center gap-2 pt-2">
                        <span class="text-2xl">😊</span>
                        <Progress :model-value="moodProgress" class="w-full h-2" aria-label="Stimmung Fortschritt"/>
                    </div>
                    <p class="text-xs text-muted-foreground mt-2">Logge deine Stimmung für bessere Einsichten.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader class="pb-2">
                    <CardTitle class="text-lg font-semibold">Energie-Level</CardTitle>
                    <CardDescription>Dein aktuelles Energielevel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center gap-2 pt-2">
                        <Zap :class="['h-5 w-5 shrink-0', energyProgressColorClass]"/>
                        <Progress :model-value="energyProgress" class="w-full h-2" aria-label="Energie Fortschritt"/>
                        <span :class="['font-semibold', energyProgressColorClass]">{{ energy }}%</span>
                    </div>
                    <p class="text-xs text-muted-foreground mt-2">Basierend auf deinem letzten Log (oder Standard).</p>
                </CardContent>
            </Card>
        </div>

        <Separator orientation="horizontal"/>

        <section class="space-y-4">
            <Suggestions title="Workouts Vorschläge" type="youtube" :search-function="searchYouTube"
                         :search-term-suggestions="workoutSuggestions">
                <template #icon>
                    <Zap class="h-6 w-6 text-red-500"/>
                </template>
            </Suggestions>
        </section>

        <Separator orientation="horizontal"/>

        <section class="space-y-4">
            <Suggestions title="Meditation Vorschläge" type="youtube" :search-function="searchYouTube"
                         :search-term-suggestions="meditationSuggestions">
                <template #icon>
                    <BrainCircuit class="h-6 w-6 text-indigo-500"/>
                </template>
            </Suggestions>
        </section>

        <Separator orientation="horizontal"/>

        <section class="space-y-4">
            <Suggestions title="Rezepte Vorschläge" type="youtube" :search-function="searchYouTube"
                         :search-term-suggestions="recipeSuggestions">
                <template #icon>
                    <Utensils class="h-6 w-6 text-green-500"/>
                </template>
            </Suggestions>
        </section>
    </div>
</template>
