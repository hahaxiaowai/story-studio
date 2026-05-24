import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from './types'

export const STUDIO_INDEXED_DB_NAME = 'story-studio'
export const STUDIO_INDEXED_DB_VERSION = 2
export const STUDIO_INDEXED_DB_STORE = 'documents'
export const STUDIO_INDEXED_DB_KEY = 'main'

export function createIndexedDbStudioStorageDriver(factory: IDBFactory | undefined = globalThis.indexedDB): StudioStorageDriver {
  return {
    async load(): Promise<StudioDataDocument | undefined> {
      const database = await openStudioDatabase(factory)
      const result = await runStoreRequest<StudioDataDocument | undefined>(
        database,
        'readonly',
        store => store.get(STUDIO_INDEXED_DB_KEY) as IDBRequest<StudioDataDocument | undefined>,
      )
      database.close()

      return result
    },
    async save(document: StudioDataDocument): Promise<void> {
      const database = await openStudioDatabase(factory)
      await runStoreRequest(database, 'readwrite', store => store.put(document, STUDIO_INDEXED_DB_KEY))
      database.close()
    },
  }
}

function openStudioDatabase(factory: IDBFactory | undefined): Promise<IDBDatabase> {
  if (!factory)
    return Promise.reject(new Error('IndexedDB is not available in this environment.'))

  return new Promise((resolve, reject) => {
    const request = factory.open(STUDIO_INDEXED_DB_NAME, STUDIO_INDEXED_DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STUDIO_INDEXED_DB_STORE))
        database.createObjectStore(STUDIO_INDEXED_DB_STORE)
    }
    request.onerror = () => reject(request.error ?? new Error('Failed to open Story Studio IndexedDB.'))
    request.onsuccess = () => resolve(request.result)
  })
}

function runStoreRequest<T>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STUDIO_INDEXED_DB_STORE, mode)
    const store = transaction.objectStore(STUDIO_INDEXED_DB_STORE)
    const request = createRequest(store)
    let result: T

    request.onerror = () => reject(request.error ?? new Error('Story Studio IndexedDB request failed.'))
    request.onsuccess = () => {
      result = request.result
    }
    transaction.oncomplete = () => resolve(result)
    transaction.onabort = () => reject(transaction.error ?? new Error('Story Studio IndexedDB transaction was aborted.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('Story Studio IndexedDB transaction failed.'))
  })
}
