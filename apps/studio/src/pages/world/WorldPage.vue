<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import WorldSettingsPanel from './WorldSettingsPanel.vue'

const props = defineProps<{
  initialTab: 'settings' | 'map'
}>()

const { t } = useLocale()
const activeTab = ref<'settings' | 'map'>(props.initialTab)
const title = computed<string>(() => activeTab.value === 'settings' ? t('world.settings') : t('world.map'))
const WorldMapCanvas = defineAsyncComponent(() => import('./WorldMapCanvas.vue'))

watch(
  () => props.initialTab,
  (nextTab) => {
    activeTab.value = nextTab
  },
)
</script>

<template>
  <section class="flex flex-1 flex-col gap-4 pt-4" :aria-label="t('world.title')">
    <header class="border-border/70 bg-background rounded-lg border px-5 py-4 shadow-sm">
      <p class="text-muted-foreground text-xs font-medium uppercase">
        {{ t('world.title') }}
      </p>
      <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-normal">
            {{ title }}
          </h1>
          <p class="text-muted-foreground mt-2 text-sm">
            {{ t('world.description') }}
          </p>
        </div>
        <div class="border-border bg-muted/40 inline-grid grid-cols-2 rounded-lg border p-1">
          <button
            type="button"
            class="rounded-md px-3 py-2 text-sm font-medium transition"
            :class="activeTab === 'settings' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'settings'"
          >
            {{ t('world.settings') }}
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-sm font-medium transition"
            :class="activeTab === 'map' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'map'"
          >
            {{ t('world.map') }}
          </button>
        </div>
      </div>
    </header>

    <WorldSettingsPanel v-if="activeTab === 'settings'" />
    <WorldMapCanvas v-else />
  </section>
</template>
