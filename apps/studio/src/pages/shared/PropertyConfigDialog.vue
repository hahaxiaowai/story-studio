<script setup lang="ts">
import type { EntityKind, PropertyDefinition, PropertyValueType } from '@story-studio/types'
import { EyeIcon, EyeOffIcon, GripVerticalIcon, PlusIcon, Trash2Icon, XIcon } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'
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
  addPropertyOption,
  createCustomProperty,
  createPropertyDraft,
  removeCustomProperty,
  removePropertyOption,
  updateProperty,
} from '@/modules/properties/properties'
import { useProperties } from '@/modules/properties/useProperties'

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
const optionInputs = ref<Record<string, string>>({})
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

const propertyDraggable = useDraggable<PropertyDefinition>(propertyListRef, draftProperties, {
  animation: 150,
  chosenClass: 'property-drag-chosen',
  draggable: '.property-config-item',
  ghostClass: 'opacity-50',
  handle: '.property-drag-handle',
  immediate: false,
})

watch(isOpen, async (nextOpen) => {
  if (nextOpen) {
    resetDraft()
    await nextTick()
    propertyDraggable.start()
    return
  }

  propertyDraggable.destroy()
})

function resetDraft(): void {
  draftProperties.value = createPropertyDraft(properties.value, props.kind)
  optionInputs.value = {}
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

function updatePropertyType(property: PropertyDefinition, valueType: PropertyValueType): void {
  updateDraftProperty(property.id, {
    valueType,
    options: optionCapableTypes.has(valueType) ? property.options : undefined,
  })
}

function saveDraft(): void {
  saveProperties(draftProperties.value)
  isOpen.value = false
}

function cancelDraft(): void {
  resetDraft()
  isOpen.value = false
}

function addDraftOption(property: PropertyDefinition): void {
  const nextOptions = addPropertyOption(property.options, optionInputs.value[property.id] ?? '')

  if (nextOptions === property.options)
    return

  updateDraftProperty(property.id, { options: nextOptions })
  optionInputs.value = {
    ...optionInputs.value,
    [property.id]: '',
  }
}

function removeDraftOption(property: PropertyDefinition, optionId: string): void {
  updateDraftProperty(property.id, {
    options: removePropertyOption(property.options, optionId),
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

      <div ref="propertyListRef" class="grid gap-3">
        <div
          v-for="property in draftProperties"
          :key="property.id"
          class="property-config-item border-border grid gap-3 rounded-md border p-3 transition md:grid-cols-[minmax(8rem,1fr)_8.5rem_auto]"
        >
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
              @change="updatePropertyType(property, ($event.target as HTMLSelectElement).value as PropertyValueType)"
            >
              <option v-for="type in propertyTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="property-drag-handle cursor-grab active:cursor-grabbing"
              aria-label="拖拽排序"
            >
              <GripVerticalIcon class="size-4" />
            </Button>
          </div>

          <div v-if="optionCapableTypes.has(property.valueType)" class="grid gap-2 md:col-span-3">
            <label class="text-muted-foreground text-xs">{{ t('property.options') }}</label>
            <div class="flex min-h-9 flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
              <span
                v-for="option in property.options ?? []"
                :key="option.id"
                class="bg-secondary text-secondary-foreground inline-flex h-7 max-w-full items-center gap-1 rounded-md px-2 text-sm"
              >
                <span class="truncate">{{ option.label }}</span>
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground inline-flex size-4 items-center justify-center"
                  :aria-label="`${t('property.delete')} ${option.label}`"
                  @click="removeDraftOption(property, option.id)"
                >
                  <XIcon class="size-3" />
                </button>
              </span>
              <span v-if="!property.options?.length" class="text-muted-foreground text-sm">
                {{ t('property.optionEmpty') }}
              </span>
            </div>
            <form class="flex gap-2" @submit.prevent="addDraftOption(property)">
              <Input
                v-model="optionInputs[property.id]"
                :placeholder="t('property.optionAdd')"
              />
              <Button type="submit" variant="outline">
                <PlusIcon class="size-4" />
                {{ t('property.optionAdd') }}
              </Button>
            </form>
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

<style scoped>
.property-drag-chosen {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
</style>
