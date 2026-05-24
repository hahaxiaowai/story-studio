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
import { useLocale } from '@/composables/useLocale'

defineProps<{
  projects: Array<{
    name: string
    url: string
    icon: Component
  }>
}>()

const { isMobile } = useSidebar()
const { t } = useLocale()
</script>

<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>{{ t('nav.group.manuscripts') }}</SidebarGroupLabel>
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
              <span class="sr-only">{{ t('menu.more') }}</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="w-48 rounded-lg"
            :side="isMobile ? 'bottom' : 'right'"
            align="end"
          >
            <DropdownMenuItem>
              {{ t('menu.openProject') }}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {{ t('menu.rename') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {{ t('menu.archive') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
