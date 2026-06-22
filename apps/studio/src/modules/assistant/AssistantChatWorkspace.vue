<script setup lang="ts">
import { MessageSquareIcon } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'
import AssistantChatPanel from './AssistantChatPanel.vue'

const { t } = useLocale()
</script>

<template>
  <section class="border-border/70 bg-background flex h-full min-h-0 flex-col overflow-hidden rounded-lg border shadow-sm">
    <div class="border-border/70 flex shrink-0 flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          assistant chat
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ t('assistant.chatTitle') }}
        </h1>
      </div>
      <MessageSquareIcon class="text-muted-foreground size-5" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden p-5">
      <AssistantChatPanel />
    </div>
  </section>
</template>
