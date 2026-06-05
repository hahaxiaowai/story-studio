<script setup lang="ts">
import type { BeatEvent, CharacterChange, CharacterChangeCategory, OutlineEventTag, PlotLine, TimelineBeat } from '@story-studio/types'
import type { UpdateBeatInput } from './useOutline'
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'

withDefaults(defineProps<{
  beat: TimelineBeat
  plotLines: PlotLine[]
  eventTags: OutlineEventTag[]
  characterOptions: Array<{ id: string, label: string }>
  characterChangeCategories: Array<{ value: CharacterChangeCategory, label: string }>
  stickyHeader?: boolean
}>(), {
  stickyHeader: false,
})

const emit = defineEmits<{
  updateBeat: [patch: UpdateBeatInput]
  createEvent: []
  updateEvent: [eventId: string, patch: Partial<BeatEvent>]
  removeEvent: [eventId: string]
  togglePlotLine: [plotLineId: string]
  toggleEventTag: [event: BeatEvent, tagId: string]
  createCharacterChange: []
  updateCharacterChange: [changeId: string, patch: Partial<CharacterChange>]
  removeCharacterChange: [changeId: string]
  moveBeat: [beatId: string, direction: 'up' | 'down']
  deleteBeat: []
}>()

const { t } = useLocale()
</script>

<template>
  <div class="grid gap-6">
    <div
      class="bg-background/95 flex items-center justify-between gap-3"
      :class="stickyHeader ? 'sticky top-0 z-10 border-border/70 border-b py-4' : ''"
    >
      <div class="min-w-0">
        <p class="text-muted-foreground text-xs">
          {{ t('outline.currentBeat') }}
        </p>
        <h2 class="truncate text-xl font-semibold">
          {{ beat.title }}
        </h2>
      </div>
      <div class="flex gap-1">
        <Button variant="ghost" size="icon-sm" :aria-label="t('outline.moveUp')" @click="emit('moveBeat', beat.id, 'up')">
          <ArrowUpIcon class="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" :aria-label="t('outline.moveDown')" @click="emit('moveBeat', beat.id, 'down')">
          <ArrowDownIcon class="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" :aria-label="t('outline.deleteBeat')" @click="emit('deleteBeat')">
          <Trash2Icon class="size-4" />
        </Button>
      </div>
    </div>

    <section class="border-border/70 bg-muted/20 grid gap-4 rounded-lg border p-4">
      <div>
        <h3 class="text-sm font-medium">
          {{ t('outline.overviewSection') }}
        </h3>
        <p class="text-muted-foreground mt-1 text-xs">
          {{ t('outline.overviewSectionHint') }}
        </p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-sm">{{ t('outline.beatTitle') }}</span>
          <Input :model-value="beat.title" @update:model-value="emit('updateBeat', { title: String($event) })" />
        </label>
        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-sm">{{ t('outline.timeLabel') }}</span>
          <Input :model-value="beat.timeLabel" :placeholder="t('outline.timePlaceholder')" @update:model-value="emit('updateBeat', { timeLabel: String($event) })" />
        </label>
        <label class="grid gap-1.5 md:col-span-2">
          <span class="text-muted-foreground text-sm">{{ t('outline.summary') }}</span>
          <Textarea :model-value="beat.summary" @update:model-value="emit('updateBeat', { summary: String($event) })" />
        </label>
      </div>
    </section>

    <section class="border-border/70 grid gap-4 rounded-lg border p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-medium">
            {{ t('outline.eventsSection') }}
          </h3>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t('outline.eventsSectionHint') }}
          </p>
        </div>
        <Button variant="outline" size="sm" @click="emit('createEvent')">
          <PlusIcon class="size-4" />
          {{ t('outline.addEvent') }}
        </Button>
      </div>
      <div class="grid gap-3">
        <h4 class="text-muted-foreground text-xs font-medium">
          {{ t('outline.lines') }}
        </h4>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="plotLine in plotLines"
            :key="plotLine.id"
            class="border-border bg-background flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <input type="checkbox" :checked="beat.plotLineIds.includes(plotLine.id)" @change="emit('togglePlotLine', plotLine.id)">
            <span>{{ plotLine.title }}</span>
          </label>
        </div>
      </div>
      <div class="grid gap-3">
        <article v-for="event in beat.events" :key="event.id" class="border-border/70 grid gap-3 rounded-lg border p-3">
          <div class="flex items-center gap-2">
            <Input class="flex-1" :model-value="event.title" @update:model-value="emit('updateEvent', event.id, { title: String($event) })" />
            <Button variant="ghost" size="icon-sm" :aria-label="t('outline.deleteEvent')" @click="emit('removeEvent', event.id)">
              <Trash2Icon class="size-4" />
            </Button>
          </div>
          <Textarea :model-value="event.description" :placeholder="t('outline.eventDescription')" @update:model-value="emit('updateEvent', event.id, { description: String($event) })" />
          <div class="flex flex-wrap gap-2">
            <label
              v-for="tag in eventTags"
              :key="tag.id"
              class="bg-muted flex items-center gap-1.5 rounded px-2 py-1 text-xs"
            >
              <input type="checkbox" :checked="event.tagIds.includes(tag.id)" @change="emit('toggleEventTag', event, tag.id)">
              <span>{{ tag.label }}</span>
            </label>
          </div>
        </article>
        <p v-if="!beat.events.length" class="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
          {{ t('outline.eventsEmpty') }}
        </p>
      </div>
    </section>

    <section class="border-border/70 grid gap-4 rounded-lg border p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-medium">
            {{ t('outline.characterSection') }}
          </h3>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t('outline.characterSectionHint') }}
          </p>
        </div>
        <Button variant="outline" size="sm" :disabled="!characterOptions.length" @click="emit('createCharacterChange')">
          <PlusIcon class="size-4" />
          {{ t('outline.addCharacterChange') }}
        </Button>
      </div>
      <div class="grid gap-3">
        <article v-for="change in beat.characterChanges" :key="change.id" class="border-border/70 grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_11rem_auto]">
          <select
            class="border-input bg-background h-9 rounded-md border px-2 text-sm"
            :value="change.characterId"
            @change="emit('updateCharacterChange', change.id, { characterId: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="character in characterOptions" :key="character.id" :value="character.id">
              {{ character.label }}
            </option>
          </select>
          <select
            class="border-input bg-background h-9 rounded-md border px-2 text-sm"
            :value="change.category"
            @change="emit('updateCharacterChange', change.id, { category: ($event.target as HTMLSelectElement).value as CharacterChangeCategory })"
          >
            <option v-for="category in characterChangeCategories" :key="category.value" :value="category.value">
              {{ category.label }}
            </option>
          </select>
          <Button variant="ghost" size="icon-sm" :aria-label="t('outline.deleteCharacterChange')" @click="emit('removeCharacterChange', change.id)">
            <Trash2Icon class="size-4" />
          </Button>
          <Textarea class="md:col-span-3" :model-value="change.summary" :placeholder="t('outline.characterChangeSummary')" @update:model-value="emit('updateCharacterChange', change.id, { summary: String($event) })" />
        </article>
        <p v-if="!beat.characterChanges.length" class="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
          {{ characterOptions.length ? t('outline.characterChangesEmpty') : t('outline.characterRequired') }}
        </p>
      </div>
    </section>
  </div>
</template>
