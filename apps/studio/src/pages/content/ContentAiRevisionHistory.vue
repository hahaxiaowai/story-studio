<script setup lang="ts">
import type { ContentAiRevision } from '@story-studio/types'
import { HistoryIcon, RotateCcwIcon, Trash2Icon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useLocale } from '@/composables/useLocale'

const props = defineProps<{
  chapterTitle: string
  revisions: ContentAiRevision[]
}>()
const emit = defineEmits<{
  restore: [revisionId: string]
  delete: [revisionId: string]
}>()

const { locale, t } = useLocale()
const open = ref(false)
const pendingDeleteRevisionId = ref('')
const sortedRevisions = computed(() => props.revisions.toReversed())

watch(open, (nextOpen) => {
  if (!nextOpen)
    pendingDeleteRevisionId.value = ''
})

function formatCreatedAt(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale.value)
}

function confirmDelete(revision: ContentAiRevision): void {
  emit('delete', revision.id)
  pendingDeleteRevisionId.value = ''
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button type="button" size="sm" variant="outline">
        <HistoryIcon class="size-4" />
        {{ t('content.aiRevisionHistory') }}
        <span class="bg-muted rounded px-1.5 py-0.5 text-xs">{{ revisions.length }}</span>
      </Button>
    </DialogTrigger>

    <DialogContent class="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ t('content.aiRevisionHistory') }}</DialogTitle>
        <DialogDescription>
          {{ chapterTitle }} · {{ t('content.aiRevisionHistoryHint') }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="sortedRevisions.length" class="grid gap-3">
        <article
          v-for="revision in sortedRevisions"
          :key="revision.id"
          class="border-border/70 grid gap-3 rounded-lg border p-4"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="font-medium">
                {{ revision.instruction || t('content.aiRevisionInstructionEmpty') }}
              </p>
              <p class="text-muted-foreground mt-1 text-xs">
                {{ revision.targetKind === 'selection' ? t('content.aiRevisionTargetSelection') : t('content.aiRevisionTargetChapter') }}
                · {{ formatCreatedAt(revision.createdAt) }}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" @click="emit('restore', revision.id)">
              <RotateCcwIcon class="size-4" />
              {{ t('content.aiRevisionRestore') }}
            </Button>
          </div>

          <div class="grid gap-3 text-xs md:grid-cols-2">
            <div class="grid gap-1">
              <span class="text-muted-foreground">{{ t('content.aiRevisionBefore') }}</span>
              <pre class="bg-muted/40 max-h-64 overflow-auto rounded-md border p-3 whitespace-pre-wrap">{{ revision.previousBody }}</pre>
            </div>
            <div class="grid gap-1">
              <span class="text-muted-foreground">{{ t('content.aiRevisionAfter') }}</span>
              <pre class="bg-muted/40 max-h-64 overflow-auto rounded-md border p-3 whitespace-pre-wrap">{{ revision.nextBody }}</pre>
            </div>
          </div>

          <div class="flex flex-wrap justify-end gap-2">
            <template v-if="pendingDeleteRevisionId === revision.id">
              <span class="text-destructive mr-auto self-center text-xs">{{ t('content.aiRevisionDeleteWarning') }}</span>
              <Button type="button" size="sm" variant="ghost" @click="pendingDeleteRevisionId = ''">
                {{ t('content.aiRevisionDeleteCancel') }}
              </Button>
              <Button type="button" size="sm" variant="destructive" @click="confirmDelete(revision)">
                {{ t('content.aiRevisionDeleteConfirm') }}
              </Button>
            </template>
            <Button v-else type="button" size="sm" variant="ghost" @click="pendingDeleteRevisionId = revision.id">
              <Trash2Icon class="size-4" />
              {{ t('content.aiRevisionDelete') }}
            </Button>
          </div>
        </article>
      </div>

      <div v-else class="text-muted-foreground grid min-h-48 place-items-center rounded-lg border border-dashed text-sm">
        {{ t('content.aiRevisionHistoryEmpty') }}
      </div>
    </DialogContent>
  </Dialog>
</template>
