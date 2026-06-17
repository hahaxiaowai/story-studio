<script setup lang="ts">
import type { WorkspaceContentEntry } from '@story-studio/types'
import type { AssistantDraftInsertMode, ContentAssistantAction } from './contentAssistant'
import { ArrowDownIcon, ArrowUpIcon, PenLineIcon, PlusIcon, ShieldCheckIcon, SparklesIcon, Trash2Icon } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { useWorkspaces } from '@/modules/workspaces/useWorkspaces'
import { consumeAssistantContentDraftPayload } from '../assistant/assistantContentDraft'
import { queueAssistantDraftPrompt } from '../assistant/assistantDraft'
import { useOutline } from '../outlines/useOutline'
import { buildContentAssistantPrompt, countContentWords, insertAssistantDraftIntoContentEntries } from './contentAssistant'
import { useContent } from './useContent'

const { t } = useLocale()
const { searchQuery, entries, entryCounts, addEntry, updateEntry, linkEntryToBeat, moveEntry, removeEntry } = useContent()
const { activeWorkspace } = useWorkspaces()
const { beats } = useOutline()
const selectedEntryId = ref<string>()
const pendingAssistantContent = ref('')
const assistantDraftTargetEntryId = ref('')

const selectedEntry = computed<WorkspaceContentEntry | undefined>(() => entries.value.find(entry => entry.id === selectedEntryId.value) ?? entries.value[0])
const selectedEntryIndex = computed<number>(() => selectedEntry.value ? entries.value.findIndex(entry => entry.id === selectedEntry.value?.id) : -1)
const canMoveSelectedEntryUp = computed<boolean>(() => selectedEntryIndex.value > 0)
const canMoveSelectedEntryDown = computed<boolean>(() => selectedEntryIndex.value >= 0 && selectedEntryIndex.value < entries.value.length - 1)
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
const assistantDraftTargetEntry = computed(() => {
  return entries.value.find(entry => entry.id === assistantDraftTargetEntryId.value)
})

watch(entries, (nextEntries) => {
  if (!nextEntries.length) {
    selectedEntryId.value = undefined
    return
  }

  if (!selectedEntryId.value || !nextEntries.some(entry => entry.id === selectedEntryId.value))
    selectedEntryId.value = nextEntries[0]?.id
}, { immediate: true })

onMounted(() => {
  const contentDraft = consumeAssistantContentDraftPayload()

  pendingAssistantContent.value = contentDraft.content

  if (pendingAssistantContent.value)
    assistantDraftTargetEntryId.value = getDefaultAssistantDraftTargetEntryId(contentDraft.suggestedEntryId)
})

function createEntry(): void {
  const entry = addEntry()
  selectedEntryId.value = entry.id
}

function updateSelectedEntry(input: { volume?: string, chapter?: string, body?: string }): void {
  if (!selectedEntry.value)
    return

  updateEntry(selectedEntry.value.id, input)
}

function updateSelectedEntryBeat(event: Event): void {
  if (!selectedEntry.value)
    return

  linkEntryToBeat(selectedEntry.value.id, readEventValue(event))
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
    window.location.hash = '#assistant'
}

function readEventValue(event: Event): string {
  return event.target instanceof HTMLSelectElement ? event.target.value : ''
}

function getDefaultAssistantDraftTargetEntryId(suggestedEntryId: string | undefined): string {
  if (suggestedEntryId && entries.value.some(entry => entry.id === suggestedEntryId))
    return suggestedEntryId

  return selectedEntry.value?.id ?? entries.value[0]?.id ?? ''
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
              <span class="text-muted-foreground text-sm">{{ t('content.body') }}</span>
              <Textarea
                class="min-h-[28rem] font-serif text-base leading-7"
                :model-value="selectedEntry.body"
                :placeholder="t('content.bodyPlaceholder')"
                @update:model-value="updateSelectedEntry({ body: String($event) })"
              />
            </label>
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
                <option v-for="entry in entries" :key="entry.id" :value="entry.id">
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
