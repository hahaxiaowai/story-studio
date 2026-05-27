<script setup lang="ts">
import type {
  FantasyMapBrush,
  FantasyMapMode,
  FantasyMapRenderer,
  FantasyMapStroke,
} from '@story-studio/fantasy-map'
import {
  createFantasyMapRenderer,
} from '@story-studio/fantasy-map'
import { computed, markRaw, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useWorld } from './useWorld'
import { createWorldMapStrokeHandler } from './worldMapRenderer'

const { t } = useLocale()
const { activeMap, addMapStroke, clearMap } = useWorld()
const selectedColor = ref('#1d4ed8')
const selectedWidth = ref(4)
const mode = ref<FantasyMapMode>('draw')
const mapContainer = ref<HTMLDivElement>()
const renderer = shallowRef<FantasyMapRenderer>()

const palette = ['#1d4ed8', '#16a34a', '#a16207', '#dc2626', '#111827']
const brush = computed<FantasyMapBrush>(() => ({
  color: selectedColor.value,
  width: selectedWidth.value,
}))
const strokes = computed<FantasyMapStroke[]>(() => activeMap.value.strokes.map(stroke => ({
  color: stroke.color,
  id: stroke.id,
  points: stroke.points,
  width: stroke.width,
})))
const handleStrokeComplete = createWorldMapStrokeHandler(addMapStroke)

onMounted(async () => {
  await nextTick()

  if (!mapContainer.value)
    return

  renderer.value = markRaw(createFantasyMapRenderer(mapContainer.value, {
    brush: brush.value,
    mode: mode.value,
    onStrokeComplete: handleStrokeComplete,
  }))
  renderer.value.setStrokes(strokes.value)
})

onUnmounted(() => {
  renderer.value?.dispose()
  renderer.value = undefined
})

watch(strokes, (nextStrokes) => {
  renderer.value?.setStrokes(nextStrokes)
}, { deep: true })

watch(mode, (nextMode) => {
  renderer.value?.setMode(nextMode)
})

watch(brush, (nextBrush) => {
  renderer.value?.setBrush(nextBrush)
})

function resetView(): void {
  renderer.value?.resetView()
}
</script>

<template>
  <section class="border-border/70 bg-background overflow-hidden rounded-lg border shadow-sm" :aria-label="t('world.map')">
    <div class="border-border/70 flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-lg font-semibold">
          {{ activeMap.title }}
        </h2>
        <p class="text-muted-foreground mt-1 text-sm">
          {{ t('world.mapHint') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="border-border bg-muted/40 inline-grid grid-cols-2 rounded-lg border p-1">
          <button
            type="button"
            class="rounded-md px-3 py-2 text-sm font-medium transition"
            :class="mode === 'draw' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            @click="mode = 'draw'"
          >
            {{ t('world.drawMode') }}
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-sm font-medium transition"
            :class="mode === 'pan' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
            @click="mode = 'pan'"
          >
            {{ t('world.panMode') }}
          </button>
        </div>
        <div class="flex items-center gap-2" :aria-label="t('world.color')">
          <button
            v-for="color in palette"
            :key="color"
            type="button"
            class="border-border size-8 rounded-full border"
            :class="selectedColor === color ? 'ring-ring ring-2 ring-offset-2' : ''"
            :style="{ backgroundColor: color }"
            :title="color"
            @click="selectedColor = color"
          />
        </div>
        <label class="text-muted-foreground flex items-center gap-2 text-sm">
          {{ t('world.strokeWidth') }}
          <input v-model.number="selectedWidth" class="w-24" type="range" min="2" max="10" step="1">
        </label>
        <button type="button" class="border-border hover:bg-muted h-9 rounded-md border px-3 text-sm font-medium" @click="resetView">
          {{ t('world.resetView') }}
        </button>
        <button type="button" class="border-border hover:bg-muted h-9 rounded-md border px-3 text-sm font-medium" @click="clearMap">
          {{ t('world.clearMap') }}
        </button>
      </div>
    </div>

    <div class="bg-muted/30 p-4">
      <div
        ref="mapContainer"
        class="border-border bg-background h-[min(62svh,44rem)] w-full touch-none overflow-hidden rounded-lg border"
        role="img"
        :aria-label="t('world.mapCanvas')"
      />
    </div>
  </section>
</template>
