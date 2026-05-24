<script setup lang="ts">
import type { Component } from 'vue'
import { MoreHorizontalIcon } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

defineProps<{
  projects: Array<{
    name: string
    url: string
    icon: Component
  }>
}>()

const { isMobile } = useSidebar()
</script>

<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>Manuscripts</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem v-for="project in projects" :key="project.name">
        <SidebarMenuButton as-child>
          <a :href="project.url">
            <component :is="project.icon" />
            <span>{{ project.name }}</span>
          </a>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <SidebarMenuAction show-on-hover>
              <MoreHorizontalIcon />
              <span class="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-48 rounded-lg"
            :side="isMobile ? 'bottom' : 'right'"
            align="end"
          >
            <DropdownMenuItem>
              Open project
            </DropdownMenuItem>
            <DropdownMenuItem>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
