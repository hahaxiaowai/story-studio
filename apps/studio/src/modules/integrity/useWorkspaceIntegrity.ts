import type { ComputedRef } from 'vue'
import type { WorkspaceIntegrityReport } from './integrity'
import { computed } from 'vue'
import { useStudioData } from '../storage/useStudioData'
import { useWorkspaces } from '../workspaces/useWorkspaces'
import { getWorkspaceIntegrityReport } from './integrity'

export function useWorkspaceIntegrity(): {
  report: ComputedRef<WorkspaceIntegrityReport>
} {
  const studioData = useStudioData()
  const { activeWorkspace } = useWorkspaces()

  const report = computed<WorkspaceIntegrityReport>(() => {
    return getWorkspaceIntegrityReport(studioData.document.value, activeWorkspace.value.id)
  })

  return {
    report,
  }
}
