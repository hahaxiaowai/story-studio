<script setup lang="ts">
import { DatabaseBackupIcon, LanguagesIcon, MoonIcon, SunIcon } from '@lucide/vue'
import { computed, ref } from 'vue'
import { isLocale, useLocale } from '@/composables/useLocale'
import { useThemeMode } from '@/composables/useThemeMode'
import DataBackupDialog from './DataBackupDialog.vue'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

const { isDark, toggleThemeMode } = useThemeMode()
const { locale, localeLabel, setLocale, t } = useLocale()

const themeLabel = computed<string>(() => t(isDark.value ? 'theme.dark' : 'theme.light'))
const backupDialogOpen = ref(false)

function handleLocaleChange(value: unknown): void {
  if (typeof value === 'string' && isLocale(value))
    setLocale(value)
}
</script>

<template>
  <div class="ml-auto flex items-center gap-1 px-4">
    <Button
      variant="ghost"
      size="icon-sm"
      type="button"
      :aria-label="t('backup.open')"
      :title="t('backup.open')"
      @click="backupDialogOpen = true"
    >
      <DatabaseBackupIcon />
      <span class="sr-only">{{ t('backup.open') }}</span>
    </Button>

    <Button
      variant="ghost"
      size="icon-sm"
      type="button"
      :aria-label="themeLabel"
      :title="themeLabel"
      @click="toggleThemeMode"
    >
      <component :is="isDark ? SunIcon : MoonIcon" />
      <span class="sr-only">{{ themeLabel }}</span>
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          :aria-label="t('language.label')"
        >
          <LanguagesIcon data-icon="inline-start" />
          <span class="hidden sm:inline">{{ localeLabel }}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-40">
        <DropdownMenuLabel>
          {{ t('language.label') }}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          :model-value="locale"
          @update:model-value="handleLocaleChange"
        >
          <DropdownMenuRadioItem value="zh-CN">
            {{ t('language.zh') }}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en-US">
            {{ t('language.en') }}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>

    <DataBackupDialog v-model:open="backupDialogOpen" />
  </div>
</template>
