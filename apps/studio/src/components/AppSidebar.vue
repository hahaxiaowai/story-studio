<script setup lang="ts">
import {
  BookOpenIcon,
  BotIcon,
  FolderIcon,
  MapIcon,
  PenLineIcon,
  UsersIcon,
} from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useLocale } from '@/composables/useLocale'
import NavMain from './NavMain.vue'
import NavProjects from './NavProjects.vue'
import NavUser from './NavUser.vue'
import TeamSwitcher from './TeamSwitcher.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from './ui/sidebar'

const { t } = useLocale()
const currentHash = ref(readHash())

const workspaceActiveHashes = {
  content: ['#content', '#manuscript'],
  outline: ['#outline'],
  characters: ['#cast', '#characters'],
  world: ['#maps', '#world-settings', '#world-map'],
} as const

function readHash(): string {
  if (typeof window === 'undefined')
    return '#manuscript'

  return window.location.hash || '#manuscript'
}

function syncHash(): void {
  currentHash.value = readHash()
}

function isHashActive(hashes: readonly string[]): boolean {
  return hashes.includes(currentHash.value)
}

onMounted(() => {
  syncHash()
  window.addEventListener('hashchange', syncHash)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncHash)
})

const navMain = computed(() => [
  {
    title: t('nav.outline'),
    url: '#outline',
    icon: BookOpenIcon,
    isActive: isHashActive(workspaceActiveHashes.outline),
    items: [
      {
        title: t('nav.acts'),
        url: '#outline',
      },
      {
        title: t('nav.chapters'),
        url: '#outline',
      },
    ],
  },
  {
    title: t('nav.characters'),
    url: '#cast',
    icon: UsersIcon,
    isActive: isHashActive(workspaceActiveHashes.characters),
    items: [
      {
        title: t('nav.characters'),
        url: '#cast',
      },
      {
        title: t('nav.relationships'),
        url: '#cast',
      },
    ],
  },
  {
    title: t('nav.world'),
    url: '#world-settings',
    icon: MapIcon,
    isActive: isHashActive(workspaceActiveHashes.world),
    items: [
      {
        title: t('nav.worldSettings'),
        url: '#world-settings',
      },
      {
        title: t('nav.worldMap'),
        url: '#world-map',
      },
    ],
  },
  {
    title: t('nav.content'),
    url: '#manuscript',
    icon: PenLineIcon,
    isActive: isHashActive(workspaceActiveHashes.content),
    items: [
      {
        title: t('nav.manuscript'),
        url: '#manuscript',
      },
      {
        title: t('nav.chapters'),
        url: '#manuscript',
      },
    ],
  },
])

const projects = computed(() => [
  {
    name: t('nav.materials'),
    url: '#materials',
    icon: FolderIcon,
    isActive: currentHash.value === '#materials',
  },
  {
    name: t('nav.assistant'),
    url: '#assistant',
    icon: BotIcon,
    isActive: currentHash.value === '#assistant',
  },
])
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <TeamSwitcher />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
      <NavProjects :projects="projects" :show-actions="false" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
