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
const textScale = ref(1)

onMounted(async () => {
  await nextTick()

  if (!canvasContainer.value)
    return

  renderer.value = markRaw(createOutlineTimelineRenderer(canvasContainer.value, {
    density: props.density,
    model: props.model,
    onSelectBeat: beatId => emit('selectBeat', beatId),
    selectedBeatId: props.selectedBeatId,
    textScale: textScale.value,
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

watch(textScale, (nextScale) => {
  renderer.value?.setTextScale(nextScale)
})

function resetView(): void {
  renderer.value?.resetView()
}

function updateTextScale(event: Event): void {
  if (!(event.target instanceof HTMLInputElement))
    return

  textScale.value = Number(event.target.value)
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
      <div class="flex shrink-0 items-center gap-3">
        <label class="text-muted-foreground flex items-center gap-2 text-xs">
          <span>{{ t('outline.canvasTextScale') }}</span>
          <input
            class="accent-primary w-24"
            type="range"
            min="0.8"
            max="1.4"
            step="0.05"
            :value="textScale"
            :aria-label="t('outline.canvasTextScale')"
            @input="updateTextScale"
          >
        </label>
        <Button type="button" size="sm" variant="outline" @click="resetView">
          {{ t('outline.resetCanvasView') }}
        </Button>
      </div>
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
