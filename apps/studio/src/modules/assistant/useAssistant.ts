import type { AiProviderConfig, AiProviderKind, AssistantFeatureKey, AssistantSettings } from '@story-studio/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import {
  createProvider,
  getAssistantFeatures,
  getFeatureModelBinding,
  removeFeatureBinding,
  removeProvider,
  setFeatureBinding,
  updateAssistantSettings,
  updateProvider,
} from './assistant'

export type UpdateProviderInput = Omit<Parameters<typeof updateProvider>[1], 'now'>

export function useAssistant(): {
  settings: ComputedRef<AssistantSettings>
  providers: ComputedRef<AiProviderConfig[]>
  features: readonly AssistantFeatureKey[]
  addProvider: (kind: AiProviderKind) => AiProviderConfig
  updateProviderById: (providerId: string, input: UpdateProviderInput) => void
  removeProviderById: (providerId: string) => void
  updateDefaults: (input: Parameters<typeof updateAssistantSettings>[1]) => void
  updateFeatureBinding: (input: Parameters<typeof setFeatureBinding>[1]) => void
  clearFeatureBinding: (feature: AssistantFeatureKey) => void
  resolveFeatureBinding: (feature: AssistantFeatureKey) => ReturnType<typeof getFeatureModelBinding>
} {
  const studioData = useStudioData()
  const settings = computed<AssistantSettings>(() => studioData.document.value.assistantSettings)
  const providers = computed<AiProviderConfig[]>(() => settings.value.providers)

  function addProvider(kind: AiProviderKind): AiProviderConfig {
    const provider = createProvider({
      kind,
      now: new Date().toISOString(),
    })

    studioData.updateDocument((document) => {
      const nextSettings = {
        ...document.assistantSettings,
        providers: [...document.assistantSettings.providers, provider],
      }

      document.assistantSettings = document.assistantSettings.defaultProviderId
        ? nextSettings
        : updateAssistantSettings(nextSettings, {
            defaultProviderId: provider.id,
            defaultModel: provider.model,
          })
    })

    return provider
  }

  function updateProviderById(providerId: string, input: UpdateProviderInput): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = {
        ...document.assistantSettings,
        providers: document.assistantSettings.providers.map(provider => provider.id === providerId
          ? updateProvider(provider, {
              ...input,
              now: new Date().toISOString(),
            })
          : provider),
      }
    })
  }

  function removeProviderById(providerId: string): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = removeProvider(document.assistantSettings, providerId)
    })
  }

  function updateDefaults(input: Parameters<typeof updateAssistantSettings>[1]): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = updateAssistantSettings(document.assistantSettings, input)
    })
  }

  function updateFeatureBinding(input: Parameters<typeof setFeatureBinding>[1]): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = setFeatureBinding(document.assistantSettings, input)
    })
  }

  function clearFeatureBinding(feature: AssistantFeatureKey): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = removeFeatureBinding(document.assistantSettings, feature)
    })
  }

  function resolveFeatureBinding(feature: AssistantFeatureKey): ReturnType<typeof getFeatureModelBinding> {
    return getFeatureModelBinding(settings.value, feature)
  }

  return {
    settings,
    providers,
    features: getAssistantFeatures(),
    addProvider,
    updateProviderById,
    removeProviderById,
    updateDefaults,
    updateFeatureBinding,
    clearFeatureBinding,
    resolveFeatureBinding,
  }
}
