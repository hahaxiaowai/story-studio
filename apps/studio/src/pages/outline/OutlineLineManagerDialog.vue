<script setup lang="ts">
import type { PlotLine, PlotLineKind } from '@story-studio/types'
import { GripVerticalIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useDraggable } from 'vue-draggable-plus'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/composables/useLocale'
import { useOutline } from '@/modules/outlines/useOutline'

const open = defineModel<boolean>('open', { default: false })

const { t } = useLocale()
const {
  workspaceOutline,
  plotLines,
  savePlotLines,
} = useOutline()

const lineListRef = ref<HTMLElement | null>(null)
const draftLines = ref<PlotLine[]>([])
const hasSubmitted = ref(false)
const pendingDeleteLineId = ref<string>()

const lineKinds = computed<Array<{ value: PlotLineKind, label: string }>>(() => [
  { value: 'main', label: t('outline.mainLine') },
  { value: 'branch', label: t('outline.branchLine') },
])
const referenceCountByLineId = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}

  for (const beat of workspaceOutline.value.beats) {
    for (const plotLineId of beat.plotLineIds)
      counts[plotLineId] = (counts[plotLineId] ?? 0) + 1
  }

  return counts
})
const hasBlankLineName = computed<boolean>(() => draftLines.value.some(line => !line.title.trim()))
const pendingDeleteLineTitle = computed<string>(() => {
  return draftLines.value.find(line => line.id === pendingDeleteLineId.value)?.title ?? ''
})

const lineDraggable = useDraggable<PlotLine>(lineListRef, draftLines, {
  animation: 150,
  chosenClass: 'outline-line-drag-chosen',
  draggable: '.outline-line-item',
  ghostClass: 'opacity-50',
  handle: '.outline-line-drag-handle',
  immediate: false,
})

watch(open, async (nextOpen) => {
  if (nextOpen) {
    resetDraft()
    await nextTick()
    lineDraggable.start()
    return
  }

  lineDraggable.destroy()
})

watch(plotLines, () => {
  if (open.value)
    resetDraft()
})

function resetDraft(): void {
  draftLines.value = plotLines.value.map(line => ({ ...line }))
  hasSubmitted.value = false
  pendingDeleteLineId.value = undefined
}

function addDraftLine(): void {
  draftLines.value = [
    ...draftLines.value,
    {
      id: createDraftLineId(),
      title: `${t('outline.branch')} ${draftLines.value.length}`,
      kind: 'branch',
      color: '#db2777',
      order: draftLines.value.length,
    },
  ]
}

function updateDraftLine(plotLineId: string, patch: Partial<Pick<PlotLine, 'title' | 'kind' | 'color'>>): void {
  draftLines.value = draftLines.value.map(line => line.id === plotLineId
    ? { ...line, ...patch }
    : line)
}

function requestDeleteDraftLine(plotLineId: string): void {
  if (!canDeleteLine(plotLineId))
    return

  pendingDeleteLineId.value = plotLineId
}

function confirmDeleteDraftLine(): void {
  const plotLineId = pendingDeleteLineId.value

  if (!plotLineId)
    return

  if (canDeleteLine(plotLineId))
    draftLines.value = draftLines.value.filter(line => line.id !== plotLineId)

  pendingDeleteLineId.value = undefined
}

function cancelDeleteDraftLine(): void {
  pendingDeleteLineId.value = undefined
}

function canDeleteLine(plotLineId: string): boolean {
  return draftLines.value.length > 1 && !referenceCountByLineId.value[plotLineId]
}

function getDeleteDisabledReason(plotLineId: string): string {
  if (draftLines.value.length <= 1)
    return t('outline.lineDeleteLastBlocked')

  const referenceCount = referenceCountByLineId.value[plotLineId] ?? 0

  if (referenceCount)
    return `${t('outline.lineDeleteBlocked')} ${referenceCount}`

  return ''
}

