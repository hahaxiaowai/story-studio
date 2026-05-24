import type { ComputedRef } from 'vue'
import { computed, ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark'

const THEME_MODE_STORAGE_KEY = 'story-studio:theme-mode'
const DEFAULT_THEME_MODE: ThemeMode = 'light'

const themeMode = ref<ThemeMode>(readStoredThemeMode())

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
  mode: typeof themeMode
  isDark: ComputedRef<boolean>
  toggleThemeMode: () => void
} {
  const isDark = computed<boolean>(() => themeMode.value === 'dark')

  function toggleThemeMode(): void {
    themeMode.value = getNextThemeMode(themeMode.value)
  }

  return {
    mode: themeMode,
    isDark,
    toggleThemeMode,
  }
}

function readStoredThemeMode(): ThemeMode {
  if (typeof localStorage === 'undefined')
    return DEFAULT_THEME_MODE

  const storedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY)

  return isThemeMode(storedMode) ? storedMode : DEFAULT_THEME_MODE
}

watch(
  themeMode,
  (mode) => {
    if (typeof document !== 'undefined')
      applyThemeMode(mode, document.documentElement)

    if (typeof localStorage !== 'undefined')
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)
  },
  { immediate: true },
)
