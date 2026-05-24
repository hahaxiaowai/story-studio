<script setup lang="ts">
import {
  BookOpenIcon,
  BotIcon,
  FolderIcon,
  MapIcon,
  PenLineIcon,
  UsersIcon,
} from '@lucide/vue'
import { computed } from 'vue'
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

const navMain = computed(() => [
  {
    title: t('nav.outline'),
    url: '#outline',
    icon: BookOpenIcon,
    isActive: true,
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
    title: t('nav.maps'),
    url: '#maps',
    icon: MapIcon,
    items: [
      {
        title: t('nav.worldBible'),
        url: '#maps',
      },
      {
        title: t('nav.structure'),
        url: '#maps',
      },
    ],
  },
  {
    title: t('nav.content'),
    url: '#manuscript',
    icon: PenLineIcon,
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
  },
  {
    name: t('nav.assistant'),
    url: '#assistant',
    icon: BotIcon,
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
