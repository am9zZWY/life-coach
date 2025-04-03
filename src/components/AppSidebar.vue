<script setup lang="ts">
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    type SidebarProps,
    SidebarRail,
} from '@/components/ui/sidebar'

const props = defineProps<SidebarProps>()
// This is sample data.
const data = {
    navMain: [
        {
            title: 'Getting Started',
            url: '#',
            items: [
                {
                    title: 'Installation',
                    url: '#',
                },
                {
                    title: 'Project Structure',
                    url: '#',
                },
            ],
        },
        {
            title: 'Building Your Application',
            url: '#',
            items: [
                {
                    title: 'Routing',
                    url: '#',
                },
                {
                    title: 'Data Fetching',
                    url: '#',
                    isActive: true,
                },
                {
                    title: 'Rendering',
                    url: '#',
                },
                {
                    title: 'Caching',
                    url: '#',
                },
                {
                    title: 'Styling',
                    url: '#',
                },
                {
                    title: 'Optimizing',
                    url: '#',
                },
                {
                    title: 'Configuring',
                    url: '#',
                },
                {
                    title: 'Testing',
                    url: '#',
                },
                {
                    title: 'Authentication',
                    url: '#',
                },
                {
                    title: 'Deploying',
                    url: '#',
                },
                {
                    title: 'Upgrading',
                    url: '#',
                },
                {
                    title: 'Examples',
                    url: '#',
                },
            ],
        },
        {
            title: 'API Reference',
            url: '#',
            items: [
                {
                    title: 'Components',
                    url: '#',
                },
                {
                    title: 'File Conventions',
                    url: '#',
                },
                {
                    title: 'Functions',
                    url: '#',
                },
                {
                    title: 'next.config.js Options',
                    url: '#',
                },
                {
                    title: 'CLI',
                    url: '#',
                },
                {
                    title: 'Edge Runtime',
                    url: '#',
                },
            ],
        },
        {
            title: 'Architecture',
            url: '#',
            items: [
                {
                    title: 'Accessibility',
                    url: '#',
                },
                {
                    title: 'Fast Refresh',
                    url: '#',
                },
                {
                    title: 'Next.js Compiler',
                    url: '#',
                },
                {
                    title: 'Supported Browsers',
                    url: '#',
                },
                {
                    title: 'Turbopack',
                    url: '#',
                },
            ],
        },
    ],
}
</script>
<template>
    <Sidebar v-bind="props">
        <SidebarHeader>
            LifeCoach
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup v-for="item in data.navMain" :key="item.title">
                <SidebarGroupLabel>{{ item.title }}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem v-for="childItem in item.items" :key="childItem.title">
                            <SidebarMenuButton as-child :is-active="childItem.isActive">
                                <a :href="childItem.url">{{ childItem.title }}</a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
        <SidebarRail/>
    </Sidebar>
</template>
