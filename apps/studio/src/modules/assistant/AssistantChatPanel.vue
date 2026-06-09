<script setup lang="ts">
import { CopyIcon, MessageSquarePlusIcon, RotateCcwIcon, SendIcon, SquareIcon, Trash2Icon } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { useAssistant } from './useAssistant'
import { useAssistantChat } from './useAssistantChat'

const { t } = useLocale()
const { settings, providers } = useAssistant()
const chat = useAssistantChat({ settings, providers })
const messageList = ref<HTMLElement>()
const canRetry = computed(() => Boolean(chat.activeThread.value?.messages.some(message => message.role === 'user')))

watch(() => chat.activeThread.value?.messages.map(message => `${message.id}:${message.content}:${message.status}`).join('|'), () => {
  void nextTick(() => {
    if (!messageList.value)
      return

    messageList.value.scrollTop = messageList.value.scrollHeight
  })
})

function handleComposerKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.shiftKey)
    return

  event.preventDefault()
  void chat.send()
}
</script>

<template>
  <section class="grid min-h-[42rem] overflow-hidden rounded-lg border lg:grid-cols-[17rem_minmax(0,1fr)]">
    <aside class="border-border/70 bg-muted/20 grid max-h-[42rem] grid-rows-[auto_minmax(0,1fr)] border-b lg:border-r lg:border-b-0">
      <div class="border-border/70 flex items-center justify-between gap-2 border-b p-3">
        <div>
          <h2 class="text-sm font-semibold">
            {{ t('assistant.chatThreads') }}
          </h2>
          <p class="text-muted-foreground mt-0.5 text-xs">
            {{ chat.threads.value.length }} {{ t('assistant.chatThreadCount') }}
          </p>
        </div>
        <Button size="icon-sm" variant="outline" :aria-label="t('assistant.newChat')" @click="chat.createThread()">
          <MessageSquarePlusIcon class="size-4" />
        </Button>
      </div>

      <div class="min-h-40 overflow-auto p-2">
        <button
          v-for="thread in chat.threads.value"
          :key="thread.id"
          type="button"
          class="hover:bg-muted focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-left transition focus-visible:ring-3"
          :class="thread.id === chat.activeThread.value?.id ? 'border-primary bg-background shadow-xs' : 'border-transparent'"
          @click="chat.selectedThreadId.value = thread.id"
        >
          <span class="block truncate text-sm font-medium">{{ thread.title }}</span>
          <span class="text-muted-foreground mt-1 block truncate text-xs">
            {{ thread.model || t('assistant.modelUnset') }}
          </span>
        </button>

        <div v-if="!chat.threads.value.length" class="text-muted-foreground grid h-36 place-items-center rounded-md border border-dashed p-4 text-center text-sm">
          {{ t('assistant.chatEmptyThreads') }}
        </div>
      </div>
    </aside>

    <div class="grid min-h-[42rem] grid-rows-[auto_minmax(0,1fr)_auto]">
      <header class="border-border/70 flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-semibold">
            {{ chat.activeThread.value?.title || t('assistant.newChat') }}
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ t('assistant.chatHint') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="chat.selectedProviderId.value"
            class="border-input bg-background ring-offset-background focus-visible:ring-ring h-8 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <option value="">
              {{ t('assistant.useGlobalDefault') }}
            </option>
            <option v-for="provider in providers" :key="provider.id" :value="provider.id">
              {{ provider.name }}
            </option>
          </select>

          <Button size="sm" variant="outline" :disabled="!chat.activeThread.value" @click="chat.clearThread">
            <Trash2Icon class="size-4" />
            {{ t('assistant.clearChat') }}
          </Button>
        </div>
      </header>

      <div ref="messageList" class="bg-background min-h-0 overflow-auto p-4">
        <div v-if="chat.activeThread.value?.messages.length" class="grid gap-4">
          <article
            v-for="message in chat.activeThread.value.messages"
            :key="message.id"
            class="group grid gap-2"
            :class="message.role === 'user' ? 'justify-items-end' : 'justify-items-start'"
          >
            <div
              class="max-w-[min(44rem,100%)] rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap"
              :class="message.role === 'user' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50'"
            >
              {{ message.content || (message.status === 'streaming' ? t('assistant.chatThinking') : '') }}
            </div>

            <div class="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
              <span v-if="message.status === 'streaming'" class="text-muted-foreground text-xs">
                {{ t('assistant.chatStreaming') }}
              </span>
              <span v-if="message.status === 'error'" class="text-destructive text-xs">
                {{ message.error || t('assistant.chatFailed') }}
              </span>
              <Button v-if="message.content" size="icon-xs" variant="ghost" :aria-label="t('assistant.copyMessage')" @click="chat.copyMessage(message.content)">
                <CopyIcon class="size-3" />
              </Button>
            </div>
          </article>
        </div>

        <div v-else class="text-muted-foreground grid h-full min-h-64 place-items-center rounded-md border border-dashed p-6 text-center text-sm">
          {{ t('assistant.chatEmptyMessages') }}
        </div>
      </div>

      <footer class="border-border/70 bg-background border-t p-4">
        <p v-if="chat.error.value || chat.disabledReason.value" class="mb-2 text-sm" :class="chat.error.value ? 'text-destructive' : 'text-muted-foreground'">
          {{ chat.error.value || chat.disabledReason.value }}
        </p>

        <div class="grid gap-2">
          <Textarea
            :model-value="chat.inputMessage.value"
            class="max-h-44 min-h-20 resize-none"
            :placeholder="t('assistant.chatPlaceholder')"
            @keydown="handleComposerKeydown"
            @update:model-value="chat.inputMessage.value = String($event)"
          />

          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-muted-foreground text-xs">
              {{ chat.provider.value?.name || t('assistant.providerUnset') }}
            </span>

            <div class="flex gap-2">
              <Button size="sm" variant="outline" :disabled="!canRetry || chat.loading.value" @click="chat.retryLast">
                <RotateCcwIcon class="size-4" />
                {{ t('assistant.retryChat') }}
              </Button>
              <Button v-if="chat.loading.value" size="sm" variant="outline" @click="chat.stop">
                <SquareIcon class="size-4" />
                {{ t('assistant.stopChat') }}
              </Button>
              <Button v-else size="sm" :disabled="Boolean(chat.disabledReason.value)" @click="chat.send">
                <SendIcon class="size-4" />
                {{ t('assistant.sendMessage') }}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </section>
</template>
