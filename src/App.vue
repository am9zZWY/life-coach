<script setup lang="ts">
import '@/styles/global.css';

import { RouterView } from 'vue-router'
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar.vue";
import { Apple, Goal, House } from "lucide-vue-next"
</script>

<template>
    <SidebarProvider>
        <AppSidebar/>
        <SidebarInset>
            <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger class="-ml-1"/>
                <Separator orientation="vertical" class="mr-2 h-4"/>
            </header>

            <!-- App Container -->
            <main class="flex-1 px-4 py-2 space-y-4 overflow-auto">
                <RouterView/>
            </main>

            <!-- Bottom Navigation -->
            <nav class="fixed bottom-0 left-0 right-0 z-10 border-t bg-background md:hidden">
                <div class="grid h-16 grid-cols-3">
                    <Button variant="ghost" class="flex flex-col items-center justify-center rounded-none">
                        <House class="h-5 w-5"/>
                        <span class="text-xs">Home</span>
                    </Button>
                    <Button variant="ghost" class="flex flex-col items-center justify-center rounded-none">
                        <Apple class="h-5 w-5"/>
                        <span class="text-xs">Habits</span>
                    </Button>
                    <Button variant="ghost" class="flex flex-col items-center justify-center rounded-none">
                        <Goal class="h-5 w-5"/>
                        <span class="text-xs">Goals</span>
                    </Button>
                </div>
            </nav>
        </SidebarInset>
    </SidebarProvider>
</template>
