<script setup lang="ts">
import type { BeatEvent, CharacterChange, CharacterChangeCategory, EntityRecord, TimelineBeat } from '@story-studio/types'
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { getEntityTitle } from '../entities/entities'
import { useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from '../workspaces/useWorkspaces'
import { useOutline } from './useOutline'

const props = defineProps<{
  selectedBeatId?: string
}>()

const emit = defineEmits<{
  'update:selectedBeatId': [value: string | undefined]
}>()

const { t } = useLocale()
const studioData = useStudioData()
const { activeWorkspace } = useWorkspaces()
const {
  beats,
  plotLines,
  eventTags,
  addBeat,
  updateBeat,
  removeBeat,
  moveBeat,
} = useOutline()

const selectedBeatIdModel = computed<string | undefined>({
  get: () => props.selectedBeatId,
  set: value => emit('update:selectedBeatId', value),
})
const selectedBeat = computed<TimelineBeat | undefined>(() => {
  return beats.value.find(beat => beat.id === selectedBeatIdModel.value) ?? beats.value[0]
})
const characterRecords = computed<EntityRecord[]>(() => {
  return studioData.document.value.entityRecords.filter(record => record.workspaceId === activeWorkspace.value.id && record.kind === 'character')
})
const characterChangeCategories = computed<Array<{ value: CharacterChangeCategory, label: string }>>(() => [
  { value: 'relationship', label: t('outline.change.relationship') },
  { value: 'personality', label: t('outline.change.personality') },
  { value: 'depth', label: t('outline.change.depth') },
  { value: 'state', label: t('outline.change.state') },
])

watch(beats, (nextBeats) => {
  if (!nextBeats.length) {
    selectedBeatIdModel.value = undefined
    return
  }

  if (!selectedBeatIdModel.value || !nextBeats.some(beat => beat.id === selectedBeatIdModel.value))
    selectedBeatIdModel.value = nextBeats[0]?.id
}, { immediate: true })

function createBeat(): void {
  const beat = addBeat()
  selectedBeatIdModel.value = beat.id
}

function updateSelectedBeat(patch: Parameters<typeof updateBeat>[1]): void {
  if (!selectedBeat.value)
    return

  updateBeat(selectedBeat.value.id, patch)
}

function deleteSelectedBeat(): void {
  if (!selectedBeat.value)
    return

  removeBeat(selectedBeat.value.id)
}

function togglePlotLine(plotLineId: string): void {
  if (!selectedBeat.value)
    return

  const ids = selectedBeat.value.plotLineIds.includes(plotLineId)
    ? selectedBeat.value.plotLineIds.filter(id => id !== plotLineId)
    : [...selectedBeat.value.plotLineIds, plotLineId]

  updateSelectedBeat({ plotLineIds: ids })
}

function createEvent(): void {
  if (!selectedBeat.value)
    return

  updateSelectedBeat({
    events: [
      ...selectedBeat.value.events,
      {
        id: createLocalId('event'),
        title: t('outline.newEvent'),
        description: '',
        tagIds: [],
      },
    ],
  })
}

function updateEvent(eventId: string, patch: Partial<BeatEvent>): void {
  if (!selectedBeat.value)
    return

  updateSelectedBeat({
    events: selectedBeat.value.events.map(event => event.id === eventId ? { ...event, ...patch } : event),
  })
}

function removeEvent(eventId: string): void {
  if (!selectedBeat.value)
    return

  updateSelectedBeat({
    events: selectedBeat.value.events.filter(event => event.id !== eventId),
  })
}

function toggleEventTag(event: BeatEvent, tagId: string): void {
  const tagIds = event.tagIds.includes(tagId)
    ? event.tagIds.filter(id => id !== tagId)
    : [...event.tagIds, tagId]

  updateEvent(event.id, { tagIds })
}

function createCharacterChange(): void {
  if (!selectedBeat.value || !characterRecords.value[0])
    return

  updateSelectedBeat({
    characterChanges: [
      ...selectedBeat.value.characterChanges,
      {
        id: createLocalId('change'),
        characterId: characterRecords.value[0].id,
        category: 'relationship',
        summary: '',
      },
    ],
  })
}

function updateCharacterChange(changeId: string, patch: Partial<CharacterChange>): void {
  if (!selectedBeat.value)
    return

  updateSelectedBeat({
    characterChanges: selectedBeat.value.characterChanges.map(change => change.id === changeId ? { ...change, ...patch } : change),
  })
}

function removeCharacterChange(changeId: string): void {
  if (!selectedBeat.value)
    return

  updateSelectedBeat({
    characterChanges: selectedBeat.value.characterChanges.filter(change => change.id !== changeId),
  })
}

function getPlotLineTitle(plotLineId: string): string {
  return plotLines.value.find(line => line.id === plotLineId)?.title ?? plotLineId
}

function getCharacterLabel(characterId: string): string {
  const character = characterRecords.value.find(record => record.id === characterId)

  return character ? getEntityTitle(character, studioData.document.value.propertyDefinitions) : t('outline.characterMissing')
}

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
</script>

<template>
  <div class="grid min-h-[34rem] lg:grid-cols-[22rem_minmax(0,1fr)]">
    <aside class="border-border/70 border-b p-4 lg:border-r lg:border-b-0">
      <div v-if="beats.length" class="grid gap-3">
        <button
          v-for="beat in beats"
          :key="beat.id"
          type="button"
          class="hover:bg-muted focus-visible:ring-ring/50 grid rounded-md border px-3 py-3 text-left transition focus-visible:ring-3"
          :class="beat.id === selectedBeat?.id ? 'border-primary bg-muted' : 'border-border/70'"
          @click="selectedBeatIdModel = beat.id"
        >
          <span class="text-muted-foreground text-xs">{{ beat.timeLabel || t('outline.timeEmpty') }}</span>
          <span class="mt-1 truncate text-sm font-medium">{{ beat.title }}</span>
          <span class="text-muted-foreground mt-2 line-clamp-2 text-xs">{{ beat.summary || t('outline.summaryEmpty') }}</span>
          <span class="mt-3 flex flex-wrap gap-1">
            <span
              v-for="plotLineId in beat.plotLineIds"
              :key="plotLineId"
              class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[11px]"
            >
              {{ getPlotLineTitle(plotLineId) }}
            </span>
            <span v-if="beat.characterChanges.length" class="bg-muted-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 text-[11px]">
              {{ beat.characterChanges.length }} {{ t('outline.characterChanges') }}
            </span>
          </span>
        </button>
      </div>
      <div v-else class="text-muted-foreground grid h-64 place-items-center rounded-md border border-dashed text-sm">
        <div class="grid justify-items-center gap-3">
          <p>{{ t('outline.empty') }}</p>
          <Button size="sm" @click="createBeat">
            <PlusIcon class="size-4" />
            {{ t('outline.addBeat') }}
          </Button>
        </div>
      </div>
    </aside>

    <div class="p-5">
      <div v-if="selectedBeat" class="grid gap-6">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-muted-foreground text-xs">
              {{ t('outline.currentBeat') }}
            </p>
            <h2 class="truncate text-xl font-semibold">
              {{ selectedBeat.title }}
            </h2>
          </div>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon-sm" :aria-label="t('outline.moveUp')" @click="moveBeat(selectedBeat.id, 'up')">
              <ArrowUpIcon class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" :aria-label="t('outline.moveDown')" @click="moveBeat(selectedBeat.id, 'down')">
              <ArrowDownIcon class="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" :aria-label="t('outline.deleteBeat')" @click="deleteSelectedBeat">
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
              <Input :model-value="selectedBeat.title" @update:model-value="updateSelectedBeat({ title: String($event) })" />
            </label>
            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('outline.timeLabel') }}</span>
              <Input :model-value="selectedBeat.timeLabel" :placeholder="t('outline.timePlaceholder')" @update:model-value="updateSelectedBeat({ timeLabel: String($event) })" />
            </label>
            <label class="grid gap-1.5 md:col-span-2">
              <span class="text-muted-foreground text-sm">{{ t('outline.summary') }}</span>
              <Textarea :model-value="selectedBeat.summary" @update:model-value="updateSelectedBeat({ summary: String($event) })" />
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
            <Button variant="outline" size="sm" @click="createEvent">
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
                <input type="checkbox" :checked="selectedBeat.plotLineIds.includes(plotLine.id)" @change="togglePlotLine(plotLine.id)">
                <span>{{ plotLine.title }}</span>
              </label>
            </div>
          </div>
          <div class="grid gap-3">
            <article v-for="event in selectedBeat.events" :key="event.id" class="border-border/70 grid gap-3 rounded-lg border p-3">
              <div class="flex items-center gap-2">
                <Input class="flex-1" :model-value="event.title" @update:model-value="updateEvent(event.id, { title: String($event) })" />
                <Button variant="ghost" size="icon-sm" :aria-label="t('outline.deleteEvent')" @click="removeEvent(event.id)">
                  <Trash2Icon class="size-4" />
                </Button>
              </div>
              <Textarea :model-value="event.description" :placeholder="t('outline.eventDescription')" @update:model-value="updateEvent(event.id, { description: String($event) })" />
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="tag in eventTags"
                  :key="tag.id"
                  class="bg-muted flex items-center gap-1.5 rounded px-2 py-1 text-xs"
                >
                  <input type="checkbox" :checked="event.tagIds.includes(tag.id)" @change="toggleEventTag(event, tag.id)">
                  <span>{{ tag.label }}</span>
                </label>
              </div>
            </article>
            <p v-if="!selectedBeat.events.length" class="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
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
            <Button variant="outline" size="sm" :disabled="!characterRecords.length" @click="createCharacterChange">
              <PlusIcon class="size-4" />
              {{ t('outline.addCharacterChange') }}
            </Button>
          </div>
          <div class="grid gap-3">
            <article v-for="change in selectedBeat.characterChanges" :key="change.id" class="border-border/70 grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_11rem_auto]">
              <select
                class="border-input bg-background h-9 rounded-md border px-2 text-sm"
                :value="change.characterId"
                @change="updateCharacterChange(change.id, { characterId: ($event.target as HTMLSelectElement).value })"
              >
                <option v-for="character in characterRecords" :key="character.id" :value="character.id">
                  {{ getCharacterLabel(character.id) }}
                </option>
              </select>
              <select
                class="border-input bg-background h-9 rounded-md border px-2 text-sm"
                :value="change.category"
                @change="updateCharacterChange(change.id, { category: ($event.target as HTMLSelectElement).value as CharacterChangeCategory })"
              >
                <option v-for="category in characterChangeCategories" :key="category.value" :value="category.value">
                  {{ category.label }}
                </option>
              </select>
              <Button variant="ghost" size="icon-sm" :aria-label="t('outline.deleteCharacterChange')" @click="removeCharacterChange(change.id)">
                <Trash2Icon class="size-4" />
              </Button>
              <Textarea class="md:col-span-3" :model-value="change.summary" :placeholder="t('outline.characterChangeSummary')" @update:model-value="updateCharacterChange(change.id, { summary: String($event) })" />
            </article>
            <p v-if="!selectedBeat.characterChanges.length" class="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
              {{ characterRecords.length ? t('outline.characterChangesEmpty') : t('outline.characterRequired') }}
            </p>
          </div>
        </section>
      </div>

      <div v-else class="text-muted-foreground grid min-h-80 place-items-center rounded-md border border-dashed text-sm">
        {{ t('outline.empty') }}
      </div>
    </div>
  </div>
</template>
