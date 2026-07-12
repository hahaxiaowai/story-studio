<script setup lang="ts">
import type { WorkspaceContentEntry } from '@story-studio/types'
import type { AssistantDraftInsertMode, ContentAssistantAction, ContentInlineAssistantTarget } from '@/modules/content/contentAssistant'
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, PenLineIcon, PlusIcon, RotateCcwIcon, ShieldCheckIcon, SparklesIcon, SquareIcon, Trash2Icon, XIcon } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { consumeAssistantContentDraftPayload } from '@/modules/assistant/assistantContentDraft'
import { queueAssistantDraftPrompt } from '@/modules/assistant/assistantDraft'
import { useAssistant } from '@/modules/assistant/useAssistant'
import { applyContentInlineAssistantSuggestion, buildContentAssistantPrompt, buildContentInlineAssistantPrompt, countContentWords, createContentFineOutlineDraftFromBeat, createContentInlineAssistantSuggestionPreview, createContentInlineAssistantTarget, insertAssistantDraftIntoContentEntries } from '@/modules/content/contentAssistant'
import { useContent } from '@/modules/content/useContent'
import { useContentInlineAssistant } from '@/modules/content/useContentInlineAssistant'
import { useOutline } from '@/modules/outlines/useOutline'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'
import ContentAiRevisionHistory from './ContentAiRevisionHistory.vue'

const { t } = useLocale()
const { searchQuery, entries, allEntries, entryCounts, addEntry, applyAiRevision, restoreAiRevision, deleteAiRevision, updateEntry, linkEntryToBeat, moveEntry, removeEntry } = useContent()
const { settings } = useAssistant()
const { activeWorkspace } = useWorkspaces()
const { beats } = useOutline()
const inlineAssistant = useContentInlineAssistant({ settings })
const selectedEntryId = ref<string>()
const pendingAssistantContent = ref('')
const assistantDraftTargetEntryId = ref('')
const inlineAssistantInstruction = ref('')
const inlineAssistantBodySelection = ref({ start: 0, end: 0 })
const inlineAssistantSelectionAnchor = ref({ top: 56, left: 24 })
const inlineAssistantPanelOpen = ref(false)
const inlineAssistantActiveTarget = ref<ContentInlineAssistantTarget>()
const inlineAssistantActiveEntryId = ref('')
const inlineAssistantUndoSnapshot = ref<{
  entryId: string
  previousBody: string
  nextBody: string
}>()

