<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppHeaderActions from '@/components/AppHeaderActions.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useLocale } from '@/composables/useLocale'
import { useStudioData } from '@/modules/storage/useStudioData'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'
import { getNavigationLabelKey } from '@/modules/workspaces/workspaces'

const { t } = useLocale()
const { isLoaded, loadError } = useStudioData()
const { activeWorkspace } = useWorkspaces()
const currentHash = ref<string>(readHash())
const currentLabel = computed<string>(() => t(getNavigationLabelKey(currentHash.value)))

function readHash(): string {
  if (typeof window === 'undefined')
    return '#manuscript'

  return window.location.hash || '#manuscript'
}

function syncHash(): void {
  currentHash.value = readHash()
}

onMounted(() => {
  syncHash()
  window.addEventListener('hashchange', syncHash)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncHash)
})
</script>

<template>
  <SidebarProvider>
    <AppSidebar v-if="isLoaded" />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink href="#manuscript">
                  {{ activeWorkspace.title }}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{{ currentLabel }}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <AppHeaderActions />
      </header>
      <div v-if="!isLoaded" class="flex flex-1 items-center justify-center p-6">
        <p class="text-muted-foreground text-sm">
          {{ loadError ? t('project.empty') : t('project.sync') }}
        </p>
      </div>
      <slot v-else />
    </SidebarInset>
  </SidebarProvider>
</template>
