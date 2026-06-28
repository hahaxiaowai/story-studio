<script setup lang="ts">
import type { BeatEvent, EntityRecord, TimelineBeat } from '@story-studio/types'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useLocale } from '@/composables/useLocale'
import { getEntityTitle } from '@/modules/entities/entities'
import { createChronicleCanvasModel, createChronicleMobileCards, createChronicleModel } from '@/modules/outlines/chronicle'
import { useOutline } from '@/modules/outlines/useOutline'
import { useStudioData } from '@/modules/storage/useStudioData'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'
import OutlineChronicleCanvas from './OutlineChronicleCanvas.vue'

const props = defineProps<{
  selectedBeatId?: string
  hasBeats: boolean
}>()

const emit = defineEmits<{
  'update:selectedBeatId': [value: string | undefined]
  'addBeat': []
  'editDetails': []
}>()

const { t } = useLocale()
const studioData = useStudioData()
const { activeWorkspace } = useWorkspaces()
const {
  workspaceOutline,
  eventTags,
  plotLines,
  updateBeat,
} = useOutline()

type ChronicleDensity = 'compact' | 'standard' | 'expanded'
type ChronicleView = 'board' | 'canvas'

const selectedBeatIdModel = computed<string | undefined>({
  get: () => props.selectedBeatId,
  set: value => emit('update:selectedBeatId', value),
})
const density = ref<ChronicleDensity>('standard')
const chronicleView = ref<ChronicleView>('board')
const mobileInspectorOpen = ref(false)
const chronicleViewOptions = computed<Array<{ value: ChronicleView, label: string }>>(() => [
  { value: 'board', label: t('outline.boardTimelineView') },
  { value: 'canvas', label: t('outline.canvasTimelineView') },
])
const densityOptions = computed<Array<{ value: ChronicleDensity, label: string }>>(() => [
  { value: 'compact', label: t('outline.densityCompact') },
  { value: 'standard', label: t('outline.densityStandard') },
  { value: 'expanded', label: t('outline.densityExpanded') },
])
const characterRecords = computed<EntityRecord[]>(() => {
  return studioData.document.value.entityRecords.filter(record => record.workspaceId === activeWorkspace.value.id && record.kind === 'character')
})
const chronicle = computed(() => createChronicleModel({
  outline: workspaceOutline.value,
  characters: characterRecords.value,
  getCharacterTitle: character => getEntityTitle(character, studioData.document.value.propertyDefinitions),
}))
const chronicleCanvasModel = computed(() => createChronicleCanvasModel(chronicle.value))
const mobileCards = computed(() => createChronicleMobileCards(chronicle.value))
const selectedBeat = computed<TimelineBeat | undefined>(() => {
  return chronicle.value.columns.find(beat => beat.id === selectedBeatIdModel.value) ?? chronicle.value.columns[0]
})
const laneMinHeightClass = computed<string>(() => {
  if (density.value === 'compact')
    return 'min-h-20'

  if (density.value === 'expanded')
    return 'min-h-36'

  return 'min-h-28'
})
const characterLaneMinHeightClass = computed<string>(() => density.value === 'compact' ? 'min-h-16' : 'min-h-24')
const timelineGridStyle = computed(() => ({
  gridTemplateColumns: `${density.value === 'compact' ? '10rem' : '12rem'} repeat(${Math.max(chronicle.value.columns.length, 1)}, minmax(${getColumnWidth(density.value)}, ${getColumnWidth(density.value)}))`,
}))

function selectBeat(beatId: string): void {
  selectedBeatIdModel.value = beatId
}

function openMobileInspector(beatId: string): void {
  selectBeat(beatId)
  mobileInspectorOpen.value = true
}

function updateSelectedBeat(patch: Parameters<typeof updateBeat>[1]): void {
  if (!selectedBeat.value)
    return

  updateBeat(selectedBeat.value.id, patch)
}

function getLaneBeat(beatId: string, beats: TimelineBeat[]): TimelineBeat | undefined {
  return beats.find(beat => beat.id === beatId)
}

function togglePlotLine(plotLineId: string): void {
  if (!selectedBeat.value)
    return

  const plotLineIds = selectedBeat.value.plotLineIds.includes(plotLineId)
    ? selectedBeat.value.plotLineIds.filter(id => id !== plotLineId)
    : [...selectedBeat.value.plotLineIds, plotLineId]

  updateSelectedBeat({ plotLineIds })
}

function updateEvent(eventId: string, patch: Partial<BeatEvent>): void {
  if (!selectedBeat.value)
    return

  updateSelectedBeat({
    events: selectedBeat.value.events.map(event => event.id === eventId ? { ...event, ...patch } : event),
  })
}

