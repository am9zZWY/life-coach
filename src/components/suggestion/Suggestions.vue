<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { onMounted, ref, toRefs } from "vue";
import YouTubeSuggestion from "@/components/suggestion/YouTubeSuggestion.vue";
import { Search } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Suggestion from "@/components/suggestion/Suggestion.vue";
import type { SuggestionModel, SuggestionType, YouTubeSuggestionModel } from '@/models/suggestion.ts'

type SuggestionsProps = {
    title: string;
    type: SuggestionType;
    searchFunction: (term: string) => Promise<SuggestionModel[]>;
    searchTermSuggestions?: string[];
};

const props = defineProps<SuggestionsProps>();

const { title, searchFunction } = toRefs(props);
const isLoading = ref(false);
const searchTerm = ref('');

const suggestions = ref<SuggestionModel[]>([]);
const search = async (term: string) => {
    isLoading.value = true;
    try {
        suggestions.value = await searchFunction.value(term);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    } finally {
        isLoading.value = false;
    }
};

const searchWithSuggestion = async (suggestion: string) => {
    searchTerm.value = suggestion;
    await search(suggestion);
};

onMounted(() => {
    // Fetch initial suggestions if needed
    if (props.searchTermSuggestions) {
        searchTerm.value = props.searchTermSuggestions[0];
        search(props.searchTermSuggestions[0]);
    }
});
</script>


<template>
    <h2 class="messages-2xl font-semibold tracking-tight flex items-center gap-2">
        <slot name="icon"/>
        <span>{{ title }}</span>
    </h2>
    <!-- Search Input -->
    <div class="flex w-full max-w-lg items-center space-x-2">
        <Input type="messages" placeholder="Suche nach Vorschlägen..."
               @keyup.enter="search(searchTerm)" id="search-input"/>
        <Button type="button" @click="search(searchTerm)"
                :disabled="isLoading">
            <Search class="h-4 w-4 mr-2"/>
            Suchen
        </Button>
    </div>
    <!-- Search Suggestions -->
    <div class="flex flex-wrap gap-2">
        <Button
            v-for="suggestion in searchTermSuggestions ?? []"
            :key="`${type}-${suggestion}`"
            variant="outline"
            size="sm"
            @click="searchWithSuggestion(suggestion)"
            :disabled="isLoading"
        >
            {{ suggestion }}
        </Button>
    </div>

    <div v-if="isLoading"
         class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
        <Card v-for="n in 4" :key="`skel-${type}-${n}`">
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
    <div v-else-if="suggestions.length > 0"
         class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
        <template v-for="suggestion in suggestions" :key="`${type}-${suggestion.title}`">
            <YouTubeSuggestion v-if="type === 'youtube'" :suggestion="suggestion as YouTubeSuggestionModel"/>
            <Suggestion v-else/>
        </template>
    </div>
    <p v-else class="messages-muted-foreground messages-sm pt-2">
        Keine Vorschläge gefunden. Bitte versuche es mit einen anderen Begriff oder Vorschlag.
    </p>
</template>
