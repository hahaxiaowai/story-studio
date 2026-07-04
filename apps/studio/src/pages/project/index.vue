<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useStudioData } from '@/modules/storage/useStudioData'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'
import AssistantChatPage from '@/pages/assistant/AssistantChatPage.vue'
import AssistantSettingsPage from '@/pages/assistant/AssistantSettingsPage.vue'
import ContentPage from '@/pages/content/ContentPage.vue'
import EntityWorkspace from '@/pages/entities/EntityWorkspace.vue'
import IntegrityPage from '@/pages/integrity/IntegrityPage.vue'
import MaterialPage from '@/pages/materials/MaterialPage.vue'
import OutlinePage from '@/pages/outline/OutlinePage.vue'
import WorldPage from '@/pages/world/WorldPage.vue'
import ProjectOverview from './ProjectOverview.vue'

const { t } = useLocale()
const { activeWorkspace } = useWorkspaces()
const studioData = useStudioData()
const currentHash = ref(getCurrentHash())
const workspaceSlug = computed<string>(() => activeWorkspace.value.id.replace(/^workspace-/, ''))
const outlineCount = computed<number>(() => studioData.document.value.outlines.find(outline => outline.workspaceId === activeWorkspace.value.id)?.beats.length ?? 0)
const characterCount = computed<number>(() => studioData.document.value.entityRecords.filter(record => record.workspaceId === activeWorkspace.value.id && record.kind === 'character').length || activeWorkspace.value.moduleCounts.characters)
const contentCount = computed<number>(() => studioData.document.value.contents.filter(entry => entry.workspaceId === activeWorkspace.value.id).length)
const activeView = computed<'overview' | 'outline' | 'characters' | 'world-settings' | 'world-map' | 'content' | 'materials' | 'assistant-chat' | 'assistant' | 'integrity'>(() => {
  if (currentHash.value === '#outline')
    return 'outline'

  if (currentHash.value === '#manuscript' || currentHash.value === '#content')
    return 'content'

  if (currentHash.value === '#cast' || currentHash.value === '#characters')
    return 'characters'

  if (currentHash.value === '#world-settings' || currentHash.value === '#maps')
    return 'world-settings'

  if (currentHash.value === '#world-map')
    return 'world-map'

  if (currentHash.value === '#materials')
    return 'materials'

  if (currentHash.value === '#assistant-chat')
    return 'assistant-chat'

  if (currentHash.value === '#assistant')
    return 'assistant'

  if (currentHash.value === '#integrity')
    return 'integrity'

  return 'overview'
})
const projectLayoutClass = computed<string>(() => {
  if (activeView.value === 'assistant-chat')
    return 'flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 pt-0'

  return 'flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 pt-0'
})

function getCurrentHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash
}

function syncCurrentHash(): void {
  currentHash.value = getCurrentHash()
}

onMounted(() => {
  syncCurrentHash()
  window.addEventListener('hashchange', syncCurrentHash)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncCurrentHash)
})
</script>

<template>
  <main id="project" :class="projectLayoutClass" :aria-label="t('project.aria.workspace')">
    <EntityWorkspace
      v-if="activeView === 'characters'"
      kind="character"
      :title="t('character.title')"
      :empty-label="t('character.empty')"
    />

    <OutlinePage v-else-if="activeView === 'outline'" />

    <ContentPage v-else-if="activeView === 'content'" />

    <MaterialPage v-else-if="activeView === 'materials'" />

    <AssistantChatPage v-else-if="activeView === 'assistant-chat'" />

    <AssistantSettingsPage v-else-if="activeView === 'assistant'" />

    <IntegrityPage v-else-if="activeView === 'integrity'" />

    <WorldPage
      v-else-if="activeView === 'world-settings' || activeView === 'world-map'"
      :initial-tab="activeView === 'world-map' ? 'map' : 'settings'"
    />

    <ProjectOverview
      v-else
      :workspace="activeWorkspace"
      :workspace-slug="workspaceSlug"
      :outline-count="outlineCount"
      :character-count="characterCount"
      :content-count="contentCount"
    />
  </main>
</template>
