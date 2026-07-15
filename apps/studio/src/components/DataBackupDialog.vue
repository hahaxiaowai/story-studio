<script setup lang="ts">
import type { StudioDataDocument } from '@story-studio/types'
import type { MessageKey } from '@/composables/useLocale'
import { computed, ref, watch } from 'vue'
import AutomaticBackupPanel from '@/components/AutomaticBackupPanel.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLocale } from '@/composables/useLocale'
import {
  createStudioDataBackup,
  parseStudioDataBackup,
  StudioDataBackupError,
  summarizeStudioDataBackup,
} from '@/modules/storage/backup'
import {
  downloadStudioDataBackup,
  readStudioDataBackupFile,
} from '@/modules/storage/backupFile'
import { isTauriRuntime } from '@/modules/storage/runtime'
import { useAutomaticBackup } from '@/modules/storage/useAutomaticBackup'
import { useStudioData } from '@/modules/storage/useStudioData'

const open = defineModel<boolean>('open', { default: false })

const { locale, t } = useLocale()
const { document, replaceDocument } = useStudioData()
const automaticBackup = useAutomaticBackup()
const pendingDocument = ref<StudioDataDocument>()
const pendingAutomaticBackupId = ref<string>()
const importErrorKey = ref<MessageKey>()
const isRestoring = ref(false)
const restoreSucceeded = ref(false)

const currentSummary = computed(() => summarizeStudioDataBackup(document.value))
const pendingSummary = computed(() => pendingDocument.value
  ? summarizeStudioDataBackup(pendingDocument.value)
  : undefined)

watch(open, (nextOpen) => {
  if (!nextOpen)
    resetImportState()
})

function exportBackup(): void {
  downloadStudioDataBackup(createStudioDataBackup(document.value))
}

async function selectBackupFile(event: Event): Promise<void> {
  resetImportState()
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]

  if (!file)
    return

  try {
    const source = await readStudioDataBackupFile(file)
    const parsedDocument = parseStudioDataBackup(source)
    pendingDocument.value = parsedDocument
  }
  catch (error) {
    importErrorKey.value = getImportErrorKey(error)
  }
  finally {
    input.value = ''
  }
}

async function selectAutomaticBackup(backupId: string): Promise<void> {
  resetImportState()
  try {
    const source = await automaticBackup.read(backupId)
    pendingDocument.value = parseStudioDataBackup(source)
    pendingAutomaticBackupId.value = backupId
  }
  catch {
    importErrorKey.value = 'backup.error.automatic-read'
  }
}

async function confirmRestore(): Promise<void> {
  if (!pendingDocument.value || isRestoring.value)
    return

  isRestoring.value = true
  importErrorKey.value = undefined
  restoreSucceeded.value = false

  try {
    if (pendingAutomaticBackupId.value) {
      try {
        await automaticBackup.createProtection(document.value)
      }
      catch {
        importErrorKey.value = 'backup.error.automatic-protection'
        return
      }
    }
    await replaceDocument(pendingDocument.value)
    if (pendingAutomaticBackupId.value)
      await automaticBackup.refresh()
    pendingDocument.value = undefined
    pendingAutomaticBackupId.value = undefined
    restoreSucceeded.value = true
  }
  catch {
    importErrorKey.value = 'backup.error.save'
  }
  finally {
    isRestoring.value = false
  }
}

function resetImportState(): void {
  pendingDocument.value = undefined
  pendingAutomaticBackupId.value = undefined
  importErrorKey.value = undefined
  isRestoring.value = false
  restoreSucceeded.value = false
}

function getImportErrorKey(error: unknown): MessageKey {
  if (error instanceof StudioDataBackupError)
    return `backup.error.${error.code}`

  return 'backup.error.read'
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime()))
    return value

  return date.toLocaleString(locale.value)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ t('backup.title') }}</DialogTitle>
        <DialogDescription>{{ t('backup.description') }}</DialogDescription>
      </DialogHeader>

      <section class="border-border/70 grid gap-3 rounded-lg border p-4">
        <div>
          <h3 class="text-sm font-semibold">
            {{ t('backup.currentData') }}
          </h3>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t('backup.updatedAt') }}：{{ formatUpdatedAt(currentSummary.updatedAt) }}
          </p>
        </div>
        <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt class="text-muted-foreground">
              {{ t('backup.workspaces') }}
            </dt><dd class="font-medium">
              {{ currentSummary.workspaceCount }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              {{ t('backup.contents') }}
            </dt><dd class="font-medium">
              {{ currentSummary.contentCount }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              {{ t('backup.materials') }}
            </dt><dd class="font-medium">
              {{ currentSummary.materialCount }}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground">
              {{ t('backup.chats') }}
            </dt><dd class="font-medium">
              {{ currentSummary.assistantThreadCount }}
            </dd>
          </div>
        </dl>
        <p class="text-amber-700 text-xs dark:text-amber-400">
          {{ t('backup.sensitiveWarning') }}
        </p>
        <Button type="button" variant="outline" @click="exportBackup">
          {{ t('backup.export') }}
        </Button>
      </section>

      <AutomaticBackupPanel v-if="isTauriRuntime()" @select="selectAutomaticBackup" />

      <section class="border-border/70 grid gap-3 rounded-lg border p-4">
        <div>
          <h3 class="text-sm font-semibold">
            {{ t('backup.restoreTitle') }}
          </h3>
          <p class="text-muted-foreground mt-1 text-xs">
            {{ t('backup.restoreDescription') }}
          </p>
        </div>

        <label class="border-border bg-background hover:bg-muted inline-flex h-9 cursor-pointer items-center justify-center rounded-md border px-3 text-sm font-medium">
          {{ t('backup.chooseFile') }}
          <input class="sr-only" type="file" accept="application/json,.json" @change="selectBackupFile">
        </label>

        <p v-if="importErrorKey" class="text-destructive text-sm" role="alert">
          {{ t(importErrorKey) }}
        </p>
        <p v-if="restoreSucceeded" class="text-emerald-700 text-sm dark:text-emerald-400" role="status">
          {{ t('backup.restoreSucceeded') }}
        </p>

        <div v-if="pendingSummary" class="bg-muted/50 grid gap-3 rounded-md p-3">
          <div>
            <p class="text-sm font-medium">
              {{ t('backup.pendingData') }}
            </p>
            <p class="text-muted-foreground mt-1 text-xs">
              {{ t('backup.updatedAt') }}：{{ formatUpdatedAt(pendingSummary.updatedAt) }}
            </p>
          </div>
          <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt class="text-muted-foreground">
                {{ t('backup.workspaces') }}
              </dt><dd class="font-medium">
                {{ pendingSummary.workspaceCount }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ t('backup.contents') }}
              </dt><dd class="font-medium">
                {{ pendingSummary.contentCount }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ t('backup.materials') }}
              </dt><dd class="font-medium">
                {{ pendingSummary.materialCount }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                {{ t('backup.chats') }}
              </dt><dd class="font-medium">
                {{ pendingSummary.assistantThreadCount }}
              </dd>
            </div>
          </dl>
          <p class="text-destructive text-xs">
            {{ t('backup.overwriteWarning') }}
          </p>
          <Button type="button" variant="destructive" :disabled="isRestoring" @click="confirmRestore">
            {{ isRestoring ? t('backup.restoring') : t('backup.confirmRestore') }}
          </Button>
        </div>
      </section>

      <DialogFooter>
        <Button type="button" variant="outline" @click="open = false">
          {{ t('backup.close') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
