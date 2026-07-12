import type { StudioDataBackupFile } from './backup'

export function downloadStudioDataBackup(backup: StudioDataBackupFile): void {
  const blob = new Blob([backup.content], { type: backup.mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = url
    link.download = backup.fileName
    link.hidden = true
    document.body.append(link)
    link.click()
  }
  finally {
    link.remove()
    URL.revokeObjectURL(url)
  }
}

export async function readStudioDataBackupFile(file: File): Promise<string> {
  return file.text()
}
