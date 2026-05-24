import type { StudioDataDocument } from '@story-studio/types'

export interface StudioStorageDriver {
  load: () => Promise<StudioDataDocument | undefined>
  save: (document: StudioDataDocument) => Promise<void>
}