function saveDraft(): void {
  hasSubmitted.value = true

  if (hasBlankLineName.value)
    return

  savePlotLines(draftLines.value)
  open.value = false
}

function cancelDraft(): void {
  resetDraft()
  open.value = false
}

function createDraftLineId(): string {
  const existingIds = new Set(draftLines.value.map(line => line.id))
  let id = `plot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  while (existingIds.has(id))
    id = `plot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

  return id
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[90svh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t('outline.manageLines') }}</DialogTitle>
        <DialogDescription>
          {{ t('outline.manageLinesHint') }}
        </DialogDescription>
      </DialogHeader>

      <div ref="lineListRef" class="grid gap-3">
        <div
          v-for="line in draftLines"
          :key="line.id"
          class="outline-line-item border-border grid gap-3 rounded-md border p-3 transition md:grid-cols-[minmax(10rem,1fr)_7rem_9rem_auto]"
        >
          <div class="grid gap-1.5">
            <label class="text-muted-foreground text-xs">{{ t('outline.lineName') }}</label>
            <Input
              :model-value="line.title"
              :aria-invalid="hasSubmitted && !line.title.trim()"
              @update:model-value="updateDraftLine(line.id, { title: String($event) })"
            />
            <p v-if="hasSubmitted && !line.title.trim()" class="text-destructive text-xs">
              {{ t('outline.lineNameRequired') }}
            </p>
          </div>

          <div class="grid gap-1.5">
            <label class="text-muted-foreground text-xs">{{ t('outline.lineColor') }}</label>
            <Input
              type="color"
              class="px-1 py-1"
              :model-value="line.color"
              @update:model-value="updateDraftLine(line.id, { color: String($event) })"
            />
          </div>

          <div class="grid gap-1.5">
            <label class="text-muted-foreground text-xs">{{ t('outline.lineKind') }}</label>
            <select
              class="border-input bg-background h-9 rounded-md border px-2 text-sm"
              :value="line.kind"
              @change="updateDraftLine(line.id, { kind: ($event.target as HTMLSelectElement).value as PlotLineKind })"
            >
              <option v-for="kind in lineKinds" :key="kind.value" :value="kind.value">
                {{ kind.label }}
              </option>
            </select>
          </div>

          <div class="flex items-end justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              :disabled="!canDeleteLine(line.id)"
              :aria-label="t('outline.deleteLine')"
              @click="requestDeleteDraftLine(line.id)"
            >
              <Trash2Icon class="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="outline-line-drag-handle cursor-grab active:cursor-grabbing"
              :aria-label="t('outline.reorderLine')"
            >
              <GripVerticalIcon class="size-4" />
            </Button>
          </div>

          <p v-if="getDeleteDisabledReason(line.id)" class="text-muted-foreground text-xs md:col-span-4">
            {{ getDeleteDisabledReason(line.id) }}
          </p>
        </div>
      </div>

      <Button type="button" variant="outline" class="justify-self-start" @click="addDraftLine">
        <PlusIcon class="size-4" />
        {{ t('outline.addLine') }}
      </Button>

      <DialogFooter>
        <Button type="button" variant="outline" @click="cancelDraft">
          {{ t('workspace.form.cancel') }}
        </Button>
        <Button type="button" @click="saveDraft">
          {{ t('outline.saveLines') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog :open="!!pendingDeleteLineId" @update:open="cancelDeleteDraftLine">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('outline.confirmDeleteLineTitle') }}</DialogTitle>
        <DialogDescription>
          {{ t('outline.confirmDeleteLineDescription') }}
          <span v-if="pendingDeleteLineTitle" class="font-medium">{{ pendingDeleteLineTitle }}</span>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" @click="cancelDeleteDraftLine">
          {{ t('workspace.form.cancel') }}
        </Button>
        <Button type="button" variant="destructive" @click="confirmDeleteDraftLine">
          {{ t('outline.deleteLine') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.outline-line-drag-chosen {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
</style>
