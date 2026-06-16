<script setup lang="ts">
import type { MaterialAsset } from '@story-studio/types'
import type { MaterialKindFilter } from './materials'
import { ImageIcon, LinkIcon, PlusIcon, TagsIcon, Trash2Icon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/composables/useLocale'
import { useMaterials } from './useMaterials'

const { t } = useLocale()
const {
  materials,
  tags,
  selectedTagId,
  selectedKind,
  searchQuery,
  filteredMaterials,
  addMaterial,
  updateMaterialById,
  removeMaterialById,
  addTag,
  updateTagById,
  removeTagById,
} = useMaterials()

const selectedMaterialId = ref<string>()
const newTagName = ref('')
const materialKindFilters: { key: MaterialKindFilter, label: Parameters<typeof t>[0] }[] = [
  { key: 'all', label: 'materials.kindAll' },
  { key: 'text', label: 'materials.kindText' },
  { key: 'link', label: 'materials.kindLink' },
  { key: 'image', label: 'materials.kindImage' },
]

const selectedMaterial = computed<MaterialAsset | undefined>(() => {
  return filteredMaterials.value.find(material => material.id === selectedMaterialId.value) ?? filteredMaterials.value[0]
})

watch(filteredMaterials, (nextMaterials) => {
  if (!nextMaterials.length) {
    selectedMaterialId.value = undefined
    return
  }

  if (!selectedMaterialId.value || !nextMaterials.some(material => material.id === selectedMaterialId.value))
    selectedMaterialId.value = nextMaterials[0]?.id
}, { immediate: true })

function createMaterial(): void {
  const material = addMaterial()
  selectedTagId.value = undefined
  selectedMaterialId.value = material.id
}

function updateSelectedMaterial(input: Parameters<typeof updateMaterialById>[1]): void {
  if (!selectedMaterial.value)
    return

  updateMaterialById(selectedMaterial.value.id, input)
}

function deleteSelectedMaterial(): void {
  if (!selectedMaterial.value)
    return

  removeMaterialById(selectedMaterial.value.id)
}

function toggleSelectedMaterialTag(tagId: string): void {
  if (!selectedMaterial.value)
    return

  const tagIds = selectedMaterial.value.tagIds.includes(tagId)
    ? selectedMaterial.value.tagIds.filter(id => id !== tagId)
    : [...selectedMaterial.value.tagIds, tagId]

  updateSelectedMaterial({ tagIds })
}

function submitTag(): void {
  const tag = addTag(newTagName.value)

  newTagName.value = ''
  selectedTagId.value = tag.id
}

function updateTagName(tagId: string, name: string): void {
  updateTagById(tagId, { name })
}

function updateTagColor(tagId: string, color: string): void {
  updateTagById(tagId, { color })
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}
</script>

<template>
  <section class="border-border/70 bg-background min-h-[calc(100svh-12rem)] rounded-lg border shadow-sm">
    <div class="border-border/70 flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-muted-foreground text-xs font-medium uppercase">
          library
        </p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
          {{ t('materials.title') }}
        </h1>
      </div>
      <Button size="sm" @click="createMaterial">
        <PlusIcon class="size-4" />
        {{ t('materials.add') }}
      </Button>
    </div>

    <div class="grid min-h-[34rem] lg:grid-cols-[16rem_minmax(16rem,22rem)_minmax(0,1fr)]">
      <aside class="border-border/70 border-b p-4 lg:border-r lg:border-b-0">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold">
            {{ t('materials.filter') }}
          </h2>
          <TagsIcon class="text-muted-foreground size-4" />
        </div>

        <div class="mt-4 grid gap-2">
          <button
            type="button"
            class="hover:bg-muted focus-visible:ring-ring/50 flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition focus-visible:ring-3"
            :class="!selectedTagId ? 'bg-muted font-medium' : 'text-muted-foreground'"
            @click="selectedTagId = undefined"
          >
            <span>{{ t('materials.all') }}</span>
            <span>{{ materials.length }}</span>
          </button>
          <button
            v-for="tag in tags"
            :key="tag.id"
            type="button"
            class="hover:bg-muted focus-visible:ring-ring/50 flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition focus-visible:ring-3"
            :class="selectedTagId === tag.id ? 'bg-muted font-medium' : 'text-muted-foreground'"
            @click="selectedTagId = tag.id"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: tag.color }" />
              <span class="truncate">{{ tag.name }}</span>
            </span>
            <span>{{ materials.filter(material => material.tagIds.includes(tag.id)).length }}</span>
          </button>
        </div>
      </aside>

      <aside class="border-border/70 border-b p-4 lg:border-r lg:border-b-0">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold">
            {{ t('materials.list') }}
          </h2>
          <span class="text-muted-foreground text-xs">{{ filteredMaterials.length }}</span>
        </div>

        <Input
          v-model="searchQuery"
          class="mt-4"
          type="search"
          :placeholder="t('materials.searchPlaceholder')"
        />

        <div class="mt-3">
          <p class="text-muted-foreground text-xs">
            {{ t('materials.typeFilter') }}
          </p>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button
              v-for="filter in materialKindFilters"
              :key="filter.key"
              type="button"
              class="hover:bg-muted focus-visible:ring-ring/50 rounded-md px-3 py-2 text-left text-xs transition focus-visible:ring-3"
              :class="selectedKind === filter.key ? 'bg-muted font-medium' : 'text-muted-foreground'"
              @click="selectedKind = filter.key"
            >
              {{ t(filter.label) }}
            </button>
          </div>
        </div>

        <div v-if="filteredMaterials.length" class="mt-3 grid gap-2">
          <button
            v-for="material in filteredMaterials"
            :key="material.id"
            type="button"
            class="hover:bg-muted focus-visible:ring-ring/50 grid rounded-md border px-3 py-2 text-left transition focus-visible:ring-3"
            :class="material.id === selectedMaterial?.id ? 'border-primary bg-muted' : 'border-transparent'"
            @click="selectedMaterialId = material.id"
          >
            <span class="truncate text-sm font-medium">{{ material.title }}</span>
            <span class="text-muted-foreground mt-1 line-clamp-2 text-xs">
              {{ material.text || material.url || material.imageUrl || t('materials.emptyContent') }}
            </span>
            <span class="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
              <span v-if="material.url" class="inline-flex items-center gap-1">
                <LinkIcon class="size-3" />
                {{ t('materials.link') }}
              </span>
              <span v-if="material.imageUrl" class="inline-flex items-center gap-1">
                <ImageIcon class="size-3" />
                {{ t('materials.image') }}
              </span>
              <span>{{ formatDate(material.updatedAt) }}</span>
            </span>
          </button>
        </div>

        <div v-else class="text-muted-foreground mt-4 grid h-48 place-items-center rounded-md border border-dashed text-sm">
          {{ t('materials.empty') }}
        </div>
      </aside>

      <div class="grid gap-5 p-5">
        <div v-if="selectedMaterial" class="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_18rem]">
          <section class="grid gap-5">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-muted-foreground text-xs">
                  {{ t('materials.current') }}
                </p>
                <h2 class="truncate text-xl font-semibold">
                  {{ selectedMaterial.title }}
                </h2>
              </div>
              <Button variant="ghost" size="icon-sm" :aria-label="t('materials.delete')" @click="deleteSelectedMaterial">
                <Trash2Icon class="size-4" />
              </Button>
            </div>

            <form class="grid gap-4">
              <label class="grid gap-1.5">
                <span class="text-muted-foreground text-sm">{{ t('materials.name') }}</span>
                <Input
                  :model-value="selectedMaterial.title"
                  @update:model-value="updateSelectedMaterial({ title: String($event) })"
                />
              </label>

              <label class="grid gap-1.5">
                <span class="text-muted-foreground text-sm">{{ t('materials.url') }}</span>
                <Input
                  :model-value="selectedMaterial.url"
                  placeholder="https://example.com/reference"
                  @update:model-value="updateSelectedMaterial({ url: String($event) })"
                />
              </label>

              <label class="grid gap-1.5">
                <span class="text-muted-foreground text-sm">{{ t('materials.imageUrl') }}</span>
                <Input
                  :model-value="selectedMaterial.imageUrl"
                  placeholder="https://example.com/image.png"
                  @update:model-value="updateSelectedMaterial({ imageUrl: String($event) })"
                />
              </label>

              <div v-if="selectedMaterial.imageUrl" class="border-border/70 bg-muted/30 overflow-hidden rounded-lg border">
                <img :src="selectedMaterial.imageUrl" :alt="selectedMaterial.title" class="max-h-72 w-full object-cover">
              </div>

              <label class="grid gap-1.5">
                <span class="text-muted-foreground text-sm">{{ t('materials.text') }}</span>
                <Textarea
                  class="min-h-56"
                  :model-value="selectedMaterial.text"
                  :placeholder="t('materials.textPlaceholder')"
                  @update:model-value="updateSelectedMaterial({ text: String($event) })"
                />
              </label>
            </form>
          </section>

          <aside class="grid content-start gap-5">
            <section class="border-border/70 rounded-lg border p-4">
              <h3 class="text-sm font-semibold">
                {{ t('materials.tags') }}
              </h3>
              <div v-if="tags.length" class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="tag in tags"
                  :key="tag.id"
                  type="button"
                  class="focus-visible:ring-ring/50 rounded-full border px-3 py-1 text-xs transition focus-visible:ring-3"
                  :class="selectedMaterial.tagIds.includes(tag.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'"
                  @click="toggleSelectedMaterialTag(tag.id)"
                >
                  {{ tag.name }}
                </button>
              </div>
              <p v-else class="text-muted-foreground mt-3 text-sm">
                {{ t('materials.noTags') }}
              </p>
            </section>

            <section class="border-border/70 rounded-lg border p-4">
              <h3 class="text-sm font-semibold">
                {{ t('materials.tagManager') }}
              </h3>
              <form class="mt-3 flex gap-2" @submit.prevent="submitTag">
                <Input
                  v-model="newTagName"
                  :placeholder="t('materials.newTag')"
                />
                <Button type="submit" size="sm">
                  <PlusIcon class="size-4" />
                </Button>
              </form>

              <div v-if="tags.length" class="mt-4 grid gap-3">
                <div v-for="tag in tags" :key="tag.id" class="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2">
                  <input
                    class="border-border bg-background h-9 w-9 rounded-md border p-1"
                    type="color"
                    :value="tag.color"
                    :aria-label="t('materials.tagColor')"
                    @input="updateTagColor(tag.id, ($event.target as HTMLInputElement).value)"
                  >
                  <Input
                    :model-value="tag.name"
                    @update:model-value="updateTagName(tag.id, String($event))"
                  />
                  <Button variant="ghost" size="icon-sm" :aria-label="t('materials.deleteTag')" @click="removeTagById(tag.id)">
                    <Trash2Icon class="size-4" />
                  </Button>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <div v-else class="text-muted-foreground grid min-h-80 place-items-center rounded-md border border-dashed text-sm">
          <div class="grid justify-items-center gap-3">
            <p>{{ t('materials.empty') }}</p>
            <Button size="sm" @click="createMaterial">
              <PlusIcon class="size-4" />
              {{ t('materials.add') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
