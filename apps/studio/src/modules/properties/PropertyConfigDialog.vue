<script setup lang="ts">
import type { EntityKind, PropertyDefinition, PropertyValueType } from '@story-studio/types'
import { EyeIcon, EyeOffIcon, GripVerticalIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useDraggable } from 'vue-draggable-plus'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/composables/useLocale'
import {
  createCustomProperty,
  createPropertyDraft,
  removeCustomProperty,
  updateProperty,
} from './properties'
import { useProperties } from './useProperties'

const props = defineProps<{
  kind: EntityKind
}>()

const { t } = useLocale()
const {
  properties,
  saveProperties,
} = useProperties(props.kind)

const isOpen = ref(false)
const propertyListRef = ref<HTMLElement | null>(null)
const draftProperties = ref<PropertyDefinition[]>([])
const newPropertyName = ref('')
const newPropertyType = ref<PropertyValueType>('text')

const propertyTypes = [
  { value: 'text', label: '短文本' },
  { value: 'longText', label: '长文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '单选' },
  { value: 'multiSelect', label: '多选' },
  { value: 'boolean', label: '开关' },
  { value: 'date', label: '日期' },
] as const satisfies readonly { value: PropertyValueType, label: string }[]

const optionCapableTypes = new Set<PropertyValueType>(['select', 'multiSelect'])
const visibleProperties = computed(() => draftProperties.value.filter(property => property.visible).length)

useDraggable<PropertyDefinition>(propertyListRef, draftProperties, {
  animation: 150,
  draggable: '.property-config-row',
  fallbackOnBody: true,
  forceFallback: true,
  ghostClass: 'border-primary bg-muted/70 opacity-70',
  handle: '.drag-handle',
})

watch(isOpen, (nextOpen) => {
  if (nextOpen)
    resetDraft()
})

function resetDraft(): void {
  draftProperties.value = createPropertyDraft(properties.value, props.kind)
  newPropertyName.value = ''
  newPropertyType.value = 'text'
}

function addNewProperty(): void {
  if (!newPropertyName.value.trim())
    return

  draftProperties.value = [
    ...draftProperties.value,
    createCustomProperty(draftProperties.value, {
      kind: props.kind,
      name: newPropertyName.value,
      valueType: newPropertyType.value,
    }),
  ]
  newPropertyName.value = ''
  newPropertyType.value = 'text'
}

function updateDraftProperty(propertyId: string, patch: Partial<Omit<PropertyDefinition, 'id' | 'kind' | 'system'>>): void {
  draftProperties.value = updateProperty(draftProperties.value, propertyId, patch)
}

function removeDraftProperty(propertyId: string): void {
  draftProperties.value = removeCustomProperty(draftProperties.value, propertyId)
}

function saveDraft(): void {
  saveProperties(draftProperties.value)
  isOpen.value = false
}

function cancelDraft(): void {
  resetDraft()
  isOpen.value = false
}

function updateOptions(property: PropertyDefinition, rawValue: string): void {
  updateDraftProperty(property.id, {
    options: rawValue
      .split(',')
      .map(option => option.trim())
      .filter(Boolean)
      .map(option => ({ id: option, label: option })),
  })
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <Button variant="outline" size="sm" @click="isOpen = true">
      <EyeIcon class="size-4" />
      {{ t('property.configure') }}
    </Button>
    <DialogContent class="max-h-[90svh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t('property.configure') }}</DialogTitle>
        <DialogDescription>
          {{ visibleProperties }} / {{ draftProperties.length }} 个属性正在显示
        </DialogDescription>
      </DialogHeader>

      <div
        ref="propertyListRef"
        class="grid gap-3"
      >
        <div
          v-for="property in draftProperties"
          :key="property.id"
          class="property-config-row border-border grid gap-3 rounded-md border p-3 transition md:grid-cols-[2rem_minmax(8rem,1fr)_8.5rem_12rem_auto]"
        >
          <button
            type="button"
            class="drag-handle text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 mt-5 inline-flex size-8 cursor-grab touch-none items-center justify-center rounded-md active:cursor-grabbing focus-visible:ring-3"
            aria-label="拖拽排序"
          >
            <GripVerticalIcon class="size-4" />
          </button>

          <div class="grid gap-1.5">
            <label class="text-muted-foreground text-xs">{{ t('property.name') }}</label>
            <Input
              :model-value="property.name"
              @update:model-value="updateDraftProperty(property.id, { name: String($event) })"
            />
          </div>

          <div class="grid gap-1.5">
            <label class="text-muted-foreground text-xs">{{ t('property.type') }}</label>
            <select
              class="border-input bg-background h-9 rounded-md border px-2 text-sm"
              :value="property.valueType"
              @change="updateDraftProperty(property.id, { valueType: ($event.target as HTMLSelectElement).value as PropertyValueType })"
            >
              <option v-for="type in propertyTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="grid gap-1.5">
            <label class="text-muted-foreground text-xs">{{ t('property.optionHint') }}</label>
            <Input
              :disabled="!optionCapableTypes.has(property.valueType)"
              :model-value="property.options?.map(option => option.label).join(', ') ?? ''"
              @update:model-value="updateOptions(property, String($event))"
            />
          </div>

          <div class="flex items-end justify-end gap-1">
            <Button variant="ghost" size="icon" :aria-label="t('property.required')" @click="updateDraftProperty(property.id, { required: !property.required })">
              <span class="text-xs font-semibold">{{ property.required ? '必' : '选' }}</span>
            </Button>
            <Button variant="ghost" size="icon" :aria-label="property.visible ? t('property.visible') : t('property.hidden')" @click="updateDraftProperty(property.id, { visible: !property.visible })">
              <EyeIcon v-if="property.visible" class="size-4" />
              <EyeOffIcon v-else class="size-4" />
            </Button>
            <Button
              v-if="!property.system"
              variant="ghost"
              size="icon"
              :aria-label="t('property.delete')"
              @click="removeDraftProperty(property.id)"
            >
              <Trash2Icon class="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <form class="border-border grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_9rem_auto]" @submit.prevent="addNewProperty">
        <Input v-model="newPropertyName" :placeholder="t('property.name')" />
        <select v-model="newPropertyType" class="border-input bg-background h-9 rounded-md border px-2 text-sm">
          <option v-for="type in propertyTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <Button type="submit">
          <PlusIcon class="size-4" />
          {{ t('property.add') }}
        </Button>
      </form>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" @click="cancelDraft">
          {{ t('workspace.form.cancel') }}
        </Button>
        <Button type="button" @click="saveDraft">
          {{ t('property.save') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
