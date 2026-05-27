<script setup lang="ts">
import { PlusIcon } from '@lucide/vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/composables/useLocale'
import OutlineChronicleMode from './OutlineChronicleMode.vue'
import OutlineInputMode from './OutlineInputMode.vue'
import { useOutline } from './useOutline'

type OutlineMode = 'input' | 'chronicle'

const { t } = useLocale()
const {
  beats,
  plotLines,
  eventTags,
  addBeat,
  addLine,
  addEventTag,
} = useOutline()

const mode = ref<OutlineMode>('input')
const selectedBeatId = ref<string>()

function createBeat(): void {
  const beat = addBeat()
  selectedBeatId.value = beat.id
}

function createLine(): void {
  addLine({
    title: `${t('outline.branch')} ${plotLines.value.length}`,
    kind: 'branch',
    color: '#db2777',
  })
}

function createEventTag(): void {
  addEventTag({
    label: `${t('outline.tag')} ${eventTags.value.length + 1}`,
    color: '#0891b2',
  })
}

function openInputMode(): void {
  mode.value = 'input'
}
</script>

<template>
  <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
    <div class="border-border/70 flex flex-col gap-3 border-b px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          timeline
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ t('outline.title') }}
        </h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="border-border bg-muted/50 grid grid-cols-2 rounded-md border p-1">
          <Button
            size="sm"
            :variant="mode === 'input' ? 'default' : 'ghost'"
            @click="mode = 'input'"
          >
            {{ t('outline.inputMode') }}
          </Button>
          <Button
            size="sm"
            :variant="mode === 'chronicle' ? 'default' : 'ghost'"
            @click="mode = 'chronicle'"
          >
            {{ t('outline.chronicleMode') }}
          </Button>
        </div>
        <Button variant="outline" size="sm" @click="createLine">
          <PlusIcon class="size-4" />
          {{ t('outline.addLine') }}
        </Button>
        <Button variant="outline" size="sm" @click="createEventTag">
          <PlusIcon class="size-4" />
          {{ t('outline.addTag') }}
        </Button>
        <Button size="sm" @click="createBeat">
          <PlusIcon class="size-4" />
          {{ t('outline.addBeat') }}
        </Button>
      </div>
    </div>

    <OutlineInputMode
      v-if="mode === 'input'"
      v-model:selected-beat-id="selectedBeatId"
    />
    <OutlineChronicleMode
      v-else
      v-model:selected-beat-id="selectedBeatId"
      :has-beats="beats.length > 0"
      @add-beat="createBeat"
      @edit-details="openInputMode"
    />
  </section>
</template>
