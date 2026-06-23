<script setup lang="ts">
import { BotIcon, PaletteIcon, SettingsIcon } from '@lucide/vue'
import { ref } from 'vue'
import { useLocale } from '@/composables/useLocale'
import AssistantProviderSettingsPanel from './AssistantProviderSettingsPanel.vue'
import AssistantRunnerPanel from './AssistantRunnerPanel.vue'
import AssistantStyleSettingsPanel from './AssistantStyleSettingsPanel.vue'

const { t } = useLocale()

type AssistantSettingsTab = 'ai-config' | 'ai-style'

const activeSettingsTab = ref<AssistantSettingsTab>('ai-config')

const assistantSettingsTabs = [
  {
    id: 'ai-config',
    labelKey: 'assistant.aiSettingsTitle',
    panelId: 'assistant-ai-config-panel',
  },
  {
    id: 'ai-style',
    labelKey: 'assistant.styleSettingsTitle',
    panelId: 'assistant-ai-style-panel',
  },
] as const satisfies Array<{
  id: AssistantSettingsTab
  labelKey: 'assistant.aiSettingsTitle' | 'assistant.styleSettingsTitle'
  panelId: string
}>

function updateActiveSettingsTab(tab: AssistantSettingsTab): void {
  activeSettingsTab.value = tab
}
</script>

<template>
  <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
    <div class="border-border/70 flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          assistant settings
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ t('assistant.settingsTitle') }}
        </h1>
      </div>
      <BotIcon class="text-muted-foreground size-5" />
    </div>

    <div class="grid gap-5 p-5">
      <div class="border-border bg-muted/40 inline-grid w-full grid-cols-2 rounded-lg border p-1 md:w-fit" role="tablist" :aria-label="t('assistant.settingsTitle')">
        <button
          v-for="tab in assistantSettingsTabs"
          :id="`assistant-settings-tab-${tab.id}`"
          :key="tab.id"
          type="button"
          role="tab"
          class="focus-visible:ring-ring/50 flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:ring-3"
          :class="activeSettingsTab === tab.id ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'"
          :aria-selected="activeSettingsTab === tab.id"
          :aria-controls="tab.panelId"
          @click="updateActiveSettingsTab(tab.id)"
        >
          <SettingsIcon v-if="tab.id === 'ai-config'" class="size-4" />
          <PaletteIcon v-else class="size-4" />
          <span>{{ t(tab.labelKey) }}</span>
        </button>
      </div>

      <div
        v-show="activeSettingsTab === 'ai-config'"
        id="assistant-ai-config-panel"
        role="tabpanel"
        aria-labelledby="assistant-settings-tab-ai-config"
        class="grid gap-5"
      >
        <AssistantProviderSettingsPanel />
        <AssistantRunnerPanel />
      </div>

      <div
        v-show="activeSettingsTab === 'ai-style'"
        id="assistant-ai-style-panel"
        role="tabpanel"
        aria-labelledby="assistant-settings-tab-ai-style"
      >
        <AssistantStyleSettingsPanel />
      </div>
    </div>
  </section>
</template>
