import type { StudioDataDocument } from '@story-studio/types'
import type { StudioStorageDriver } from '../storage/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultStudioDataDocument } from '../storage/document'
import { resetStudioDataForTest, useStudioData } from '../storage/useStudioData'
import { useWorkspaceIntegrity } from './useWorkspaceIntegrity'

describe('useWorkspaceIntegrity', () => {
  beforeEach(() => {
    resetStudioDataForTest()
  })

  it('returns an integrity report for the active workspace', async () => {
    const document = createDefaultStudioDataDocument()
    document.materialRefs = [
      {
        id: 'material-ref-1',
        workspaceId: document.activeWorkspaceId,
        materialId: 'missing-material',
        module: 'content',
        createdAt: '2026-07-04T00:00:00.000Z',
      },
    ]
    const driver = createDriver(document)
    await useStudioData(driver).ready

    const integrity = useWorkspaceIntegrity()

    expect(integrity.report.value.warningCount).toBe(1)
    expect(integrity.report.value.issues[0]?.kind).toBe('missing-material')
  })
})

function createDriver(document: StudioDataDocument): StudioStorageDriver & {
  load: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
} {
  return {
    load: vi.fn().mockResolvedValue(document),
    save: vi.fn().mockResolvedValue(undefined),
  }
}
