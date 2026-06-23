<script setup lang="ts">
import { Trash2Icon } from '@lucide/vue'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { useAssistant } from '@/modules/assistant/useAssistant'

const { t } = useLocale()
const {
  settings,
  storyStyles,
  defaultStoryStyle,
  addStoryStyle,
  updateStoryStyleById,
  removeStoryStyleById,
  updateDefaultStoryStyle,
} = useAssistant()

const storyStyleDraftName = ref('')
const storyStyleDraftDescription = ref('')
const storyStyleDraftConstraints = ref('')
const editingStoryStyleId = ref('')
const customStoryStyles = computed(() => storyStyles.value.filter(style => !style.system))
const styleFormTitle = computed(() => editingStoryStyleId.value ? t('assistant.storyStyleEdit') : t('assistant.storyStyleNew'))
const canSaveStoryStyle = computed(() => Boolean(storyStyleDraftName.value.trim()))

function updateGlobalStoryStyle(event: Event): void {
  updateDefaultStoryStyle(readEventValue(event))
}

function editStoryStyle(styleId: string): void {
  const style = storyStyles.value.find(item => item.id === styleId)

  if (!style || style.system)
    return

  editingStoryStyleId.value = style.id
  storyStyleDraftName.value = style.name
  storyStyleDraftDescription.value = style.description
  storyStyleDraftConstraints.value = style.constraints
}

function resetStoryStyleDraft(): void {
  editingStoryStyleId.value = ''
  storyStyleDraftName.value = ''
  storyStyleDraftDescription.value = ''
  storyStyleDraftConstraints.value = ''
}

function saveStoryStyle(): void {
  if (!canSaveStoryStyle.value)
    return

  const input = {
    name: storyStyleDraftName.value,
    description: storyStyleDraftDescription.value,
    constraints: storyStyleDraftConstraints.value,
  }

  if (editingStoryStyleId.value) {
    updateStoryStyleById(editingStoryStyleId.value, input)
    resetStoryStyleDraft()
    return
  }

  const style = addStoryStyle(input)

  updateDefaultStoryStyle(style.id)
  resetStoryStyleDraft()
}

function deleteStoryStyle(styleId: string): void {
  removeStoryStyleById(styleId)

  if (editingStoryStyleId.value === styleId)
    resetStoryStyleDraft()
}

function readEventValue(event: Event): string {
  return event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement
    ? event.target.value
    : ''
}
</script>

<template>
  <section class="grid gap-4 rounded-lg border p-4">
    <div>
      <h2 class="text-lg font-semibold">
        {{ t('assistant.styleSettingsTitle') }}
      </h2>
      <p class="text-muted-foreground mt-1 text-sm">
        {{ t('assistant.styleSettingsHint') }}
      </p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
      <div class="grid gap-4">
        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-sm">{{ t('assistant.globalStoryStyle') }}</span>
          <select
            class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            :value="settings.defaultStoryStyleId"
            @change="updateGlobalStoryStyle"
          >
            <option v-for="style in storyStyles" :key="style.id" :value="style.id">
              {{ style.name }}
            </option>
          </select>
        </label>

        <div class="bg-muted/40 grid gap-2 rounded-md border p-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">
              {{ defaultStoryStyle.name }}
            </h3>
            <span class="text-muted-foreground text-xs">
              {{ defaultStoryStyle.system ? t('assistant.builtInStoryStyle') : t('assistant.customStoryStyle') }}
            </span>
          </div>
          <p v-if="defaultStoryStyle.description" class="text-muted-foreground text-sm">
            {{ defaultStoryStyle.description }}
          </p>
          <p class="text-sm whitespace-pre-wrap">
            {{ defaultStoryStyle.constraints || t('assistant.storyStyleConstraintsEmpty') }}
          </p>
        </div>
      </div>

      <div class="grid gap-3 rounded-md border p-3">
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-sm font-semibold">
            {{ styleFormTitle }}
          </h3>
          <Button v-if="editingStoryStyleId" variant="ghost" size="sm" @click="resetStoryStyleDraft">
            {{ t('assistant.storyStyleCancelEdit') }}
          </Button>
        </div>

        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-xs">{{ t('assistant.storyStyleName') }}</span>
          <Input
            :model-value="storyStyleDraftName"
            :placeholder="t('assistant.storyStyleNamePlaceholder')"
            @update:model-value="storyStyleDraftName = String($event)"
          />
        </label>

        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-xs">{{ t('assistant.storyStyleDescription') }}</span>
          <Input
            :model-value="storyStyleDraftDescription"
            :placeholder="t('assistant.storyStyleDescriptionPlaceholder')"
            @update:model-value="storyStyleDraftDescription = String($event)"
          />
        </label>

        <label class="grid gap-1.5">
          <span class="text-muted-foreground text-xs">{{ t('assistant.storyStyleConstraints') }}</span>
          <Textarea
            :model-value="storyStyleDraftConstraints"
            class="min-h-24 resize-y"
            :placeholder="t('assistant.storyStyleConstraintsPlaceholder')"
            @update:model-value="storyStyleDraftConstraints = String($event)"
          />
        </label>

        <Button size="sm" :disabled="!canSaveStoryStyle" @click="saveStoryStyle">
          {{ editingStoryStyleId ? t('assistant.storyStyleSave') : t('assistant.storyStyleAdd') }}
        </Button>
      </div>
    </div>

    <div class="grid gap-2">
      <h3 class="text-sm font-semibold">
        {{ t('assistant.customStoryStyles') }}
      </h3>
      <div v-if="customStoryStyles.length" class="grid gap-2">
        <div
          v-for="style in customStoryStyles"
          :key="style.id"
          class="grid gap-2 rounded-md border p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">
              {{ style.name }}
            </p>
            <p class="text-muted-foreground mt-1 line-clamp-2 text-xs">
              {{ style.constraints || style.description || t('assistant.storyStyleConstraintsEmpty') }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button size="sm" variant="outline" @click="editStoryStyle(style.id)">
              {{ t('assistant.storyStyleEdit') }}
            </Button>
            <Button size="icon-sm" variant="ghost" :aria-label="t('assistant.storyStyleDelete')" @click="deleteStoryStyle(style.id)">
              <Trash2Icon class="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <p v-else class="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
        {{ t('assistant.customStoryStylesEmpty') }}
      </p>
    </div>
  </section>
</template>