const selectedEntry = computed<WorkspaceContentEntry | undefined>(() => entries.value.find(entry => entry.id === selectedEntryId.value) ?? entries.value[0])
const selectedEntryIndex = computed<number>(() => selectedEntry.value ? entries.value.findIndex(entry => entry.id === selectedEntry.value?.id) : -1)
const isSearchingEntries = computed<boolean>(() => searchQuery.value.trim().length > 0)
const canMoveSelectedEntryUp = computed<boolean>(() => !isSearchingEntries.value && selectedEntryIndex.value > 0)
const canMoveSelectedEntryDown = computed<boolean>(() => !isSearchingEntries.value && selectedEntryIndex.value >= 0 && selectedEntryIndex.value < entries.value.length - 1)
const selectedTitle = computed<string>(() => {
  if (!selectedEntry.value)
    return t('content.title')

  return `${selectedEntry.value.volume || t('content.volume')} / ${selectedEntry.value.chapter || t('content.chapter')}`
})
const selectedWordCount = computed<number>(() => selectedEntry.value ? countContentWords(selectedEntry.value.body) : 0)
const selectedUpdatedAt = computed<string>(() => {
  if (!selectedEntry.value)
    return ''

  return new Date(selectedEntry.value.updatedAt).toLocaleString()
})
const selectedLinkedBeat = computed(() => {
  if (!selectedEntry.value?.outlineBeatId)
    return undefined

  return beats.value.find(beat => beat.id === selectedEntry.value?.outlineBeatId)
})
const hasSelectedFineOutline = computed<boolean>(() => {
  return !!selectedEntry.value?.fineOutline.trim()
})
const assistantDraftTargetEntry = computed(() => {
  return allEntries.value.find(entry => entry.id === assistantDraftTargetEntryId.value)
})
const currentInlineAssistantTarget = computed<ContentInlineAssistantTarget>(() => {
  return createContentInlineAssistantTarget(
    selectedEntry.value?.body ?? '',
    inlineAssistantBodySelection.value.start,
    inlineAssistantBodySelection.value.end,
  )
})
const displayedInlineAssistantTarget = computed<ContentInlineAssistantTarget>(() => {
  return inlineAssistantActiveTarget.value ?? currentInlineAssistantTarget.value
})
const inlineAssistantTargetLabel = computed<string>(() => {
  return displayedInlineAssistantTarget.value.kind === 'selection'
    ? t('content.inlineAssistantTargetSelection')
    : t('content.inlineAssistantTargetChapter')
})
const inlineAssistantTargetPreview = computed<string>(() => {
  return createInlineAssistantTargetPreview(displayedInlineAssistantTarget.value.text)
})
const showInlineAssistantToolbar = computed<boolean>(() => {
  return !!selectedEntry.value
    && currentInlineAssistantTarget.value.kind === 'selection'
    && !inlineAssistantPanelOpen.value
})
const inlineAssistantToolbarStyle = computed<Record<string, string>>(() => {
  return createInlineAssistantFloatingStyle(inlineAssistantSelectionAnchor.value, 144)
})
const inlineAssistantPanelStyle = computed<Record<string, string>>(() => {
  return createInlineAssistantFloatingStyle(inlineAssistantSelectionAnchor.value, 360)
})
const inlineAssistantPrompt = computed<string>(() => {
  if (!selectedEntry.value)
    return ''

  return buildContentInlineAssistantPrompt({
    workspaceTitle: activeWorkspace.value.title,
    entry: selectedEntry.value,
    linkedBeat: selectedLinkedBeat.value,
    target: currentInlineAssistantTarget.value,
    instruction: inlineAssistantInstruction.value,
  })
})
const inlineAssistantRunDisabledReason = computed<string>(() => {
  if (!selectedEntry.value)
    return t('content.empty')

  if (!inlineAssistantInstruction.value.trim())
    return t('content.inlineAssistantInstructionRequired')

  return inlineAssistant.getDisabledReason(inlineAssistantPrompt.value)
})
const canApplyInlineAssistantSuggestion = computed<boolean>(() => {
  return !!selectedEntry.value
    && inlineAssistantActiveEntryId.value === selectedEntry.value.id
    && !!inlineAssistantActiveTarget.value
    && !!inlineAssistant.output.value.trim()
    && !inlineAssistant.loading.value
})
const inlineAssistantSuggestionPreview = computed(() => {
  if (!selectedEntry.value || !inlineAssistantActiveTarget.value)
    return undefined

  return createContentInlineAssistantSuggestionPreview({
    body: selectedEntry.value.body,
    target: inlineAssistantActiveTarget.value,
    suggestion: inlineAssistant.output.value,
  })
})
const canUndoInlineAssistantSuggestion = computed<boolean>(() => {
  return !!selectedEntry.value
    && inlineAssistantUndoSnapshot.value?.entryId === selectedEntry.value.id
    && inlineAssistantUndoSnapshot.value.nextBody === selectedEntry.value.body
})

watch(entries, (nextEntries) => {
  if (!nextEntries.length) {
    selectedEntryId.value = undefined
    return
  }

  if (!selectedEntryId.value || !nextEntries.some(entry => entry.id === selectedEntryId.value))
    selectedEntryId.value = nextEntries[0]?.id
}, { immediate: true })

