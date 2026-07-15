<script setup lang="ts">
import type { AutomaticBackupEntry } from '@/modules/storage/automaticBackup'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/composables/useLocale'
import { findLastSuccessfulBackupAt } from '@/modules/storage/automaticBackup'
import { useAutomaticBackup } from '@/modules/storage/useAutomaticBackup'

const emit = defineEmits<{ select: [backupId: string] }>()
const automaticBackup = useAutomaticBackup()
const { locale, t } = useLocale()
const lastSuccessfulAt = computed(() => findLastSuccessfulBackupAt(automaticBackup.entries.value))

function select(entry: AutomaticBackupEntry): void {
  if (entry.status === 'corrupted')
    return
  emit('select', entry.id)
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString(locale.value) : '—'
}

function formatSize(value: number): string {
  return `${Math.max(1, Math.round(value / 1024))} KB`
}
</script>

<template>
  <section class="border-border/70 grid gap-3 rounded-lg border p-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold">{{ t('backup.automatic.title') }}（{{ automaticBackup.entries.value.length }}）</h3>
      <Button type="button" variant="outline" :aria-pressed="automaticBackup.settings.value.enabled" @click="automaticBackup.setEnabled(!automaticBackup.settings.value.enabled)">
        {{ automaticBackup.settings.value.enabled ? t('backup.automatic.enabled') : t('backup.automatic.disabled') }}
      </Button>
    </div>
    <div class="text-muted-foreground grid gap-1 text-xs">
      <span>{{ t('backup.automatic.lastChecked') }}：{{ formatDate(automaticBackup.lastCheckedAt.value) }}</span>
      <span>{{ t('backup.automatic.lastSuccess') }}：{{ formatDate(lastSuccessfulAt) }}</span>
      <span>{{ t('backup.automatic.nextCheck') }}：{{ formatDate(automaticBackup.nextCheckAt.value) }}</span>
    </div>
    <Button type="button" variant="outline" :disabled="automaticBackup.isChecking.value" @click="automaticBackup.refresh">
      {{ t('backup.automatic.refresh') }}
    </Button>
    <p v-if="automaticBackup.error.value" class="text-destructive text-xs">{{ automaticBackup.error.value.message }}</p>
    <p v-for="warning in automaticBackup.cleanupWarnings.value" :key="warning" class="text-amber-700 text-xs">{{ t('backup.automatic.cleanupWarning') }}：{{ warning }}</p>
    <div v-for="entry in automaticBackup.entries.value" :key="entry.id" class="bg-muted/50 grid gap-1 rounded-md p-3 text-xs">
      <strong>{{ t(entry.source === 'scheduled' ? 'backup.automatic.scheduled' : 'backup.automatic.preRestore') }}</strong>
      <span>{{ formatDate(entry.createdAt) }} · {{ formatSize(entry.byteSize) }}</span>
      <span>{{ t('backup.updatedAt') }}：{{ formatDate(entry.documentUpdatedAt) }}</span>
      <span v-if="entry.summary">
        {{ t('backup.workspaces') }} {{ entry.summary.workspaceCount }} ·
        {{ t('backup.contents') }} {{ entry.summary.contentCount }} ·
        {{ t('backup.materials') }} {{ entry.summary.materialCount }} ·
        {{ t('backup.chats') }} {{ entry.summary.assistantThreadCount }}
      </span>
      <span v-if="entry.status === 'corrupted'" class="text-destructive">{{ t('backup.automatic.corrupted') }}</span>
      <Button type="button" variant="outline" :disabled="entry.status === 'corrupted'" @click="select(entry)">
        {{ t('backup.automatic.select') }}
      </Button>
    </div>
  </section>
</template>
