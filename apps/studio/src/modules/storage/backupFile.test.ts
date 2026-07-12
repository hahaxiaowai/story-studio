import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  downloadStudioDataBackup,
  readStudioDataBackupFile,
} from './backupFile'

describe('studio data backup files', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('downloads a backup and releases its object URL', () => {
    const click = vi.fn()
    const remove = vi.fn()
    const append = vi.fn()
    const link = {
      click,
      download: '',
      hidden: false,
      href: '',
      remove,
    }
    const createObjectURL = vi.fn().mockReturnValue('blob:backup')
    const revokeObjectURL = vi.fn()

    vi.stubGlobal('document', {
      body: { append },
      createElement: vi.fn().mockReturnValue(link),
    })
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })

    downloadStudioDataBackup({
      fileName: 'story-studio-backup.json',
      mimeType: 'application/json',
      content: '{"schemaVersion":13}',
    })

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(link.href).toBe('blob:backup')
    expect(link.download).toBe('story-studio-backup.json')
    expect(append).toHaveBeenCalledWith(link)
    expect(click).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:backup')
  })

  it('reads UTF-8 backup file content', async () => {
    const file = new File(['{"title":"备份"}'], 'backup.json', {
      type: 'application/json',
    })

    await expect(readStudioDataBackupFile(file)).resolves.toBe('{"title":"备份"}')
  })
})
