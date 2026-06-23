<script setup lang="ts">
import type { BeatEvent, CharacterChange, CharacterChangeCategory, EntityRecord, TimelineBeat, WorkspaceContentEntry } from '@story-studio/types'
import { PlusIcon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useLocale } from '@/composables/useLocale'
import { useContent } from '@/modules/content/useContent'
import { getEntityTitle } from '@/modules/entities/entities'
import { createInputModeBeatCards } from '@/modules/outlines/input-mode'
import { useOutline } from '@/modules/outlines/useOutline'
import { useStudioData } from '@/modules/storage/useStudioData'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'
import OutlineBeatEditor from './OutlineBeatEditor.vue'

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
  workspaceOutline,
  beats,
  plotLines,
  eventTags,
  addBeat,
  updateBeat,
  removeBeat,
  moveBeat,
} = useOutline()
const {
  entries: contentEntries,
  linkEntryToBeat,
} = useContent()
const mobileEditorOpen = ref(false)

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
const beatCards = computed(() => createInputModeBeatCards(workspaceOutline.value))
const characterOptions = computed<Array<{ id: string, label: string }>>(() => {
  return characterRecords.value.map(character => ({
    id: character.id,
    label: getCharacterLabel(character.id),
  }))
})
const characterChangeCategories = computed<Array<{ value: CharacterChangeCategory, label: string }>>(() => [
  { value: 'relationship', label: t('outline.change.relationship') },
  { value: 'personality', label: t('outline.change.personality') },
  { value: 'depth', label: t('outline.change.depth') },
  { value: 'state', label: t('outline.change.state') },
])
const linkedContentByBeatId = computed<Map<string, WorkspaceContentEntry>>(() => {
  return new Map(contentEntries.value
    .filter(entry => entry.outlineBeatId)
    .map(entry => [entry.outlineBeatId!, entry]))
})

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

function selectBeat(beatId: string): void {
  selectedBeatIdModel.value = beatId

  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches)
    mobileEditorOpen.value = true
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

function linkSelectedBeatContentEntry(contentEntryId: string): void {
  if (!selectedBeat.value)
    return

  const currentLinkedEntry = linkedContentByBeatId.value.get(selectedBeat.value.id)

  if (!contentEntryId) {
    if (currentLinkedEntry)
      linkEntryToBeat(currentLinkedEntry.id, '')

    return
  }

  linkEntryToBeat(contentEntryId, selectedBeat.value.id)
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

function getCharacterLabel(characterId: string): string {
  const character = characterRecords.value.find(record => record.id === characterId)

  return character ? getEntityTitle(character, studioData.document.value.propertyDefinitions) : t('outline.characterMissing')
}

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
</script>

<template>
  <div class="lg:grid lg:h-[calc(100svh-13rem)] lg:min-h-[34rem] lg:grid-cols-[22rem_minmax(0,1fr)] lg:overflow-hidden">
    <aside class="border-border/70 border-b p-4 lg:h-full lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div v-if="beatCards.length" class="grid gap-3">
        <button
          v-for="card in beatCards"
          :key="card.beat.id"
          type="button"
          class="hover:bg-muted focus-visible:ring-ring/50 grid rounded-md border px-3 py-3 text-left transition focus-visible:ring-3"
          :class="card.beat.id === selectedBeat?.id ? 'border-primary bg-muted' : 'border-border/70'"
          :aria-label="`${t('outline.openInputEditor')} ${card.beat.title}`"
          @click="selectBeat(card.beat.id)"
        >
          <span class="text-muted-foreground text-xs">{{ card.beat.timeLabel || t('outline.timeEmpty') }}</span>
          <span class="mt-1 truncate text-sm font-medium">{{ card.beat.title }}</span>
          <span class="text-muted-foreground mt-2 line-clamp-2 text-xs">{{ card.beat.summary || t('outline.summaryEmpty') }}</span>
          <span class="mt-3 flex flex-wrap gap-1">
            <span
              v-for="plotLine in card.plotLines"
              :key="plotLine.id"
              class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[11px]"
            >
              {{ plotLine.title }}
            </span>
            <span v-if="card.eventCount" class="bg-muted-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 text-[11px]">
              {{ card.eventCount }} {{ t('outline.events') }}
            </span>
            <span v-if="card.characterChangeCount" class="bg-muted-foreground/10 text-muted-foreground rounded px-1.5 py-0.5 text-[11px]">
              {{ card.characterChangeCount }} {{ t('outline.characterChanges') }}
            </span>
            <span v-if="linkedContentByBeatId.get(card.beat.id)" class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[11px]">
              {{ t('outline.linkedContentShort') }} {{ linkedContentByBeatId.get(card.beat.id)?.chapter || t('content.chapter') }}
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

    <div class="hidden h-full overflow-y-auto p-5 lg:block">
      <OutlineBeatEditor
        v-if="selectedBeat"
        :beat="selectedBeat"
        :plot-lines="plotLines"
        :event-tags="eventTags"
        :content-entries="contentEntries"
        :linked-content-entry="linkedContentByBeatId.get(selectedBeat.id)"
        :character-options="characterOptions"
        :character-change-categories="characterChangeCategories"
        sticky-header
        @update-beat="updateSelectedBeat"
        @link-content-entry="linkSelectedBeatContentEntry"
        @create-event="createEvent"
        @update-event="updateEvent"
        @remove-event="removeEvent"
        @toggle-plot-line="togglePlotLine"
        @toggle-event-tag="toggleEventTag"
        @create-character-change="createCharacterChange"
        @update-character-change="updateCharacterChange"
        @remove-character-change="removeCharacterChange"
        @move-beat="moveBeat"
        @delete-beat="deleteSelectedBeat"
      />

      <div v-else class="text-muted-foreground grid min-h-80 place-items-center rounded-md border border-dashed text-sm">
        {{ t('outline.empty') }}
      </div>
    </div>

    <Sheet v-model:open="mobileEditorOpen">
      <SheetContent side="bottom" class="max-h-[88svh] overflow-y-auto rounded-t-lg p-0 lg:hidden">
        <SheetHeader class="border-border/70 border-b pr-12">
          <SheetTitle>{{ selectedBeat?.title ?? t('outline.inputMode') }}</SheetTitle>
          <SheetDescription>{{ t('outline.inputEditorSheet') }}</SheetDescription>
        </SheetHeader>
        <div class="p-4">
          <OutlineBeatEditor
            v-if="selectedBeat"
            :beat="selectedBeat"
            :plot-lines="plotLines"
            :event-tags="eventTags"
            :content-entries="contentEntries"
            :linked-content-entry="linkedContentByBeatId.get(selectedBeat.id)"
            :character-options="characterOptions"
            :character-change-categories="characterChangeCategories"
            @update-beat="updateSelectedBeat"
            @link-content-entry="linkSelectedBeatContentEntry"
            @create-event="createEvent"
            @update-event="updateEvent"
            @remove-event="removeEvent"
            @toggle-plot-line="togglePlotLine"
            @toggle-event-tag="toggleEventTag"
            @create-character-change="createCharacterChange"
            @update-character-change="updateCharacterChange"
            @remove-character-change="removeCharacterChange"
            @move-beat="moveBeat"
            @delete-beat="deleteSelectedBeat"
          />
          <div v-else class="text-muted-foreground grid min-h-64 place-items-center rounded-md border border-dashed text-sm">
            {{ t('outline.empty') }}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
