<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRightIcon } from '@lucide/vue'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useLocale } from '@/composables/useLocale'

interface NavMainItem {
  title: string
  url: string
  icon: Component
  isActive?: boolean
  items?: Array<{
    title: string
    url: string
  }>
}

defineProps<{
  items: NavMainItem[]
}>()

const { t } = useLocale()
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>{{ t('nav.group.workspace') }}</SidebarGroupLabel>
    <SidebarMenu>
      <template v-for="item in items" :key="item.title">
        <Collapsible
          v-if="item.items?.length"
          as-child
          :default-open="item.isActive"
          class="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton :tooltip="item.title" :is-active="item.isActive">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
                <ChevronRightIcon class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                  <SidebarMenuSubButton as-child>
                    <a :href="subItem.url">
                      <span>{{ subItem.title }}</span>
                    </a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
        <SidebarMenuItem v-else>
          <SidebarMenuButton as="a" :href="item.url" :tooltip="item.title" :is-active="item.isActive">
            <component :is="item.icon" />
            <span>{{ item.title }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
