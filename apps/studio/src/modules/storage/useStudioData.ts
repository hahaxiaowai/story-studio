import type { StudioDataDocument } from '@story-studio/types'
import type { ComputedRef, Ref } from 'vue'
import type { StudioStorageDriver } from './types'
import { computed, isProxy, ref } from 'vue'
import { resolveStudioDataDocument } from './document'
import { createStudioStorageDriver } from './runtime'

const document = ref<StudioDataDocument>(resolveStudioDataDocument(undefined))
const isLoaded = ref(false)
const loadError = ref<Error>()

let storageDriver: StudioStorageDriver | undefined
let readyPromise: Promise<void> | undefined

export function useStudioData(driver = storageDriver ?? createStudioStorageDriver()): {
  document: Ref<StudioDataDocument>
  isLoaded: ComputedRef<boolean>
  loadError: Ref<Error | undefined>
  ready: Promise<void>
  saveNow: () => Promise<void>
  updateDocument: (updater: (document: StudioDataDocument) => void) => void
} {
  storageDriver = driver
  readyPromise ??= loadStudioData(driver)

  return {
    document,
    isLoaded: computed(() => isLoaded.value),
    loadError,
    ready: readyPromise,
    saveNow,
    updateDocument,
  }
}

export function resetStudioDataForTest(): void {
  document.value = resolveStudioDataDocument(undefined)
  isLoaded.value = false
  loadError.value = undefined
  storageDriver = undefined
  readyPromise = undefined
}

async function loadStudioData(driver: StudioStorageDriver): Promise<void> {
  try {
    const storedDocument = await driver.load()
    document.value = resolveStudioDataDocument(storedDocument)

    if (!storedDocument)
      await driver.save(document.value)
  }
  catch (error) {
    loadError.value = toError(error)
  }
  finally {
    isLoaded.value = true
  }
}

function updateDocument(updater: (document: StudioDataDocument) => void): void {
  updater(document.value)
  document.value = {
    ...document.value,
    updatedAt: new Date().toISOString(),
  }
  void saveNow().catch((error) => {
    loadError.value = toError(error)
  })
}

async function saveNow(): Promise<void> {
  if (!storageDriver)
    return

  await storageDriver.save(createPersistableDocument(document.value))
}

function createPersistableDocument(sourceDocument: StudioDataDocument): StudioDataDocument {
  const serializedDocument = JSON.parse(JSON.stringify(sourceDocument)) as StudioDataDocument

  if (isProxy(serializedDocument))
    throw new Error('Studio data document must be serialized before saving.')

  return serializedDocument
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
