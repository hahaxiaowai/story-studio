import type { AiProviderConfig, AiProviderKind, AssistantFeatureKey, AssistantSettings, AssistantStoryStyle } from '@story-studio/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import {
  createAssistantStoryStyle,
  createProvider,
  getAssistantFeatures,
  getDefaultAssistantStoryStyle,
  getFeatureModelBinding,
  removeAssistantStoryStyle,
  removeFeatureBinding,
  removeProvider,
  resolveAssistantStoryStyle,
  setFeatureBinding,
  updateAssistantSettings,
  updateAssistantStoryStyle,
  updateDefaultAssistantStoryStyle,
  updateProvider,
} from './assistant'

export type UpdateProviderInput = Omit<Parameters<typeof updateProvider>[1], 'now'>

export function useAssistant(): {
  settings: ComputedRef<AssistantSettings>
  providers: ComputedRef<AiProviderConfig[]>
  storyStyles: ComputedRef<AssistantStoryStyle[]>
  defaultStoryStyle: ComputedRef<AssistantStoryStyle>
  features: readonly AssistantFeatureKey[]
  addProvider: (kind: AiProviderKind) => AiProviderConfig
  updateProviderById: (providerId: string, input: UpdateProviderInput) => void
  removeProviderById: (providerId: string) => void
  addStoryStyle: (input: Omit<Parameters<typeof createAssistantStoryStyle>[0], 'now'>) => AssistantStoryStyle
  updateStoryStyleById: (styleId: string, input: Omit<Parameters<typeof updateAssistantStoryStyle>[2], 'now'>) => void
  removeStoryStyleById: (styleId: string) => void
  getDefaultStoryStyle: () => AssistantStoryStyle
  resolveStoryStyle: (styleId?: string) => AssistantStoryStyle
  updateDefaultStoryStyle: (styleId: string) => void
  updateDefaults: (input: Parameters<typeof updateAssistantSettings>[1]) => void
  updateFeatureBinding: (input: Parameters<typeof setFeatureBinding>[1]) => void
  clearFeatureBinding: (feature: AssistantFeatureKey) => void
  resolveFeatureBinding: (feature: AssistantFeatureKey) => ReturnType<typeof getFeatureModelBinding>
} {
  const studioData = useStudioData()
  const settings = computed<AssistantSettings>(() => studioData.document.value.assistantSettings)
  const providers = computed<AiProviderConfig[]>(() => settings.value.providers)
  const storyStyles = computed<AssistantStoryStyle[]>(() => settings.value.storyStyles)
  const defaultStoryStyle = computed<AssistantStoryStyle>(() => getDefaultAssistantStoryStyle(settings.value))

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

  function addStoryStyle(input: Omit<Parameters<typeof createAssistantStoryStyle>[0], 'now'>): AssistantStoryStyle {
    const style = createAssistantStoryStyle({
      ...input,
      now: new Date().toISOString(),
    })

    studioData.updateDocument((document) => {
      document.assistantSettings = {
        ...document.assistantSettings,
        storyStyles: [...document.assistantSettings.storyStyles, style],
      }
    })

    return style
  }

  function updateStoryStyleById(styleId: string, input: Omit<Parameters<typeof updateAssistantStoryStyle>[2], 'now'>): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = updateAssistantStoryStyle(document.assistantSettings, styleId, {
        ...input,
        now: new Date().toISOString(),
      })
    })
  }

  function removeStoryStyleById(styleId: string): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = removeAssistantStoryStyle(document.assistantSettings, styleId)
    })
  }

  function getDefaultStoryStyle(): AssistantStoryStyle {
    return getDefaultAssistantStoryStyle(settings.value)
  }

  function resolveStoryStyle(styleId?: string): AssistantStoryStyle {
    return resolveAssistantStoryStyle(settings.value, styleId)
  }

  function updateDefaultStoryStyle(styleId: string): void {
    studioData.updateDocument((document) => {
      document.assistantSettings = updateDefaultAssistantStoryStyle(document.assistantSettings, {
        defaultStoryStyleId: styleId,
      })
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
    storyStyles,
    defaultStoryStyle,
    features: getAssistantFeatures(),
    addProvider,
    updateProviderById,
    removeProviderById,
    addStoryStyle,
    updateStoryStyleById,
    removeStoryStyleById,
    getDefaultStoryStyle,
    resolveStoryStyle,
    updateDefaultStoryStyle,
    updateDefaults,
    updateFeatureBinding,
    clearFeatureBinding,
    resolveFeatureBinding,
  }
}
