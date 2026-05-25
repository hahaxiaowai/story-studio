<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="field-group"
    :class="cn('flex flex-col gap-4', props.class)"
  >
    <slot />
  </div>
</template>