watch(() => selectedEntry.value?.id, () => {
  inlineAssistantBodySelection.value = { start: 0, end: 0 }
  inlineAssistantSelectionAnchor.value = { top: 56, left: 24 }
  inlineAssistantPanelOpen.value = false
  inlineAssistantInstruction.value = ''
  inlineAssistantActiveTarget.value = undefined
  inlineAssistantActiveEntryId.value = ''
  inlineAssistantUndoSnapshot.value = undefined
  inlineAssistant.reset()
})

onMounted(() => {
  const contentDraft = consumeAssistantContentDraftPayload()

  pendingAssistantContent.value = contentDraft.content

  if (pendingAssistantContent.value)
    assistantDraftTargetEntryId.value = getDefaultAssistantDraftTargetEntryId(contentDraft.suggestedEntryId)
})

function createEntry(): void {
  const entry = addEntry()

  searchQuery.value = ''
  selectedEntryId.value = entry.id
}

function updateSelectedEntry(input: { volume?: string, chapter?: string, fineOutline?: string, body?: string }): void {
  if (!selectedEntry.value)
    return

  updateEntry(selectedEntry.value.id, input)
}

function updateSelectedEntryBeat(event: Event): void {
  if (!selectedEntry.value)
    return

  linkEntryToBeat(selectedEntry.value.id, readEventValue(event))
}

function draftFineOutlineFromLinkedBeat(): void {
  if (!selectedEntry.value || !selectedLinkedBeat.value)
    return

  updateSelectedEntry({
    fineOutline: createContentFineOutlineDraftFromBeat(selectedLinkedBeat.value),
  })
}

function deleteSelectedEntry(): void {
  if (!selectedEntry.value)
    return

  removeEntry(selectedEntry.value.id)
}

function moveSelectedEntry(direction: 'up' | 'down'): void {
  if (!selectedEntry.value)
    return

  const entryId = selectedEntry.value.id

  moveEntry(entryId, direction)
  selectedEntryId.value = entryId
}

function insertAssistantContent(mode: AssistantDraftInsertMode): void {
  if (!assistantDraftTargetEntry.value || !pendingAssistantContent.value)
    return

  const [nextTargetEntry] = insertAssistantDraftIntoContentEntries([assistantDraftTargetEntry.value], {
    entryId: assistantDraftTargetEntry.value.id,
    draft: pendingAssistantContent.value,
    mode,
    now: new Date().toISOString(),
  })

  if (!nextTargetEntry)
    return

  updateEntry(nextTargetEntry.id, {
    body: nextTargetEntry.body,
  })
  searchQuery.value = ''
  selectedEntryId.value = nextTargetEntry.id
  pendingAssistantContent.value = ''
  assistantDraftTargetEntryId.value = ''
}

function updateAssistantDraftTarget(event: Event): void {
  assistantDraftTargetEntryId.value = readEventValue(event)
}

function previewAssistantDraft(mode: AssistantDraftInsertMode): string {
  if (!assistantDraftTargetEntry.value || !pendingAssistantContent.value)
    return ''

  const [nextTargetEntry] = insertAssistantDraftIntoContentEntries([assistantDraftTargetEntry.value], {
    entryId: assistantDraftTargetEntry.value.id,
    draft: pendingAssistantContent.value,
    mode,
    now: assistantDraftTargetEntry.value.updatedAt,
  })

  return nextTargetEntry?.body ?? ''
}

function dismissAssistantContent(): void {
  pendingAssistantContent.value = ''
  assistantDraftTargetEntryId.value = ''
}

function captureBodySelection(event: Event): void {
  if (!(event.target instanceof HTMLTextAreaElement))
    return

  inlineAssistantBodySelection.value = {
    start: event.target.selectionStart,
    end: event.target.selectionEnd,
  }
  inlineAssistantSelectionAnchor.value = resolveTextareaSelectionAnchor(event.target)

  if (event.target.selectionStart === event.target.selectionEnd && !inlineAssistant.loading.value)
    inlineAssistantPanelOpen.value = false
}

