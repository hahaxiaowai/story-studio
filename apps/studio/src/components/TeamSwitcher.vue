<script setup lang="ts">
import { ArchiveIcon, CheckIcon, ChevronsUpDownIcon, GalleryVerticalEndIcon, PencilIcon, PlusIcon, RotateCcwIcon } from '@lucide/vue'
import { ref } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import WorkspaceCreateDialog from '@/components/WorkspaceCreateDialog.vue'
import WorkspaceDetailsDialog from '@/components/WorkspaceDetailsDialog.vue'
import { useLocale } from '@/composables/useLocale'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'

const { isMobile } = useSidebar()
const { t } = useLocale()
const createDialogOpen = ref(false)
const detailsDialogOpen = ref(false)
const {
  activeWorkspace,
  activeWorkspaceId,
  archiveActiveWorkspace,
  archivedWorkspaces,
  draftWorkspaces,
  restoreArchivedWorkspace,
  setActiveWorkspace,
} = useWorkspaces()
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <GalleryVerticalEndIcon class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ activeWorkspace.title }}</span>
              <span class="truncate text-xs">{{ t('app.workspace') }}</span>
            </div>
            <ChevronsUpDownIcon class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-muted-foreground text-xs">
            {{ t('app.spaces') }}
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="workspace in draftWorkspaces"
            :key="workspace.id"
            class="gap-2 p-2"
            @click="setActiveWorkspace(workspace.id)"
          >
            <div class="flex size-6 items-center justify-center rounded-md border">
              <GalleryVerticalEndIcon class="size-3.5 shrink-0" />
            </div>
            <span class="min-w-0 flex-1 truncate">{{ workspace.title }}</span>
            <DropdownMenuShortcut v-if="workspace.id === activeWorkspaceId">
              <CheckIcon class="size-3.5" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="gap-2 p-2" @click="detailsDialogOpen = true">
            <div class="bg-background flex size-6 items-center justify-center rounded-md border">
              <PencilIcon class="size-4" />
            </div>
            <div class="text-muted-foreground font-medium">
              {{ t('menu.editWorkspace') }}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            class="gap-2 p-2"
            :disabled="draftWorkspaces.length <= 1"
            @click="archiveActiveWorkspace"
          >
            <div class="bg-background flex size-6 items-center justify-center rounded-md border">
              <ArchiveIcon class="size-4" />
            </div>
            <div class="text-muted-foreground font-medium">
              {{ t('workspace.archiveCurrent') }}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem class="gap-2 p-2" @click="createDialogOpen = true">
            <div class="bg-background flex size-6 items-center justify-center rounded-md border">
              <PlusIcon class="size-4" />
            </div>
            <div class="text-muted-foreground font-medium">
              {{ t('menu.newWorkspace') }}
            </div>
          </DropdownMenuItem>
          <template v-if="archivedWorkspaces.length">
            <DropdownMenuSeparator />
            <DropdownMenuLabel class="text-muted-foreground text-xs">
              {{ t('workspace.archivedGroup') }}
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="workspace in archivedWorkspaces"
              :key="workspace.id"
              class="gap-2 p-2"
              @click="restoreArchivedWorkspace(workspace.id)"
            >
              <div class="flex size-6 items-center justify-center rounded-md border">
                <RotateCcwIcon class="size-3.5 shrink-0" />
              </div>
              <span class="min-w-0 flex-1 truncate">{{ t('workspace.restore') }} {{ workspace.title }}</span>
            </DropdownMenuItem>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
      <WorkspaceCreateDialog v-model:open="createDialogOpen" />
      <WorkspaceDetailsDialog v-model:open="detailsDialogOpen" />
    </SidebarMenuItem>
  </SidebarMenu>
</template>
