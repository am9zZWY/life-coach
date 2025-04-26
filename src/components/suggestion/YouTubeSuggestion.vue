<template>
  <Card class="overflow-hidden">
    <a :href="suggestion.url" target="_blank" rel="noopener noreferrer"
       class="block hover:opacity-90 transition-opacity">
      <CardContent class="p-0">
        <AspectRatio :ratio="16 / 9" class="bg-muted">
          <img :src="suggestion.thumbnailUrl"
               :alt="suggestion.title"
               class="object-cover w-full h-full rounded-t-lg" />
        </AspectRatio>
      </CardContent>
      <CardHeader class="pt-2 pb-4 px-4">
        <CardTitle class="messages-sm font-medium leading-tight line-clamp-2">{{
            suggestion.title
          }}
        </CardTitle>
        <CardDescription class="messages-xs mt-1 truncate">{{ suggestion.channelTitle }}</CardDescription>
      </CardHeader>
    </a>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { toRefs } from 'vue'
import type { YouTubeSuggestionModel } from '@/models/suggestion.ts'

const props = defineProps<{
  suggestion: YouTubeSuggestionModel
}>()

const { suggestion } = toRefs(props)
</script>
