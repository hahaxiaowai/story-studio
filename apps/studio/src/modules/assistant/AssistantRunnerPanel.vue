<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { useAssistant } from './useAssistant'
import { useAssistantRunner } from './useAssistantRunner'

const { t } = useLocale()
const { settings, providers } = useAssistant()
const runner = useAssistantRunner(settings)
const runnerResult = computed(() => runner.result.value)
const runnerExitCodeLabel = computed(() => {
  if (!runnerResult.value)
    return t('assistant.runnerExitUnknown')

  return runnerResult.value.exitCode === null
    ? t('assistant.runnerExitUnknown')
    : String(runnerResult.value.exitCode)
})
</script>

<template>
  <section class="grid gap-4 rounded-lg border p-4">
    <div>
      <h2 class="text-lg font-semibold">
        {{ t('assistant.runnerTitle') }}
      </h2>
      <p class="text-muted-foreground mt-1 text-sm">
        {{ t('assistant.runnerHint') }}
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] md:items-end">
      <label class="grid gap-1.5">
        <span class="text-muted-foreground text-sm">{{ t('assistant.runnerProvider') }}</span>
        <select
          v-model="runner.selectedProviderId.value"
          class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <option value="">
            {{ t('assistant.useGlobalDefault') }}
          </option>
          <option v-for="provider in providers" :key="provider.id" :value="provider.id">
            {{ provider.name }}
          </option>
        </select>
      </label>

      <label class="grid gap-1.5">
        <span class="text-muted-foreground text-sm">{{ t('assistant.runnerPrompt') }}</span>
        <Textarea
          :model-value="runner.prompt.value"
          class="min-h-24 resize-y"
          :placeholder="t('assistant.runnerPromptPlaceholder')"
          @update:model-value="runner.prompt.value = String($event)"
        />
      </label>

      <Button :disabled="Boolean(runner.disabledReason.value)" @click="runner.run">
        {{ runner.loading.value ? t('assistant.runnerRunning') : t('assistant.runnerRun') }}
      </Button>
    </div>

    <p v-if="runner.disabledReason.value || runner.error.value" class="text-muted-foreground text-sm">
      {{ runner.error.value || runner.disabledReason.value }}
    </p>

    <div v-if="runnerResult" class="grid gap-3 rounded-md border p-3">
      <div class="text-muted-foreground flex flex-wrap gap-4 text-xs">
        <span>{{ t('assistant.runnerExitCode') }}: {{ runnerExitCodeLabel }}</span>
        <span>{{ t('assistant.runnerDuration') }}: {{ runnerResult.durationMs }}ms</span>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <div class="grid gap-1.5">
          <span class="text-muted-foreground text-xs">stdout</span>
          <pre class="bg-muted/60 min-h-24 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">{{ runnerResult.stdout || t('assistant.runnerEmptyOutput') }}</pre>
        </div>
        <div class="grid gap-1.5">
          <span class="text-muted-foreground text-xs">stderr</span>
          <pre class="bg-muted/60 min-h-24 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">{{ runnerResult.stderr || t('assistant.runnerEmptyOutput') }}</pre>
        </div>
      </div>
    </div>
  </section>
</template>