function toggleEventTag(event: BeatEvent, tagId: string): void {
  const tagIds = event.tagIds.includes(tagId)
    ? event.tagIds.filter(id => id !== tagId)
    : [...event.tagIds, tagId]

  updateEvent(event.id, { tagIds })
}

function getColumnWidth(value: ChronicleDensity): string {
  if (value === 'compact')
    return '12rem'

  if (value === 'expanded')
    return '20rem'

  return '16rem'
}
</script>

<template>
  <div class="min-h-[34rem] xl:grid xl:h-[calc(100svh-13rem)] xl:grid-cols-[minmax(0,1fr)_22rem]">
    <div class="border-border/70 min-w-0 border-b xl:h-full xl:overflow-hidden xl:border-r xl:border-b-0">
      <div v-if="hasBeats" class="xl:hidden">
        <div class="border-border/70 bg-muted/20 border-b px-4 py-3">
          <p class="text-sm font-medium">
            {{ t('outline.cardList') }}
          </p>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t('outline.cardListHint') }}
          </p>
        </div>
        <div class="grid gap-3 p-4">
          <button
            v-for="card in mobileCards"
            :key="card.beat.id"
            type="button"
            class="border-border bg-background focus-visible:ring-ring/50 grid gap-3 rounded-lg border p-4 text-left shadow-xs transition focus-visible:ring-3"
            :class="card.beat.id === selectedBeat?.id ? 'border-primary bg-primary/5' : 'hover:border-primary/60'"
            :aria-label="`${t('outline.inspectBeat')} ${card.beat.title}`"
            @click="openMobileInspector(card.beat.id)"
          >
            <div class="grid gap-1">
              <span class="text-muted-foreground text-xs">{{ card.beat.timeLabel || t('outline.timeEmpty') }}</span>
              <span class="text-base font-semibold">{{ card.beat.title }}</span>
              <span class="text-muted-foreground line-clamp-2 text-sm">{{ card.beat.summary || t('outline.summaryEmpty') }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="plotLine in card.plotLines"
                :key="plotLine.id"
                class="rounded px-2 py-0.5 text-xs"
                :style="{ backgroundColor: `${plotLine.color}1f`, color: plotLine.color }"
              >
                {{ plotLine.title }}
              </span>
            </div>
            <div class="text-muted-foreground flex flex-wrap gap-3 text-xs">
              <span>{{ card.eventCount }} {{ t('outline.events') }}</span>
              <span>{{ card.characterChangeCount }} {{ t('outline.characterChanges') }}</span>
            </div>
          </button>
        </div>
      </div>

      <div v-if="hasBeats" class="hidden h-full overflow-auto xl:block">
        <div class="border-border/70 bg-muted/20 sticky top-0 left-0 z-30 flex min-w-max items-center justify-between gap-6 border-b px-4 py-3">
          <div>
            <p class="text-sm font-medium">
              {{ t('outline.boardView') }}
            </p>
            <p class="text-muted-foreground mt-1 text-xs">
              {{ t('outline.boardViewHint') }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <div class="border-border bg-background grid grid-cols-2 rounded-md border p-1">
              <Button
                v-for="option in chronicleViewOptions"
                :key="option.value"
                size="sm"
                :variant="chronicleView === option.value ? 'default' : 'ghost'"
                @click="chronicleView = option.value"
              >
                {{ option.label }}
              </Button>
            </div>
            <div class="border-border bg-background grid grid-cols-3 rounded-md border p-1">
              <Button
                v-for="option in densityOptions"
                :key="option.value"
                size="sm"
                :variant="density === option.value ? 'default' : 'ghost'"
                @click="density = option.value"
              >
                {{ option.label }}
              </Button>
            </div>
          </div>
        </div>
        <OutlineChronicleCanvas
          v-if="chronicleView === 'canvas'"
          :density="density"
          :model="chronicleCanvasModel"
          :selected-beat-id="selectedBeat?.id"
          @select-beat="selectBeat"
        />
        <div v-else class="grid min-w-max" :style="timelineGridStyle">
          <div class="bg-background sticky top-0 left-0 z-20 border-r border-b p-3">
            <p class="text-muted-foreground text-xs font-medium uppercase">
              {{ t('outline.chronicleAxis') }}
            </p>
          </div>
          <div
            v-for="beat in chronicle.columns"
            :key="beat.id"
            class="bg-background sticky top-0 z-10 border-b p-3"
            :class="beat.id === selectedBeat?.id ? 'bg-primary/5' : ''"
          >
            <button
              type="button"
              class="focus-visible:ring-ring/50 grid w-full rounded-md px-2 py-1 text-left focus-visible:ring-3"
              :class="beat.id === selectedBeat?.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'"
              @click="selectBeat(beat.id)"
            >
              <span class="text-muted-foreground text-xs">{{ beat.timeLabel || t('outline.timeEmpty') }}</span>
              <span class="truncate text-sm font-semibold">{{ beat.title }}</span>
            </button>
          </div>

          <template v-for="lane in chronicle.plotLineLanes" :key="lane.id">
            <div class="bg-background sticky left-0 z-10 border-r border-b p-3" :class="laneMinHeightClass">
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full" :style="{ backgroundColor: lane.color }" />
                <p class="truncate text-sm font-medium">
                  {{ lane.title }}
                </p>
              </div>
              <p class="text-muted-foreground mt-1 text-xs">
                {{ t('outline.lineLane') }}
              </p>
            </div>
            <div
              v-for="column in chronicle.columns"
              :key="`${lane.id}-${column.id}`"
              class="border-b p-3"
              :class="[laneMinHeightClass, column.id === selectedBeat?.id ? 'bg-primary/5' : 'bg-background/60']"
            >
              <button
                v-if="getLaneBeat(column.id, lane.beats)"
                type="button"
                class="border-border hover:border-primary/70 focus-visible:ring-ring/50 grid w-full gap-2 rounded-md border bg-background p-3 text-left shadow-xs transition focus-visible:ring-3"
                :class="[column.id === selectedBeat?.id ? 'border-primary bg-primary/5' : '', density === 'compact' ? 'min-h-14' : 'min-h-20']"
                @click="selectBeat(column.id)"
              >
                <span class="truncate text-sm font-medium">{{ column.title }}</span>
                <span v-if="density !== 'compact'" class="text-muted-foreground line-clamp-2 text-xs">{{ column.summary || t('outline.summaryEmpty') }}</span>
                <span v-if="density === 'expanded'" class="flex flex-wrap gap-1">
                  <span
                    v-for="event in column.events"
                    :key="event.id"
                    class="bg-muted rounded px-1.5 py-0.5 text-[11px]"
                  >
                    {{ event.title }}
                  </span>
                </span>
              </button>
            </div>
          </template>

          <div class="bg-muted/40 sticky left-0 z-10 border-r border-b p-3">
            <p class="text-sm font-semibold">
              {{ t('outline.characterLanes') }}
            </p>
            <p class="text-muted-foreground mt-1 text-xs">
              {{ t('outline.characterLanesHint') }}
            </p>
          </div>
          <div
            v-for="column in chronicle.columns"
            :key="`character-header-${column.id}`"
            class="border-b p-3"
            :class="column.id === selectedBeat?.id ? 'bg-primary/5' : 'bg-muted/20'"
          />

          <template v-if="chronicle.characterLanes.length">
            <template v-for="lane in chronicle.characterLanes" :key="lane.id">
              <div class="bg-background sticky left-0 z-10 border-r border-b p-3" :class="characterLaneMinHeightClass">
                <p class="truncate text-sm font-medium">
                  {{ lane.title }}
                </p>
                <p class="text-muted-foreground mt-1 text-xs">
                  {{ t('outline.characterLane') }}
                </p>
              </div>
              <div
                v-for="column in chronicle.columns"
                :key="`${lane.id}-${column.id}`"
                class="border-b p-3"
                :class="[characterLaneMinHeightClass, column.id === selectedBeat?.id ? 'bg-primary/5' : 'bg-background/60']"
              >
                <button
                  v-if="lane.changesByBeatId[column.id]?.length"
                  type="button"
                  class="border-border hover:border-primary/70 focus-visible:ring-ring/50 grid w-full gap-1 rounded-md border bg-background p-3 text-left text-xs shadow-xs transition focus-visible:ring-3"
                  :class="column.id === selectedBeat?.id ? 'border-primary bg-primary/5' : ''"
                  @click="selectBeat(column.id)"
                >
                  <span
                    v-for="change in lane.changesByBeatId[column.id]"
                    :key="change.id"
                    :class="density === 'expanded' ? 'line-clamp-3' : 'line-clamp-2'"
                  >
                    {{ change.summary || t('outline.characterChangeEmpty') }}
                  </span>
                </button>
              </div>
            </template>
          </template>
          <template v-else>
            <div class="bg-background sticky left-0 z-10 border-r border-b p-3" />
            <div class="border-b p-3" :style="{ gridColumn: `span ${Math.max(chronicle.columns.length, 1)}` }">
              <p class="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
                {{ t('outline.characterLanesEmpty') }}
              </p>
            </div>
          </template>
        </div>
      </div>

      <div v-else class="text-muted-foreground grid min-h-[34rem] place-items-center p-5 text-sm">
        <div class="grid justify-items-center gap-3 rounded-md border border-dashed px-8 py-10">
          <p>{{ t('outline.chronicleEmpty') }}</p>
          <Button size="sm" @click="emit('addBeat')">
            {{ t('outline.addBeat') }}
          </Button>
        </div>
      </div>
    </div>

    <aside class="bg-muted/20 hidden h-full overflow-y-auto p-5 xl:block">
      <div v-if="selectedBeat" class="grid gap-4">
        <div>
          <p class="text-muted-foreground text-xs">
            {{ t('outline.chronicleInspector') }}
          </p>
          <h2 class="mt-1 line-clamp-2 text-lg font-semibold">
            {{ selectedBeat.title }}
          </h2>
        </div>
        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-sm">{{ t('outline.beatTitle') }}</span>
          <Input :model-value="selectedBeat.title" @update:model-value="updateSelectedBeat({ title: String($event) })" />
        </label>
        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-sm">{{ t('outline.timeLabel') }}</span>
          <Input :model-value="selectedBeat.timeLabel" :placeholder="t('outline.timePlaceholder')" @update:model-value="updateSelectedBeat({ timeLabel: String($event) })" />
        </label>
        <section class="grid gap-2">
          <h3 class="text-sm font-medium">
            {{ t('outline.lines') }}
          </h3>
          <label
            v-for="plotLine in plotLines"
            :key="plotLine.id"
            class="border-border bg-background flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <input type="checkbox" :checked="selectedBeat.plotLineIds.includes(plotLine.id)" @change="togglePlotLine(plotLine.id)">
            <span>{{ plotLine.title }}</span>
          </label>
        </section>
        <section class="grid gap-2">
          <h3 class="text-sm font-medium">
            {{ t('outline.eventTags') }}
          </h3>
          <div v-if="selectedBeat.events.length" class="grid gap-3">
            <article v-for="event in selectedBeat.events" :key="event.id" class="border-border bg-background rounded-md border p-3">
              <p class="truncate text-sm font-medium">
                {{ event.title }}
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
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
          </div>
          <p v-else class="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
            {{ t('outline.eventsEmpty') }}
          </p>
        </section>
        <Button variant="outline" @click="emit('editDetails')">
          {{ t('outline.editDetailsInInput') }}
        </Button>
      </div>
      <p v-else class="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
        {{ t('outline.chronicleSelectBeat') }}
      </p>
    </aside>

    <Sheet v-model:open="mobileInspectorOpen">
      <SheetContent side="bottom" class="max-h-[82svh] overflow-y-auto rounded-t-lg p-0 xl:hidden">
        <SheetHeader class="border-border/70 border-b pr-12">
          <SheetTitle>{{ selectedBeat?.title ?? t('outline.chronicleInspector') }}</SheetTitle>
          <SheetDescription>{{ t('outline.chronicleInspector') }}</SheetDescription>
        </SheetHeader>
        <div v-if="selectedBeat" class="grid gap-4 p-4">
          <label class="grid gap-1.5">
            <span class="text-muted-foreground text-sm">{{ t('outline.beatTitle') }}</span>
            <Input :model-value="selectedBeat.title" @update:model-value="updateSelectedBeat({ title: String($event) })" />
          </label>
          <label class="grid gap-1.5">
            <span class="text-muted-foreground text-sm">{{ t('outline.timeLabel') }}</span>
            <Input :model-value="selectedBeat.timeLabel" :placeholder="t('outline.timePlaceholder')" @update:model-value="updateSelectedBeat({ timeLabel: String($event) })" />
          </label>
          <section class="grid gap-2">
            <h3 class="text-sm font-medium">
              {{ t('outline.lines') }}
            </h3>
            <label
              v-for="plotLine in plotLines"
              :key="plotLine.id"
              class="border-border bg-background flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input type="checkbox" :checked="selectedBeat.plotLineIds.includes(plotLine.id)" @change="togglePlotLine(plotLine.id)">
              <span>{{ plotLine.title }}</span>
            </label>
          </section>
          <section class="grid gap-2">
            <h3 class="text-sm font-medium">
              {{ t('outline.eventTags') }}
            </h3>
            <div v-if="selectedBeat.events.length" class="grid gap-3">
              <article v-for="event in selectedBeat.events" :key="event.id" class="border-border bg-background rounded-md border p-3">
                <p class="truncate text-sm font-medium">
                  {{ event.title }}
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
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
            </div>
            <p v-else class="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
              {{ t('outline.eventsEmpty') }}
            </p>
          </section>
          <Button variant="outline" @click="emit('editDetails')">
            {{ t('outline.editDetailsInInput') }}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
