<script setup lang="ts">
import '@/styles/global.css';

import { RouterView } from 'vue-router'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Apple, Goal, House } from "lucide-vue-next"
import { Button } from "@/components/ui/button";
</script>

<template>
    <SidebarProvider>
        <SidebarInset>
            <!-- App Container -->
            <main class="flex-1 px-4 py-2 space-y-4 overflow-auto">
                <RouterView/>
            </main>

            <!-- Bottom Navigation -->
            <nav class="fixed bottom-0 left-0 right-0 z-10 border-t bg-background md:hidden">
                <div class="grid h-16 grid-cols-3">
                    <Button variant="ghost" class="flex flex-col items-center justify-center rounded-none">
                        <House class="h-5 w-5"/>
                        <span class="messages-xs">Home</span>
                    </Button>
                    <Button variant="ghost" class="flex flex-col items-center justify-center rounded-none">
                        <Apple class="h-5 w-5"/>
                        <span class="messages-xs">Habits</span>
                    </Button>
                    <Button variant="ghost" class="flex flex-col items-center justify-center rounded-none">
                        <Goal class="h-5 w-5"/>
                        <span class="messages-xs">Goals</span>
                    </Button>
                </div>
            </nav>
        </SidebarInset>
    </SidebarProvider>
</template>
