<script setup lang="ts">
import type { AiProviderConfig, AiProviderKind, AssistantFeatureKey } from '@story-studio/types'
import type { MessageKey } from '@/composables/useLocale'
import { BotIcon, PlusIcon, TerminalIcon, Trash2Icon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/composables/useLocale'
import { useAssistant } from './useAssistant'

const { t } = useLocale()
const {
  settings,
  providers,
  features,
  addProvider,
  updateProviderById,
  removeProviderById,
  updateDefaults,
  updateFeatureBinding,
  clearFeatureBinding,
  resolveFeatureBinding,
} = useAssistant()

const selectedProviderId = ref<string>()
const selectedProvider = computed<AiProviderConfig | undefined>(() => {
  return providers.value.find(provider => provider.id === selectedProviderId.value) ?? providers.value[0]
})
const featureRows = computed(() => features.map(feature => ({
  feature,
  labelKey: getFeatureLabelKey(feature),
  override: settings.value.featureBindings.find(binding => binding.feature === feature),
  resolved: resolveFeatureBinding(feature),
})))

watch(providers, (nextProviders) => {
  if (!nextProviders.length) {
    selectedProviderId.value = undefined
    return
  }

  if (!selectedProviderId.value || !nextProviders.some(provider => provider.id === selectedProviderId.value))
    selectedProviderId.value = nextProviders[0]?.id
}, { immediate: true })

function createProvider(kind: AiProviderKind): void {
  const provider = addProvider(kind)

  selectedProviderId.value = provider.id
}

function updateSelectedProvider(input: Parameters<typeof updateProviderById>[1]): void {
  if (!selectedProvider.value)
    return

  updateProviderById(selectedProvider.value.id, input)
}

function deleteSelectedProvider(): void {
  if (!selectedProvider.value)
    return

  removeProviderById(selectedProvider.value.id)
}

function updateDefaultProvider(event: Event): void {
  updateDefaults({
    defaultProviderId: readEventValue(event),
    defaultModel: settings.value.defaultModel,
  })
}

function updateFeatureProvider(feature: AssistantFeatureKey, event: Event): void {
  const override = settings.value.featureBindings.find(binding => binding.feature === feature)

  updateFeatureBinding({
    feature,
    providerId: readEventValue(event),
    model: override?.model ?? '',
  })
}

function updateFeatureModel(feature: AssistantFeatureKey, model: string): void {
  const override = settings.value.featureBindings.find(binding => binding.feature === feature)

  updateFeatureBinding({
    feature,
    providerId: override?.providerId ?? '',
    model,
  })
}

function getFeatureLabelKey(feature: AssistantFeatureKey): MessageKey {
  const keys = {
    characters: 'nav.characters',
    content: 'nav.content',
    materials: 'nav.materials',
    outline: 'nav.outline',
    world: 'nav.world',
  } as const satisfies Record<AssistantFeatureKey, MessageKey>

  return keys[feature]
}

function getProviderKindLabel(provider: AiProviderConfig): string {
  return provider.kind === 'openai-compatible' ? t('assistant.apiProvider') : t('assistant.terminalProvider')
}

function readEventValue(event: Event): string {
  return event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
    ? event.target.value
    : ''
}
</script>

<template>
  <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
    <div class="border-border/70 flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          assistant
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ t('assistant.title') }}
        </h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button size="sm" @click="createProvider('openai-compatible')">
          <PlusIcon class="size-4" />
          {{ t('assistant.addApiProvider') }}
        </Button>
        <Button size="sm" variant="outline" @click="createProvider('local-terminal')">
          <TerminalIcon class="size-4" />
          {{ t('assistant.addTerminalProvider') }}
        </Button>
      </div>
    </div>

    <div class="grid min-h-[34rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="border-border/70 border-b p-4 lg:border-r lg:border-b-0">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold">
            {{ t('assistant.providers') }}
          </h2>
          <BotIcon class="text-muted-foreground size-4" />
        </div>

        <div v-if="providers.length" class="mt-4 grid gap-2">
          <button
            v-for="provider in providers"
            :key="provider.id"
            type="button"
            class="hover:bg-muted focus-visible:ring-ring/50 grid rounded-md border px-3 py-2 text-left transition focus-visible:ring-3"
            :class="provider.id === selectedProvider?.id ? 'border-primary bg-muted' : 'border-transparent'"
            @click="selectedProviderId = provider.id"
          >
            <span class="truncate text-sm font-medium">{{ provider.name }}</span>
            <span class="text-muted-foreground mt-1 flex items-center justify-between gap-2 text-xs">
              <span>{{ getProviderKindLabel(provider) }}</span>
              <span>{{ provider.model || t('assistant.modelUnset') }}</span>
            </span>
          </button>
        </div>

        <div v-else class="text-muted-foreground mt-4 grid h-48 place-items-center rounded-md border border-dashed p-4 text-center text-sm">
          {{ t('assistant.emptyProviders') }}
        </div>
      </aside>

      <div class="grid content-start gap-5 p-5">
        <section class="grid gap-4 rounded-lg border p-4">
          <div>
            <h2 class="text-lg font-semibold">
              {{ t('assistant.globalDefault') }}
            </h2>
            <p class="text-muted-foreground mt-1 text-sm">
              {{ t('assistant.globalDefaultHint') }}
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('assistant.defaultProvider') }}</span>
              <select
                class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                :value="settings.defaultProviderId"
                @change="updateDefaultProvider"
              >
                <option value="">
                  {{ t('assistant.providerUnset') }}
                </option>
                <option v-for="provider in providers" :key="provider.id" :value="provider.id">
                  {{ provider.name }}
                </option>
              </select>
            </label>

            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('assistant.defaultModel') }}</span>
              <Input
                :model-value="settings.defaultModel"
                placeholder="gpt-4.1-mini"
                @update:model-value="updateDefaults({ defaultProviderId: settings.defaultProviderId, defaultModel: String($event) })"
              />
            </label>
          </div>
        </section>

        <section v-if="selectedProvider" class="grid gap-4 rounded-lg border p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">
                {{ t('assistant.providerSettings') }}
              </h2>
              <p class="text-muted-foreground mt-1 text-sm">
                {{ t('assistant.providerSettingsHint') }}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" :aria-label="t('assistant.deleteProvider')" @click="deleteSelectedProvider">
              <Trash2Icon class="size-4" />
            </Button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('assistant.providerName') }}</span>
              <Input
                :model-value="selectedProvider.name"
                @update:model-value="updateSelectedProvider({ name: String($event) })"
              />
            </label>

            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('assistant.providerType') }}</span>
              <select
                disabled
                class="border-input bg-muted text-muted-foreground h-9 rounded-md border px-3 text-sm"
                :value="selectedProvider.kind"
              >
                <option value="openai-compatible">
                  {{ t('assistant.apiProvider') }}
                </option>
                <option value="local-terminal">
                  {{ t('assistant.terminalProvider') }}
                </option>
              </select>
            </label>

            <label v-if="selectedProvider.kind === 'openai-compatible'" class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('assistant.baseUrl') }}</span>
              <Input
                :model-value="selectedProvider.baseUrl"
                placeholder="https://api.openai.com/v1"
                @update:model-value="updateSelectedProvider({ baseUrl: String($event) })"
              />
            </label>

            <label v-if="selectedProvider.kind === 'openai-compatible'" class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('assistant.apiKey') }}</span>
              <Input
                type="password"
                :model-value="selectedProvider.apiKey"
                placeholder="sk-..."
                @update:model-value="updateSelectedProvider({ apiKey: String($event) })"
              />
            </label>

            <label class="grid gap-1.5">
              <span class="text-muted-foreground text-sm">{{ t('assistant.model') }}</span>
              <Input
                :model-value="selectedProvider.model"
                placeholder="gpt-4.1-mini"
                @update:model-value="updateSelectedProvider({ model: String($event) })"
              />
            </label>

            <label v-if="selectedProvider.kind === 'local-terminal'" class="grid gap-1.5 md:col-span-2">
              <span class="text-muted-foreground text-sm">{{ t('assistant.terminalCommand') }}</span>
              <Input
                :model-value="selectedProvider.terminalCommand"
                placeholder="codex --model gpt-5-codex"
                @update:model-value="updateSelectedProvider({ terminalCommand: String($event) })"
              />
            </label>
          </div>
        </section>

        <section class="grid gap-4 rounded-lg border p-4">
          <div>
            <h2 class="text-lg font-semibold">
              {{ t('assistant.featureDefaults') }}
            </h2>
            <p class="text-muted-foreground mt-1 text-sm">
              {{ t('assistant.featureDefaultsHint') }}
            </p>
          </div>

          <div class="grid gap-3">
            <div
              v-for="row in featureRows"
              :key="row.feature"
              class="grid gap-3 rounded-md border p-3 md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
            >
              <div>
                <p class="text-sm font-medium">
                  {{ t(row.labelKey) }}
                </p>
                <p class="text-muted-foreground mt-1 text-xs">
                  {{ row.resolved.model || t('assistant.modelUnset') }}
                </p>
              </div>

              <label class="grid gap-1.5">
                <span class="text-muted-foreground text-xs">{{ t('assistant.provider') }}</span>
                <select
                  class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  :value="row.override?.providerId ?? ''"
                  @change="updateFeatureProvider(row.feature, $event)"
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
                <span class="text-muted-foreground text-xs">{{ t('assistant.model') }}</span>
                <Input
                  :model-value="row.override?.model ?? ''"
                  :placeholder="settings.defaultModel || t('assistant.useGlobalDefault')"
                  @update:model-value="updateFeatureModel(row.feature, String($event))"
                />
              </label>

              <Button variant="outline" size="sm" @click="clearFeatureBinding(row.feature)">
                {{ t('assistant.clearOverride') }}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
