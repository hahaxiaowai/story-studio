<script setup lang="ts">
import type { EntityKind, EntityRecord, PropertyDefinition, PropertyValue } from '@story-studio/types'
import { CheckCircle2Icon, PlusIcon, Trash2Icon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import PropertyConfigDialog from '../properties/PropertyConfigDialog.vue'
import { useProperties } from '../properties/useProperties'
import { getEntityTitle } from './entities'
import { useEntities } from './useEntities'

const props = defineProps<{
  kind: EntityKind
  title: string
  emptyLabel: string
}>()

const { t } = useLocale()
const { properties } = useProperties(props.kind)
const { records, addRecord, updateRecord, removeRecord } = useEntities(props.kind)
const selectedRecordId = ref<string>()

const visibleProperties = computed<PropertyDefinition[]>(() => properties.value.filter(property => property.visible))
const selectedRecord = computed<EntityRecord | undefined>(() => records.value.find(record => record.id === selectedRecordId.value) ?? records.value[0])
const selectedTitle = computed<string>(() => selectedRecord.value ? getEntityTitle(selectedRecord.value, properties.value) : props.title)

watch(records, (nextRecords) => {
  if (!nextRecords.length) {
    selectedRecordId.value = undefined
    return
  }

  if (!selectedRecordId.value || !nextRecords.some(record => record.id === selectedRecordId.value))
    selectedRecordId.value = nextRecords[0]?.id
}, { immediate: true })

function createRecord(): void {
  const record = addRecord()
  selectedRecordId.value = record.id
}

function updateValue(property: PropertyDefinition, value: unknown): void {
  if (!selectedRecord.value)
    return

  updateRecord(selectedRecord.value.id, {
    [property.id]: value,
  })
}

function deleteSelectedRecord(): void {
  if (!selectedRecord.value)
    return

  removeRecord(selectedRecord.value.id)
}

function formatValue(value: PropertyValue): string {
  if (Array.isArray(value))
    return value.join(', ')

  if (typeof value === 'boolean')
    return value ? '是' : '否'

  return value === null || value === undefined ? '' : String(value)
}

function updateSelect(property: PropertyDefinition, event: Event): void {
  updateValue(property, (event.target as HTMLSelectElement).value)
}

function updateMultiSelect(property: PropertyDefinition, event: Event): void {
  const selectedValues = Array.from((event.target as HTMLSelectElement).selectedOptions).map(option => option.value)

  updateValue(property, selectedValues)
}

function updateCheckbox(property: PropertyDefinition, event: Event): void {
  updateValue(property, (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
    <div class="border-border/70 flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          {{ kind }}
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ title }}
        </h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <PropertyConfigDialog :kind="kind" />
        <Button size="sm" @click="createRecord">
          <PlusIcon class="size-4" />
          {{ t('character.add') }}
        </Button>
      </div>
    </div>

    <div class="grid min-h-[32rem] gap-0 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="border-border/70 border-b p-4 lg:border-r lg:border-b-0">
        <div v-if="records.length" class="grid gap-2">
          <button
            v-for="record in records"
            :key="record.id"
            type="button"
            class="hover:bg-muted focus-visible:ring-ring/50 grid rounded-md border px-3 py-2 text-left transition focus-visible:ring-3"
            :class="record.id === selectedRecord?.id ? 'border-primary bg-muted' : 'border-transparent'"
            @click="selectedRecordId = record.id"
          >
            <span class="truncate text-sm font-medium">{{ getEntityTitle(record, properties) }}</span>
            <span class="text-muted-foreground mt-1 truncate text-xs">{{ new Date(record.updatedAt).toLocaleDateString() }}</span>
          </button>
        </div>
        <div v-else class="text-muted-foreground grid h-48 place-items-center rounded-md border border-dashed text-sm">
          {{ emptyLabel }}
        </div>
      </aside>

      <div class="grid gap-5 p-5">
        <div v-if="selectedRecord" class="grid gap-5">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="text-muted-foreground text-xs">
                当前记录
              </p>
              <h2 class="truncate text-xl font-semibold">
                {{ selectedTitle }}
              </h2>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="删除记录" @click="deleteSelectedRecord">
              <Trash2Icon class="size-4" />
            </Button>
          </div>

          <form class="grid gap-4 md:grid-cols-2">
            <label
              v-for="property in visibleProperties"
              :key="property.id"
              class="grid gap-1.5"
              :class="property.valueType === 'longText' ? 'md:col-span-2' : ''"
            >
              <span class="text-muted-foreground text-sm">
                {{ property.name }}
                <span v-if="property.required" class="text-destructive">*</span>
              </span>

              <Textarea
                v-if="property.valueType === 'longText'"
                :model-value="formatValue(selectedRecord.values[property.id])"
                @update:model-value="updateValue(property, $event)"
              />

              <select
                v-else-if="property.valueType === 'select'"
                class="border-input bg-background h-9 rounded-md border px-2 text-sm"
                :value="formatValue(selectedRecord.values[property.id])"
                @change="updateSelect(property, $event)"
              >
                <option v-for="option in property.options ?? []" :key="option.id" :value="option.id">
                  {{ option.label }}
                </option>
              </select>

              <select
                v-else-if="property.valueType === 'multiSelect'"
                class="border-input bg-background min-h-24 rounded-md border px-2 py-2 text-sm"
                multiple
                :value="selectedRecord.values[property.id]"
                @change="updateMultiSelect(property, $event)"
              >
                <option v-for="option in property.options ?? []" :key="option.id" :value="option.id">
                  {{ option.label }}
                </option>
              </select>

              <label v-else-if="property.valueType === 'boolean'" class="border-input flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <input
                  type="checkbox"
                  :checked="selectedRecord.values[property.id] === true"
                  @change="updateCheckbox(property, $event)"
                >
                <span>启用</span>
              </label>

              <Input
                v-else
                :type="property.valueType === 'date' ? 'date' : property.valueType === 'number' ? 'number' : 'text'"
                :model-value="formatValue(selectedRecord.values[property.id])"
                @update:model-value="updateValue(property, $event)"
              />
            </label>
          </form>
        </div>

        <div v-else class="text-muted-foreground grid min-h-80 place-items-center rounded-md border border-dashed text-sm">
          <div class="grid justify-items-center gap-3">
            <CheckCircle2Icon class="size-8" />
            <p>{{ emptyLabel }}</p>
            <Button size="sm" @click="createRecord">
              <PlusIcon class="size-4" />
              {{ t('character.add') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
