<script setup lang="ts">
import {
  BookOpenIcon,
  BotIcon,
  FolderIcon,
  FrameIcon,
  MapIcon,
  PenLineIcon,
  SquareTerminalIcon,
  UsersIcon,
} from '@lucide/vue'
import { computed } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { sampleProject } from '@/constants/project'
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
    title: t('nav.project'),
    url: '#project',
    icon: SquareTerminalIcon,
    isActive: true,
    items: [
      {
        title: t('nav.overview'),
        url: '#project',
      },
      {
        title: t('nav.manuscript'),
        url: '#manuscript',
      },
      {
        title: t('nav.structure'),
        url: '#structure',
      },
    ],
  },
  {
    title: t('nav.outline'),
    url: '#outline',
    icon: BookOpenIcon,
    items: [
      {
        title: t('nav.acts'),
        url: '#outline',
      },
      {
        title: t('nav.chapters'),
        url: '#chapters',
      },
    ],
  },
  {
    title: t('nav.cast'),
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
    title: t('nav.assistant'),
    url: '#assistant',
    icon: BotIcon,
    items: [
      {
        title: t('assistant.prompts'),
        url: '#assistant',
      },
      {
        title: t('assistant.settings'),
        url: '#settings',
      },
    ],
  },
])

const projects = computed(() => [
  {
    name: sampleProject.title,
    url: '#project',
    icon: PenLineIcon,
  },
  {
    name: t('nav.worldBible'),
    url: '#outline',
    icon: MapIcon,
  },
  {
    name: t('nav.archive'),
    url: '#settings',
    icon: FolderIcon,
  },
  {
    name: t('nav.canvas'),
    url: '#manuscript',
    icon: FrameIcon,
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
      <NavProjects :projects="projects" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
