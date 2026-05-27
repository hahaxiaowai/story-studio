<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useWorld } from './useWorld'

const { t } = useLocale()
const { settingGroups, addSettingGroup, addSettingItem } = useWorld()
const groupTitle = ref('')
const groupDescription = ref('')
const itemDrafts = ref<Record<string, { title: string, body: string }>>({})

const sortedGroups = computed(() => settingGroups.value.map(group => ({
  ...group,
  items: [...group.items].sort((left, right) => left.order - right.order),
})))

function submitGroup(): void {
  addSettingGroup({
    title: groupTitle.value,
    description: groupDescription.value,
  })
  groupTitle.value = ''
  groupDescription.value = ''
}

function submitItem(groupId: string): void {
  const draft = itemDrafts.value[groupId] ?? { title: '', body: '' }

  addSettingItem({
    groupId,
    title: draft.title,
    body: draft.body,
  })
  itemDrafts.value = {
    ...itemDrafts.value,
    [groupId]: { title: '', body: '' },
  }
}

function getItemDraft(groupId: string): { title: string, body: string } {
  return itemDrafts.value[groupId] ?? { title: '', body: '' }
}

function updateItemDraft(groupId: string, patch: Partial<{ title: string, body: string }>): void {
  itemDrafts.value = {
    ...itemDrafts.value,
    [groupId]: {
      ...getItemDraft(groupId),
      ...patch,
    },
  }
}

function updateItemTitle(groupId: string, event: Event): void {
  updateItemDraft(groupId, { title: (event.target as HTMLInputElement).value })
}

function updateItemBody(groupId: string, event: Event): void {
  updateItemDraft(groupId, { body: (event.target as HTMLTextAreaElement).value })
}
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <section class="grid gap-4" :aria-label="t('world.settings')">
      <article
        v-for="group in sortedGroups"
        :key="group.id"
        class="border-border/70 bg-background rounded-lg border p-5 shadow-sm"
      >
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold">
            {{ group.title }}
          </h2>
          <p class="text-muted-foreground text-sm">
            {{ group.description || t('world.groupDescriptionEmpty') }}
          </p>
        </div>

        <div class="mt-4 grid gap-3">
          <div
            v-for="item in group.items"
            :key="item.id"
            class="bg-muted/40 border-border/70 rounded-lg border p-4"
          >
            <h3 class="font-medium">
              {{ item.title }}
            </h3>
            <p class="text-muted-foreground mt-2 text-sm leading-6">
              {{ item.body || t('world.itemBodyEmpty') }}
            </p>
          </div>
        </div>

        <form class="border-border/70 mt-4 grid gap-3 border-t pt-4" @submit.prevent="submitItem(group.id)">
          <input
            :value="getItemDraft(group.id).title"
            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            :placeholder="t('world.itemTitlePlaceholder')"
            @input="updateItemTitle(group.id, $event)"
          >
          <textarea
            :value="getItemDraft(group.id).body"
            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-20 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            :placeholder="t('world.itemBodyPlaceholder')"
            @input="updateItemBody(group.id, $event)"
          />
          <button type="submit" class="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-4 text-sm font-medium">
            {{ t('world.addItem') }}
          </button>
        </form>
      </article>
    </section>

    <aside class="border-border/70 bg-background h-fit rounded-lg border p-5 shadow-sm">
      <h2 class="text-lg font-semibold">
        {{ t('world.addGroup') }}
      </h2>
      <form class="mt-4 grid gap-3" @submit.prevent="submitGroup">
        <input
          v-model="groupTitle"
          class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-10 rounded-md border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          :placeholder="t('world.groupTitlePlaceholder')"
        >
        <textarea
          v-model="groupDescription"
          class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          :placeholder="t('world.groupDescriptionPlaceholder')"
        />
        <button type="submit" class="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-4 text-sm font-medium">
          {{ t('world.addGroup') }}
        </button>
      </form>
    </aside>
  </div>
</template>
