<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import SidebarLayout from './layouts/SidebarLayout.vue'
import { useAutomaticBackup } from './modules/storage/useAutomaticBackup'
import ProjectPage from './pages/project/index.vue'

const automaticBackup = useAutomaticBackup()

onMounted(() => void automaticBackup.start())
onUnmounted(() => automaticBackup.stop())
</script>

<template>
  <SidebarLayout>
    <ProjectPage />
  </SidebarLayout>
</template>
