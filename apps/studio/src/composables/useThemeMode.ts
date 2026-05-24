import type { ComputedRef } from 'vue'
import { computed, watch } from 'vue'
import { useStudioData } from '@/modules/storage/useStudioData'

export type ThemeMode = 'light' | 'dark'

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

export function getNextThemeMode(mode: ThemeMode): ThemeMode {
  return mode === 'light' ? 'dark' : 'light'
}

export function applyThemeMode(mode: ThemeMode, root?: HTMLElement): void {
  root?.classList.toggle('dark', mode === 'dark')
}

export function useThemeMode(): {
  mode: ComputedRef<ThemeMode>
  isDark: ComputedRef<boolean>
  toggleThemeMode: () => void
} {
  const studioData = useStudioData()
  const themeMode = computed<ThemeMode>(() => studioData.document.value.preferences.themeMode)
  const isDark = computed<boolean>(() => themeMode.value === 'dark')

  function toggleThemeMode(): void {
    studioData.updateDocument((document) => {
      document.preferences.themeMode = getNextThemeMode(document.preferences.themeMode)
    })
  }

  return {
    mode: themeMode,
    isDark,
    toggleThemeMode,
  }
}

if (typeof document !== 'undefined') {
  const { mode } = useThemeMode()

  watch(
    mode,
    (nextMode) => {
      applyThemeMode(nextMode, document.documentElement)
    },
    { immediate: true },
  )
}
