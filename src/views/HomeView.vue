<script setup lang="ts">
import { computed, onMounted, ref } from 'vue' // Import onMounted
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { BrainCircuit, Dumbbell, Moon, Search, Snowflake, Sun, Utensils, Zap } from 'lucide-vue-next'

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

interface VideoResult {
    id: string
    title: string
    thumbnailUrl: string
    channelTitle: string
}

// Search terms and results refs
const workoutSearchTerm = ref('')
const meditationSearchTerm = ref('')
const recipeSearchTerm = ref('')

const workoutResults = ref<VideoResult[]>([])
const meditationResults = ref<VideoResult[]>([])
const recipeResults = ref<VideoResult[]>([])

// Loading states
const isLoadingWorkouts = ref(false)
const isLoadingMeditations = ref(false)
const isLoadingRecipes = ref(false)

// Search Suggestions
const workoutSuggestions = ref(['Ganzkörper', 'Cardio', 'Yoga', 'Bauchmuskeln', 'Rücken'])
const meditationSuggestions = ref(['Achtsamkeit', 'Schlaf', 'Stressabbau', '5 Minuten', 'Morgen'])
const recipeSuggestions = ref(['Schnell', 'Gesund', 'Vegan', 'Hähnchen', 'Salat', 'Frühstück'])

// --- Mock YouTube API Function ---
const searchYoutube = async (category: 'workouts' | 'meditations' | 'recipes', term?: string) => {
    let setLoading: (loading: boolean) => void
    let setResults: (results: VideoResult[]) => void
    let mockDataGenerator: (t?: string) => VideoResult[]
    const currentSearchTerm = term // Capture the term passed to the function

    switch (category) {
        case 'workouts':
            setLoading = (loading) => isLoadingWorkouts.value = loading
            setResults = (results) => workoutResults.value = results
            mockDataGenerator = (t) => [
                {
                    id: ' WOkWF4',
                    title: `${t || 'Ganzkörper'} Workout - Ohne Geräte`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/3B82F6/FFFFFF?text=Workout+1',
                    channelTitle: 'Fitness Guru'
                },
                {
                    id: ' WOkWF5',
                    title: `15 Min HIIT ${t ? `(${t})` : '(Intensiv)'}`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/10B981/FFFFFF?text=Workout+2',
                    channelTitle: 'Workout Channel'
                },
                {
                    id: ' WOkWF6',
                    title: `Yoga für ${t || 'Flexibilität'}`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/F59E0B/FFFFFF?text=Workout+3',
                    channelTitle: 'Yoga Studio'
                },
                {
                    id: ' WOkWF7',
                    title: `Effektives ${t || 'Bauch'} Training`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/EF4444/FFFFFF?text=Workout+4',
                    channelTitle: 'Sixpack Coach'
                },
            ]
            break
        case 'meditations':
            setLoading = (loading) => isLoadingMeditations.value = loading
            setResults = (results) => meditationResults.value = results
            mockDataGenerator = (t) => [
                {
                    id: ' Med1',
                    title: `10 Min Meditation für ${t || 'Stressabbau'}`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/6366F1/FFFFFF?text=Meditation+1',
                    channelTitle: 'Mindful Moments'
                },
                {
                    id: ' Med2',
                    title: `Geführte ${t || 'Achtsamkeits'} Meditation (5 Min)`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/EC4899/FFFFFF?text=Meditation+2',
                    channelTitle: 'Calm Space'
                },
                {
                    id: ' Med3',
                    title: `Meditation zum ${t || 'Einschlafen'}`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/8B5CF6/FFFFFF?text=Meditation+3',
                    channelTitle: 'Deep Sleep'
                },
            ]
            break
        case 'recipes':
            setLoading = (loading) => isLoadingRecipes.value = loading
            setResults = (results) => recipeResults.value = results
            mockDataGenerator = (t) => [
                {
                    id: ' Rec1',
                    title: `Gesundes ${t || 'Hähnchen'} Rezept (Schnell)`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/84CC16/FFFFFF?text=Rezept+1',
                    channelTitle: 'Healthy Eats'
                },
                {
                    id: ' Rec2',
                    title: `Einfache Vegane ${t || 'Pasta'}`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/F97316/FFFFFF?text=Rezept+2',
                    channelTitle: 'Vegan Delights'
                },
                {
                    id: ' Rec3',
                    title: `${t || 'Frühstück'} Smoothie Bowl`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/D946EF/FFFFFF?text=Rezept+3',
                    channelTitle: 'Good Food'
                },
                {
                    id: ' Rec4',
                    title: `Leckere ${t || 'Salat'} Idee`,
                    thumbnailUrl: 'https://via.placeholder.com/160x90/0EA5E9/FFFFFF?text=Rezept+4',
                    channelTitle: 'Simple Cooking'
                },
            ]
            break
        default:
            return
    }

    setLoading(true)
    setResults([]) // Clear previous results immediately for visual feedback

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Generate mock results based on the term provided
    setResults(mockDataGenerator(currentSearchTerm))
    setLoading(false)
}

