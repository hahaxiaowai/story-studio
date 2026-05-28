<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import EntityWorkspace from '../entities/EntityWorkspace.vue'

const { t } = useLocale()
</script>

<template>
  <EntityWorkspace
    kind="world-setting"
    :title="t('world.settings')"
    :empty-label="t('world.settingEmpty')"
    :add-label="t('world.addSetting')"
  />
</template>
