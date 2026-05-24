import { describe, expect, it } from 'vitest'
import { createDefaultStudioDataDocument } from './document'
import {
  createIndexedDbStudioStorageDriver,
  STUDIO_INDEXED_DB_KEY,
} from './indexedDb'

interface FakeRequest<T> {
  error: DOMException | null
  onerror: ((event: Event) => void) | null
  onsuccess: ((event: Event) => void) | null
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null
  result: T | undefined
}

interface FakeTransaction {
  error: DOMException | null
  onabort: ((event: Event) => void) | null
  oncomplete: ((event: Event) => void) | null
  onerror: ((event: Event) => void) | null
  objectStore: () => IDBObjectStore
}

describe('indexedDB studio storage driver', () => {
  it('stores and loads the document with the fixed main key', async () => {
    const records = new Map<IDBValidKey, unknown>()
    const driver = createIndexedDbStudioStorageDriver(createFakeIndexedDbFactory(records))
    const document = createDefaultStudioDataDocument()

    await driver.save(document)

    expect(records.get(STUDIO_INDEXED_DB_KEY)).toEqual(document)
    await expect(driver.load()).resolves.toEqual(document)
  })

  it('rejects when IndexedDB is unavailable', async () => {
    const driver = createIndexedDbStudioStorageDriver(undefined)

    await expect(driver.load()).rejects.toThrow('IndexedDB is not available')
  })
})

function createFakeIndexedDbFactory(records: Map<IDBValidKey, unknown>): IDBFactory {
  return {
    open: () => {
      const request = createRequest<IDBDatabase>()
      const database = createFakeDatabase(records)

      queueMicrotask(() => {
        request.result = database
        request.onupgradeneeded?.({} as IDBVersionChangeEvent)
        request.onsuccess?.({} as Event)
      })

      return request as unknown as IDBOpenDBRequest
    },
  } as unknown as IDBFactory
}

function createFakeDatabase(records: Map<IDBValidKey, unknown>): IDBDatabase {
  return {
    close: () => {},
    createObjectStore: () => createFakeStore(records),
    objectStoreNames: {
      contains: () => false,
    },
    transaction: () => createFakeTransaction(records),
  } as unknown as IDBDatabase
}

function createFakeTransaction(records: Map<IDBValidKey, unknown>): FakeTransaction {
  const transaction: FakeTransaction = {
    error: null,
    onabort: null,
    oncomplete: null,
    onerror: null,
    objectStore: () => createFakeStore(records, transaction),
  }

  return transaction
}

function createFakeStore(records: Map<IDBValidKey, unknown>, transaction?: FakeTransaction): IDBObjectStore {
  return {
    get: (key: IDBValidKey) => {
      const request = createRequest<unknown>()

      queueMicrotask(() => {
        request.result = records.get(key)
        request.onsuccess?.({} as Event)
        transaction?.oncomplete?.({} as Event)
      })

      return request as unknown as IDBRequest<unknown>
    },
    put: (value: unknown, key: IDBValidKey) => {
      const request = createRequest<IDBValidKey>()

      queueMicrotask(() => {
        records.set(key, value)
        request.result = key
        request.onsuccess?.({} as Event)
        transaction?.oncomplete?.({} as Event)
      })

      return request as unknown as IDBRequest<IDBValidKey>
    },
  } as unknown as IDBObjectStore
}

function createRequest<T>(): FakeRequest<T> {
  return {
    error: null,
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: undefined,
  }
}