// --- Function to handle suggestion click ---
const searchWithSuggestion = (category: 'workouts' | 'meditations' | 'recipes', suggestion: string) => {
    switch (category) {
        case 'workouts':
            workoutSearchTerm.value = suggestion
            searchYoutube('workouts', suggestion)
            break
        case 'meditations':
            meditationSearchTerm.value = suggestion
            searchYoutube('meditations', suggestion)
            break
        case 'recipes':
            recipeSearchTerm.value = suggestion
            searchYoutube('recipes', suggestion)
            break
    }
}

// --- Fetch initial curated content on component mount ---
onMounted(() => {
    searchYoutube('workouts') // Fetch default workouts
    searchYoutube('meditations') // Fetch default meditations
    searchYoutube('recipes') // Fetch default recipes
})

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

        <!-- Workout Videos Section -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Dumbbell class="h-6 w-6 text-blue-500"/>
                Workout Vorschläge
            </h2>
            <!-- Search Input -->
            <div class="flex w-full max-w-lg items-center space-x-2">
                <Input type="text" placeholder="Anderes Workout suchen..." v-model="workoutSearchTerm"
                       @keyup.enter="searchYoutube('workouts', workoutSearchTerm)"/>
                <Button type="button" @click="searchYoutube('workouts', workoutSearchTerm)"
                        :disabled="isLoadingWorkouts">
                    <Search class="h-4 w-4 mr-2"/>
                    Suchen
                </Button>
            </div>
            <!-- Search Suggestions -->
            <div class="flex flex-wrap gap-2">
                <Button
                    v-for="suggestion in workoutSuggestions"
                    :key="`workout-${suggestion}`"
                    variant="outline"
                    size="sm"
                    @click="searchWithSuggestion('workouts', suggestion)"
                    :disabled="isLoadingWorkouts"
                >
                    {{ suggestion }}
                </Button>
            </div>

            <!-- Workout Results Grid -->
            <div v-if="isLoadingWorkouts"
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                <Card v-for="n in 4" :key="`skel-workout-${n}`">
                    <CardContent class="p-0">
                        <AspectRatio :ratio="16 / 9">
                            <Skeleton class="w-full h-full rounded-t-lg"/>
                        </AspectRatio>
                    </CardContent>
                    <CardHeader class="pt-2 pb-4 px-4">
                        <Skeleton class="h-4 w-3/4 mb-1"/>
                        <Skeleton class="h-3 w-1/2"/>
                    </CardHeader>
                </Card>
            </div>
            <div v-else-if="workoutResults.length > 0"
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                <Card v-for="video in workoutResults" :key="video.id" class="overflow-hidden">
                    <a :href="`https://www.youtube.com/watch?v=${video.id}`" target="_blank" rel="noopener noreferrer"
                       class="block hover:opacity-90 transition-opacity">
                        <CardContent class="p-0">
                            <AspectRatio :ratio="16 / 9" class="bg-muted"><img :src="video.thumbnailUrl"
                                                                               :alt="video.title"
                                                                               class="object-cover w-full h-full rounded-t-lg"/>
                            </AspectRatio>
                        </CardContent>
                        <CardHeader class="pt-2 pb-4 px-4">
                            <CardTitle class="text-sm font-medium leading-tight line-clamp-2">{{
                                    video.title
                                }}
                            </CardTitle>
                            <CardDescription class="text-xs mt-1 truncate">{{ video.channelTitle }}</CardDescription>
                        </CardHeader>
                    </a>
                </Card>
            </div>
            <p v-else class="text-muted-foreground text-sm pt-2">
                Keine Workout-Videos gefunden{{ workoutSearchTerm ? ` für "${workoutSearchTerm}"` : '' }}. Versuche
                einen anderen Begriff oder Vorschlag.
            </p>
        </section>

        <Separator orientation="horizontal"/>

        <!-- Guided Meditations Section -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <BrainCircuit class="h-6 w-6 text-indigo-500"/>
                Meditations Vorschläge
            </h2>
            <!-- Search Input -->
            <div class="flex w-full max-w-lg items-center space-x-2">
                <Input type="text" placeholder="Andere Meditation suchen..." v-model="meditationSearchTerm"
                       @keyup.enter="searchYoutube('meditations', meditationSearchTerm)"/>
                <Button type="button" @click="searchYoutube('meditations', meditationSearchTerm)"
                        :disabled="isLoadingMeditations">
                    <Search class="h-4 w-4 mr-2"/>
                    Suchen
                </Button>
            </div>
            <!-- Search Suggestions -->
            <div class="flex flex-wrap gap-2">
                <Button
                    v-for="suggestion in meditationSuggestions"
                    :key="`med-${suggestion}`"
                    variant="outline"
                    size="sm"
                    @click="searchWithSuggestion('meditations', suggestion)"
                    :disabled="isLoadingMeditations"
                >
                    {{ suggestion }}
                </Button>
            </div>

            <!-- Meditation Results Grid -->
            <div v-if="isLoadingMeditations"
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                <Card v-for="n in 3" :key="`skel-med-${n}`">
                    <CardContent class="p-0">
                        <AspectRatio :ratio="16 / 9">
                            <Skeleton class="w-full h-full rounded-t-lg"/>
                        </AspectRatio>
                    </CardContent>
                    <CardHeader class="pt-2 pb-4 px-4">
                        <Skeleton class="h-4 w-3/4 mb-1"/>
                        <Skeleton class="h-3 w-1/2"/>
                    </CardHeader>
                </Card>
            </div>
            <div v-else-if="meditationResults.length > 0"
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                <Card v-for="video in meditationResults" :key="video.id" class="overflow-hidden">
                    <a :href="`https://www.youtube.com/watch?v=${video.id}`" target="_blank" rel="noopener noreferrer"
                       class="block hover:opacity-90 transition-opacity">
                        <CardContent class="p-0">
                            <AspectRatio :ratio="16 / 9" class="bg-muted"><img :src="video.thumbnailUrl"
                                                                               :alt="video.title"
                                                                               class="object-cover w-full h-full rounded-t-lg"/>
                            </AspectRatio>
                        </CardContent>
                        <CardHeader class="pt-2 pb-4 px-4">
                            <CardTitle class="text-sm font-medium leading-tight line-clamp-2">{{
                                    video.title
                                }}
                            </CardTitle>
                            <CardDescription class="text-xs mt-1 truncate">{{ video.channelTitle }}</CardDescription>
                        </CardHeader>
                    </a>
                </Card>
            </div>
            <p v-else class="text-muted-foreground text-sm pt-2">
                Keine Meditationen gefunden{{ meditationSearchTerm ? ` für "${meditationSearchTerm}"` : '' }}. Versuche
                einen anderen Begriff oder Vorschlag.
            </p>
        </section>

        <Separator orientation="horizontal"/>

        <!-- Healthy Recipes Section -->
        <section class="space-y-4">
            <h2 class="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Utensils class="h-6 w-6 text-green-500"/>
                Rezept Vorschläge
            </h2>
            <!-- Search Input -->
            <div class="flex w-full max-w-lg items-center space-x-2">
                <Input type="text" placeholder="Anderes Rezept suchen..." v-model="recipeSearchTerm"
                       @keyup.enter="searchYoutube('recipes', recipeSearchTerm)"/>
                <Button type="button" @click="searchYoutube('recipes', recipeSearchTerm)" :disabled="isLoadingRecipes">
                    <Search class="h-4 w-4 mr-2"/>
                    Suchen
                </Button>
            </div>
            <!-- Search Suggestions -->
            <div class="flex flex-wrap gap-2">
                <Button
                    v-for="suggestion in recipeSuggestions"
                    :key="`recipe-${suggestion}`"
                    variant="outline"
                    size="sm"
                    @click="searchWithSuggestion('recipes', suggestion)"
                    :disabled="isLoadingRecipes"
                >
                    {{ suggestion }}
                </Button>
            </div>

            <!-- Recipe Results Grid -->
            <div v-if="isLoadingRecipes"
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                <Card v-for="n in 4" :key="`skel-recipe-${n}`">
                    <CardContent class="p-0">
                        <AspectRatio :ratio="16 / 9">
                            <Skeleton class="w-full h-full rounded-t-lg"/>
                        </AspectRatio>
                    </CardContent>
                    <CardHeader class="pt-2 pb-4 px-4">
                        <Skeleton class="h-4 w-3/4 mb-1"/>
                        <Skeleton class="h-3 w-1/2"/>
                    </CardHeader>
                </Card>
            </div>
            <div v-else-if="recipeResults.length > 0"
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                <Card v-for="video in recipeResults" :key="video.id" class="overflow-hidden">
                    <a :href="`https://www.youtube.com/watch?v=${video.id}`" target="_blank" rel="noopener noreferrer"
                       class="block hover:opacity-90 transition-opacity">
                        <CardContent class="p-0">
                            <AspectRatio :ratio="16 / 9" class="bg-muted"><img :src="video.thumbnailUrl"
                                                                               :alt="video.title"
                                                                               class="object-cover w-full h-full rounded-t-lg"/>
                            </AspectRatio>
                        </CardContent>
                        <CardHeader class="pt-2 pb-4 px-4">
                            <CardTitle class="text-sm font-medium leading-tight line-clamp-2">{{
                                    video.title
                                }}
                            </CardTitle>
                            <CardDescription class="text-xs mt-1 truncate">{{ video.channelTitle }}</CardDescription>
                        </CardHeader>
                    </a>
                </Card>
            </div>
            <p v-else class="text-muted-foreground text-sm pt-2">
                Keine Rezepte gefunden{{ recipeSearchTerm ? ` für "${recipeSearchTerm}"` : '' }}. Versuche einen anderen
                Begriff oder Vorschlag.
            </p>
        </section>

    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
