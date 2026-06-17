import type { EntityKind, EntityRecord, Workspace } from '@story-studio/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from '../workspaces/useWorkspaces'
import {
  createEntityRecord,
  getRecordsByWorkspaceAndKind,
  updateEntityRecord,
} from './entities'

export function useEntities(kind: EntityKind): {
  records: ComputedRef<EntityRecord[]>
  addRecord: () => EntityRecord
  updateRecord: (recordId: string, values: Record<string, unknown>) => void
  removeRecord: (recordId: string) => void
} {
  const studioData = useStudioData()
  const { activeWorkspace } = useWorkspaces()
  const records = computed<EntityRecord[]>(() => getRecordsByWorkspaceAndKind(
    studioData.document.value.entityRecords,
    activeWorkspace.value.id,
    kind,
  ))

  function addRecord(): EntityRecord {
    const record = createEntityRecord({
      workspaceId: activeWorkspace.value.id,
      kind,
      properties: studioData.document.value.propertyDefinitions,
      now: new Date().toISOString(),
    })

    studioData.updateDocument((document) => {
      const nextRecords = [...document.entityRecords, record]

      document.entityRecords = nextRecords
      syncWorkspaceEntityCount(
        document.workspaces,
        record.workspaceId,
        kind,
        getRecordsByWorkspaceAndKind(nextRecords, record.workspaceId, kind).length,
      )
    })

    return record
  }

  function updateRecord(recordId: string, values: Record<string, unknown>): void {
    studioData.updateDocument((document) => {
      document.entityRecords = document.entityRecords.map(record => record.id === recordId
        ? updateEntityRecord(record, document.propertyDefinitions, {
            values,
            now: new Date().toISOString(),
          })
        : record)
    })
  }

  function removeRecord(recordId: string): void {
    const workspaceId = activeWorkspace.value.id

    studioData.updateDocument((document) => {
      const nextRecords = document.entityRecords.filter(record => record.id !== recordId)

      document.entityRecords = nextRecords
      syncWorkspaceEntityCount(
        document.workspaces,
        workspaceId,
        kind,
        getRecordsByWorkspaceAndKind(nextRecords, workspaceId, kind).length,
      )
    })
  }

  return {
    records,
    addRecord,
    updateRecord,
    removeRecord,
  }
}

function syncWorkspaceEntityCount(
  workspaces: Workspace[],
  workspaceId: string,
  kind: EntityKind,
  count: number,
): void {
  if (kind !== 'character')
    return

  const workspace = workspaces.find(workspace => workspace.id === workspaceId)

  if (workspace)
    workspace.moduleCounts.characters = count
}
