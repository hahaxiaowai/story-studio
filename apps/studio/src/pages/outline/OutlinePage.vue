<script setup lang="ts">
import { ListTreeIcon, MoreHorizontalIcon, PlusIcon } from '@lucide/vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocale } from '@/composables/useLocale'
import { useOutline } from '@/modules/outlines/useOutline'
import OutlineChronicleMode from './OutlineChronicleMode.vue'
import OutlineInputMode from './OutlineInputMode.vue'
import OutlineLineManagerDialog from './OutlineLineManagerDialog.vue'

type OutlineMode = 'input' | 'chronicle'

const { t } = useLocale()
const {
  beats,
  eventTags,
  addBeat,
  addEventTag,
} = useOutline()

const mode = ref<OutlineMode>('chronicle')
const selectedBeatId = ref<string>()
const lineManagerOpen = ref(false)

function createBeat(): void {
  const beat = addBeat()
  selectedBeatId.value = beat.id
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
        <p class="text-muted-foreground text-sm">
          {{ t('outline.subtitle') }}
        </p>
        <h1 class="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">
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
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon-sm" :aria-label="t('outline.moreActions')">
              <MoreHorizontalIcon class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="lineManagerOpen = true">
              <ListTreeIcon class="size-4" />
              {{ t('outline.manageLines') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="createEventTag">
              <PlusIcon class="size-4" />
              {{ t('outline.addTag') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    <OutlineLineManagerDialog v-model:open="lineManagerOpen" />
  </section>
</template>