function openInlineAssistantPanel(): void {
  if (currentInlineAssistantTarget.value.kind !== 'selection')
    return

  inlineAssistantPanelOpen.value = true
}

async function runInlineAssistant(): Promise<void> {
  if (!selectedEntry.value || inlineAssistantRunDisabledReason.value)
    return

  inlineAssistantActiveTarget.value = currentInlineAssistantTarget.value
  inlineAssistantActiveEntryId.value = selectedEntry.value.id

  await inlineAssistant.run(inlineAssistantPrompt.value)
}

function applyInlineAssistantSuggestion(): void {
  if (!selectedEntry.value || !inlineAssistantActiveTarget.value || inlineAssistantActiveEntryId.value !== selectedEntry.value.id)
    return

  const nextBody = applyContentInlineAssistantSuggestion({
    body: selectedEntry.value.body,
    target: inlineAssistantActiveTarget.value,
    suggestion: inlineAssistant.output.value,
  })

  if (nextBody === selectedEntry.value.body)
    return

  inlineAssistantUndoSnapshot.value = {
    entryId: selectedEntry.value.id,
    previousBody: selectedEntry.value.body,
    nextBody,
  }
  applyAiRevision(selectedEntry.value.id, {
    instruction: inlineAssistantInstruction.value,
    targetKind: inlineAssistantActiveTarget.value.kind,
    nextBody,
  })
  dismissInlineAssistantSuggestion()
  inlineAssistantInstruction.value = ''
}

function restoreSelectedEntryAiRevision(revisionId: string): void {
  if (!selectedEntry.value)
    return

  restoreAiRevision(selectedEntry.value.id, revisionId, t('content.aiRevisionRestoreInstruction'))
  inlineAssistantUndoSnapshot.value = undefined
  inlineAssistantInstruction.value = ''
  dismissInlineAssistantSuggestion()
}

function deleteSelectedEntryAiRevision(revisionId: string): void {
  if (!selectedEntry.value)
    return

  deleteAiRevision(selectedEntry.value.id, revisionId)
}

function undoInlineAssistantSuggestion(): void {
  if (!selectedEntry.value || !canUndoInlineAssistantSuggestion.value || !inlineAssistantUndoSnapshot.value)
    return

  updateSelectedEntry({ body: inlineAssistantUndoSnapshot.value.previousBody })
  inlineAssistantUndoSnapshot.value = undefined
}

function dismissInlineAssistantSuggestion(): void {
  inlineAssistantPanelOpen.value = false
  inlineAssistantActiveTarget.value = undefined
  inlineAssistantActiveEntryId.value = ''
  inlineAssistant.reset()
}

function sendSelectedEntryToAssistant(action: ContentAssistantAction): void {
  if (!selectedEntry.value)
    return

  queueAssistantDraftPrompt(buildContentAssistantPrompt({
    action,
    workspaceTitle: activeWorkspace.value.title,
    entry: selectedEntry.value,
    linkedBeat: selectedLinkedBeat.value,
  }), {
    sourceContentEntryId: selectedEntry.value.id,
  })

  if (typeof window !== 'undefined')
    window.location.hash = '#assistant-chat'
}

function readEventValue(event: Event): string {
  return event.target instanceof HTMLSelectElement ? event.target.value : ''
}

function getDefaultAssistantDraftTargetEntryId(suggestedEntryId: string | undefined): string {
  if (suggestedEntryId && allEntries.value.some(entry => entry.id === suggestedEntryId))
    return suggestedEntryId

  return selectedEntry.value?.id ?? allEntries.value[0]?.id ?? ''
}

function createInlineAssistantTargetPreview(text: string): string {
  const preview = text.trim().replace(/\s+/g, ' ')

  if (!preview)
    return t('content.inlineAssistantTargetEmpty')

  return preview.length > 120 ? `${preview.slice(0, 120)}...` : preview
}

