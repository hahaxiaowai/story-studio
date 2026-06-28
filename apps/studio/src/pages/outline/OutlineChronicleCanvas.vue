<script setup lang="ts">
import type {
  OutlineTimelineDensity,
  OutlineTimelineModel,
  OutlineTimelineRenderer,
} from '@story-studio/outline-timeline-canvas'
import { createOutlineTimelineRenderer } from '@story-studio/outline-timeline-canvas'
import { markRaw, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/composables/useLocale'

const props = defineProps<{
  density: OutlineTimelineDensity
  model: OutlineTimelineModel
  selectedBeatId?: string
}>()

const emit = defineEmits<{
  selectBeat: [beatId: string]
}>()

const { t } = useLocale()
const canvasContainer = ref<HTMLDivElement>()
const renderer = shallowRef<OutlineTimelineRenderer>()

onMounted(async () => {
  await nextTick()

  if (!canvasContainer.value)
    return

  renderer.value = markRaw(createOutlineTimelineRenderer(canvasContainer.value, {
    density: props.density,
    model: props.model,
    onSelectBeat: beatId => emit('selectBeat', beatId),
    selectedBeatId: props.selectedBeatId,
  }))
})

onUnmounted(() => {
  renderer.value?.dispose()
  renderer.value = undefined
})

watch(() => props.model, (nextModel) => {
  renderer.value?.setModel(nextModel)
}, { deep: true })

watch(() => props.selectedBeatId, (nextBeatId) => {
  renderer.value?.setSelectedBeatId(nextBeatId)
})

watch(() => props.density, (nextDensity) => {
  renderer.value?.setDensity(nextDensity)
})

function resetView(): void {
  renderer.value?.resetView()
}
</script>

<template>
  <div class="grid h-full min-h-[34rem] grid-rows-[auto_minmax(0,1fr)]">
    <div class="border-border/70 bg-background flex items-center justify-between gap-3 border-b px-4 py-3">
      <div>
        <p class="text-sm font-medium">
          {{ t('outline.canvasView') }}
        </p>
        <p class="text-muted-foreground mt-1 text-xs">
          {{ t('outline.canvasViewHint') }}
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" @click="resetView">
        {{ t('outline.resetCanvasView') }}
      </Button>
    </div>
    <div class="bg-muted/30 p-4">
      <div
        ref="canvasContainer"
        class="border-border bg-background h-full min-h-[30rem] w-full touch-none overflow-hidden rounded-lg border"
        role="img"
        :aria-label="t('outline.canvasView')"
      />
    </div>
  </div>
</template>
