<script setup lang="ts">
import type { WorkspaceContentEntry } from '@story-studio/types'
import { PlusIcon, Trash2Icon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { useContent } from './useContent'

const { t } = useLocale()
const { entries, addEntry, updateEntry, removeEntry } = useContent()
const selectedEntryId = ref<string>()

const selectedEntry = computed<WorkspaceContentEntry | undefined>(() => entries.value.find(entry => entry.id === selectedEntryId.value) ?? entries.value[0])
const selectedTitle = computed<string>(() => {
  if (!selectedEntry.value)
    return t('content.title')

  return `${selectedEntry.value.volume || t('content.volume')} / ${selectedEntry.value.chapter || t('content.chapter')}`
})

watch(entries, (nextEntries) => {
  if (!nextEntries.length) {
    selectedEntryId.value = undefined
    return
  }

  if (!selectedEntryId.value || !nextEntries.some(entry => entry.id === selectedEntryId.value))
    selectedEntryId.value = nextEntries[0]?.id
}, { immediate: true })

function createEntry(): void {
  const entry = addEntry()
  selectedEntryId.value = entry.id
}

function updateSelectedEntry(input: { volume?: string, chapter?: string, body?: string }): void {
  if (!selectedEntry.value)
    return

  updateEntry(selectedEntry.value.id, input)
}

function deleteSelectedEntry(): void {
  if (!selectedEntry.value)
    return

  removeEntry(selectedEntry.value.id)
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
          {{ t('content.empty') }}
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
            </div>
            <Button variant="ghost" size="icon-sm" :aria-label="t('content.delete')" @click="deleteSelectedEntry">
              <Trash2Icon class="size-4" />
            </Button>
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
              <span class="text-muted-foreground text-sm">{{ t('content.body') }}</span>
              <Textarea
                class="min-h-[28rem] font-serif text-base leading-7"
                :model-value="selectedEntry.body"
                :placeholder="t('content.bodyPlaceholder')"
                @update:model-value="updateSelectedEntry({ body: String($event) })"
              />
            </label>
          </form>
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