function resolveTextareaSelectionAnchor(textarea: HTMLTextAreaElement): { top: number, left: number } {
  const valueBeforeSelection = textarea.value.slice(0, textarea.selectionStart)
  const lines = valueBeforeSelection.split('\n')
  const currentLine = lines.length - 1
  const currentColumn = lines.at(-1)?.length ?? 0
  const lineHeight = 28
  const estimatedCharacterWidth = 8
  const top = clampNumber(44 + currentLine * lineHeight - textarea.scrollTop, 44, Math.max(textarea.clientHeight - 72, 44))
  const left = clampNumber(20 + currentColumn * estimatedCharacterWidth - textarea.scrollLeft, 20, Math.max(textarea.clientWidth - 180, 20))

  return { top, left }
}

function createInlineAssistantFloatingStyle(anchor: { top: number, left: number }, width: number): Record<string, string> {
  return {
    left: `min(${anchor.left}px, calc(100% - ${width + 16}px))`,
    top: `${anchor.top}px`,
  }
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
</script>

<template>
  <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
    <div class="border-border/70 flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          markdown
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ t('content.title') }}
        </h1>
      </div>
      <Button size="sm" @click="createEntry">
        <PlusIcon class="size-4" />
        {{ t('content.add') }}
      </Button>
    </div>

    <div class="grid min-h-[32rem] gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="border-border/70 border-b p-4 lg:border-r lg:border-b-0">
        <div class="mb-3 grid gap-2">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold">
              {{ t('content.chapterList') }}
            </h2>
            <span class="text-muted-foreground text-xs">{{ entryCounts.filtered }} / {{ entryCounts.total }}</span>
          </div>
          <Input
            v-model="searchQuery"
            :placeholder="t('content.searchPlaceholder')"
            type="search"
          />
        </div>
        <div v-if="entries.length" class="grid gap-2">
          <button
            v-for="entry in entries"
            :key="entry.id"
            type="button"
            class="hover:bg-muted focus-visible:ring-ring/50 grid rounded-md border px-3 py-2 text-left transition focus-visible:ring-3"
            :class="entry.id === selectedEntry?.id ? 'border-primary bg-muted' : 'border-transparent'"
            @click="selectedEntryId = entry.id"
          >
            <span class="truncate text-sm font-medium">{{ entry.chapter || t('content.chapter') }}</span>
            <span class="text-muted-foreground mt-1 truncate text-xs">{{ entry.volume || t('content.volume') }}</span>
            <span class="text-muted-foreground mt-1 truncate text-xs">{{ new Date(entry.updatedAt).toLocaleDateString() }}</span>
          </button>
        </div>
        <div v-else class="text-muted-foreground grid h-48 place-items-center rounded-md border border-dashed text-sm">
          {{ searchQuery.trim() ? t('content.searchEmpty') : t('content.empty') }}
        </div>
      </aside>

      <div class="grid gap-5 p-5">
        <div v-if="selectedEntry" class="grid gap-5">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-muted-foreground text-xs">
                {{ t('content.current') }}
              </p>
              <h2 class="truncate text-xl font-semibold">
                {{ selectedTitle }}
              </h2>
              <p class="text-muted-foreground mt-1 text-xs">
                {{ selectedWordCount }} {{ t('content.wordCount') }} · {{ t('content.updatedAt') }} {{ selectedUpdatedAt }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <ContentAiRevisionHistory
                :chapter-title="selectedTitle"
                :revisions="selectedEntry.aiRevisionHistory"
                @restore="restoreSelectedEntryAiRevision"
                @delete="deleteSelectedEntryAiRevision"
              />
              <Button variant="ghost" size="icon-sm" :aria-label="t('content.moveUp')" :disabled="!canMoveSelectedEntryUp" @click="moveSelectedEntry('up')">
                <ArrowUpIcon class="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" :aria-label="t('content.moveDown')" :disabled="!canMoveSelectedEntryDown" @click="moveSelectedEntry('down')">
                <ArrowDownIcon class="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" :aria-label="t('content.delete')" @click="deleteSelectedEntry">
                <Trash2Icon class="size-4" />
              </Button>
            </div>
          </div>

          <form class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('content.volume') }}</span>
              <Input
                :model-value="selectedEntry.volume"
                @update:model-value="updateSelectedEntry({ volume: String($event) })"
              />
            </label>

            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('content.chapter') }}</span>
              <Input
                :model-value="selectedEntry.chapter"
                @update:model-value="updateSelectedEntry({ chapter: String($event) })"
              />
            </label>

            <label class="grid gap-1.5 md:col-span-2">
              <span class="text-muted-foreground text-sm">{{ t('content.linkedBeat') }}</span>
              <select
                class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                :value="selectedEntry.outlineBeatId ?? ''"
                @change="updateSelectedEntryBeat"
              >
                <option value="">
                  {{ t('content.noLinkedBeat') }}
                </option>
                <option v-for="beat in beats" :key="beat.id" :value="beat.id">
                  {{ beat.timeLabel ? `${beat.timeLabel} · ${beat.title}` : beat.title }}
                </option>
              </select>
              <span class="text-muted-foreground text-xs">
                {{ selectedLinkedBeat?.summary || t('content.linkedBeatSummaryEmpty') }}
              </span>
            </label>

            <label class="grid gap-1.5 md:col-span-2">
              <span class="text-muted-foreground flex items-center justify-between gap-2 text-sm">
                <span>{{ t('content.fineOutline') }}</span>
                <Button
                  v-if="selectedLinkedBeat"
                  type="button"
                  size="sm"
                  variant="outline"
                  @click="draftFineOutlineFromLinkedBeat"
                >
                  <SparklesIcon class="size-4" />
                  {{ t('content.draftFineOutlineFromBeat') }}
                </Button>
              </span>
              <Textarea
                class="min-h-36 text-sm leading-6"
                :model-value="selectedEntry.fineOutline"
                :placeholder="t('content.fineOutlinePlaceholder')"
                @update:model-value="updateSelectedEntry({ fineOutline: String($event) })"
              />
              <span class="text-muted-foreground text-xs">
                {{ t('content.fineOutlineHint') }}
              </span>
            </label>

            <div class="grid gap-1.5 md:col-span-2">
              <span class="text-muted-foreground text-sm">{{ t('content.body') }}</span>
              <div class="relative">
                <Textarea
                  class="min-h-[28rem] font-serif text-base leading-7"
                  :model-value="selectedEntry.body"
                  :placeholder="t('content.bodyPlaceholder')"
                  @click="captureBodySelection"
                  @keyup="captureBodySelection"
                  @mouseup="captureBodySelection"
                  @select="captureBodySelection"
                  @update:model-value="updateSelectedEntry({ body: String($event) })"
                />

                <div
                  v-if="showInlineAssistantToolbar"
                  class="absolute z-20"
                  :style="inlineAssistantToolbarStyle"
                >
                  <Button
                    type="button"
                    size="sm"
                    class="shadow-lg"
                    @mousedown.prevent
                    @click="openInlineAssistantPanel"
                  >
                    <SparklesIcon class="size-4" />
                    {{ t('content.inlineAssistant') }}
                  </Button>
                </div>

                <div
                  v-if="inlineAssistantPanelOpen"
                  class="bg-background border-border absolute z-30 grid w-[min(22.5rem,calc(100%-1rem))] gap-3 rounded-lg border p-4 shadow-xl"
                  :style="inlineAssistantPanelStyle"
                  @mousedown.stop
                  @click.stop
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h3 class="text-sm font-semibold">
                        {{ t('content.inlineAssistant') }}
                      </h3>
                      <p class="text-muted-foreground mt-1 text-xs">
                        {{ inlineAssistantTargetLabel }}
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-xs" :aria-label="t('content.inlineAssistantDismiss')" @click="dismissInlineAssistantSuggestion">
                      <XIcon class="size-3" />
                    </Button>
                  </div>

                  <p class="bg-muted/50 line-clamp-3 rounded-md border px-3 py-2 text-xs leading-5">
                    {{ inlineAssistantTargetPreview }}
                  </p>

                  <label class="grid gap-1.5">
                    <span class="text-muted-foreground text-xs">{{ t('content.inlineAssistantInstruction') }}</span>
                    <Textarea
                      class="min-h-20 text-sm leading-6"
                      :model-value="inlineAssistantInstruction"
                      :placeholder="t('content.inlineAssistantInstructionPlaceholder')"
                      @update:model-value="inlineAssistantInstruction = String($event)"
                    />
                  </label>

                  <p v-if="inlineAssistant.error.value" class="text-destructive text-sm">
                    {{ inlineAssistant.error.value }}
                  </p>
                  <p v-else-if="inlineAssistantInstruction.trim() && inlineAssistantRunDisabledReason" class="text-muted-foreground text-sm">
                    {{ inlineAssistantRunDisabledReason }}
                    <a class="text-primary underline-offset-4 hover:underline" href="#assistant">
                      {{ t('content.inlineAssistantConfigure') }}
                    </a>
                  </p>

                  <div v-if="inlineAssistant.output.value || inlineAssistant.loading.value" class="grid gap-1.5">
                    <span class="text-muted-foreground text-xs">{{ t('content.inlineAssistantSuggestion') }}</span>
                    <pre class="bg-muted/50 max-h-48 overflow-auto rounded-md border p-3 text-sm whitespace-pre-wrap">{{ inlineAssistant.output.value || t('content.inlineAssistantThinking') }}</pre>
                  </div>

                  <div v-if="inlineAssistantSuggestionPreview && !inlineAssistantSuggestionPreview.unchanged" class="grid gap-2">
                    <span class="text-muted-foreground text-xs">{{ t('content.inlineAssistantComparison') }}</span>
                    <div class="grid gap-2 text-xs md:grid-cols-2">
                      <div class="grid gap-1">
                        <span class="text-muted-foreground">{{ t('content.inlineAssistantBefore') }}</span>
                        <pre class="bg-muted/40 max-h-28 overflow-auto rounded-md border p-2 whitespace-pre-wrap">{{ inlineAssistantSuggestionPreview.before }}</pre>
                      </div>
                      <div class="grid gap-1">
                        <span class="text-muted-foreground">{{ t('content.inlineAssistantAfter') }}</span>
                        <pre class="bg-muted/40 max-h-28 overflow-auto rounded-md border p-2 whitespace-pre-wrap">{{ inlineAssistantSuggestionPreview.after }}</pre>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <Button v-if="inlineAssistant.loading.value" type="button" size="sm" variant="outline" @click="inlineAssistant.stop">
                      <SquareIcon class="size-4" />
                      {{ t('content.inlineAssistantStop') }}
                    </Button>
                    <Button v-else type="button" size="sm" :disabled="Boolean(inlineAssistantRunDisabledReason)" @click="runInlineAssistant">
                      <SparklesIcon class="size-4" />
                      {{ t('content.inlineAssistantGenerate') }}
                    </Button>
                    <Button type="button" size="sm" variant="outline" :disabled="!canApplyInlineAssistantSuggestion" @click="applyInlineAssistantSuggestion">
                      <CheckIcon class="size-4" />
                      {{ t('content.inlineAssistantApply') }}
                    </Button>
                  </div>
                </div>
              </div>
              <div v-if="canUndoInlineAssistantSuggestion" class="bg-muted/40 border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                <p class="text-muted-foreground text-sm">
                  {{ t('content.inlineAssistantUndoHint') }}
                </p>
                <Button type="button" size="sm" variant="outline" @click="undoInlineAssistantSuggestion">
                  <RotateCcwIcon class="size-4" />
                  {{ t('content.inlineAssistantUndo') }}
                </Button>
              </div>
            </div>
          </form>

          <section v-if="pendingAssistantContent" class="grid gap-3 rounded-lg border p-4">
            <div>
              <h3 class="text-base font-semibold">
                {{ t('content.pendingAssistantDraft') }}
              </h3>
              <p class="text-muted-foreground mt-1 text-sm">
                {{ t('content.pendingAssistantDraftHint') }}
              </p>
            </div>
            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('content.assistantDraftTarget') }}</span>
              <select
                class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                :value="assistantDraftTargetEntryId"
                @change="updateAssistantDraftTarget"
              >
                <option v-for="entry in allEntries" :key="entry.id" :value="entry.id">
                  {{ `${entry.volume || t('content.volume')} / ${entry.chapter || t('content.chapter')}` }}
                </option>
              </select>
            </label>
            <pre class="bg-muted/50 max-h-48 overflow-auto rounded-md p-3 text-sm whitespace-pre-wrap">{{ pendingAssistantContent }}</pre>
            <div class="flex flex-wrap gap-2">
              <Button size="sm" :disabled="!assistantDraftTargetEntry" @click="insertAssistantContent('append')">
                {{ t('content.appendAssistantDraft') }}
              </Button>
              <Button size="sm" variant="outline" :disabled="!assistantDraftTargetEntry" @click="insertAssistantContent('replace')">
                {{ t('content.replaceWithAssistantDraft') }}
              </Button>
              <Button size="sm" variant="ghost" @click="dismissAssistantContent">
                {{ t('content.dismissAssistantDraft') }}
              </Button>
            </div>
            <p v-if="assistantDraftTargetEntry" class="text-muted-foreground text-xs">
              {{ t('content.assistantDraftTargetPreview') }} {{ countContentWords(previewAssistantDraft('append')) }} {{ t('content.wordCount') }}
            </p>
          </section>

          <section class="grid gap-3 rounded-lg border p-4">
            <div>
              <h3 class="text-base font-semibold">
                {{ t('content.aiActions') }}
              </h3>
              <p class="text-muted-foreground mt-1 text-sm">
                {{ selectedEntry.body.trim() ? t('content.aiActionsHint') : t('content.emptyBody') }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" :disabled="!hasSelectedFineOutline" @click="sendSelectedEntryToAssistant('draft-full-chapter')">
                <SparklesIcon class="size-4" />
                {{ t('content.aiDraftFullChapter') }}
              </Button>
              <Button size="sm" variant="outline" @click="sendSelectedEntryToAssistant('continue')">
                <SparklesIcon class="size-4" />
                {{ t('content.aiContinue') }}
              </Button>
              <Button size="sm" variant="outline" @click="sendSelectedEntryToAssistant('polish')">
                <PenLineIcon class="size-4" />
                {{ t('content.aiPolish') }}
              </Button>
              <Button size="sm" variant="outline" @click="sendSelectedEntryToAssistant('check-consistency')">
                <ShieldCheckIcon class="size-4" />
                {{ t('content.aiCheckConsistency') }}
              </Button>
            </div>
            <p v-if="!hasSelectedFineOutline" class="text-muted-foreground text-xs">
              {{ t('content.fineOutlineRequired') }}
            </p>
          </section>
        </div>

        <div v-else class="text-muted-foreground grid min-h-80 place-items-center rounded-md border border-dashed text-sm">
          <div class="grid justify-items-center gap-3">
            <p>{{ t('content.empty') }}</p>
            <Button size="sm" @click="createEntry">
              <PlusIcon class="size-4" />
              {{ t('content.add') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
