<template>
    <Card>
        <CardContent class="p-0">
            <AspectRatio :ratio="16 / 9">
                <img src="https://via.placeholder.com/300x169" alt="Placeholder" class="object-cover w-full h-full"/>
            </AspectRatio>
        </CardContent>
        <CardHeader class="pt-2 pb-4 px-4">
            <slot name="title"/>
        </CardHeader>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
</script>
