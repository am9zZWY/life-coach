<script setup lang="ts">
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
</script>

<template>
    <header class="px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <Avatar>
                <AvatarImage src="/logo.png"/>
                <AvatarFallback class="bg-blue-100">LC</AvatarFallback>
            </Avatar>
            <h1 class="font-bold text-lg">LifeCoach</h1>
        </div>
        <div class="flex items-center gap-2">
            <Button size="icon" variant="ghost" class="rounded-full">
                <HeartIcon class="h-5 w-5 text-red-500"/>
            </Button>
            <Button size="icon" variant="ghost" class="rounded-full">
                <PlusIcon class="h-5 w-5 text-gray-500"/>
            </Button>
        </div>
    </header>
</template>
