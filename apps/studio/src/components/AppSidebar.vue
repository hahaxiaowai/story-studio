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

const navMain = [
  {
    title: 'Project',
    url: '#project',
    icon: SquareTerminalIcon,
    isActive: true,
    items: [
      {
        title: 'Overview',
        url: '#project',
      },
      {
        title: 'Manuscript',
        url: '#manuscript',
      },
      {
        title: 'Structure',
        url: '#structure',
      },
    ],
  },
  {
    title: 'Outline',
    url: '#outline',
    icon: BookOpenIcon,
    items: [
      {
        title: 'Acts',
        url: '#outline',
      },
      {
        title: 'Scenes',
        url: '#chapters',
      },
    ],
  },
  {
    title: 'Cast',
    url: '#cast',
    icon: UsersIcon,
    items: [
      {
        title: 'Characters',
        url: '#cast',
      },
      {
        title: 'Relationships',
        url: '#cast',
      },
    ],
  },
  {
    title: 'Assistant',
    url: '#assistant',
    icon: BotIcon,
    items: [
      {
        title: 'Prompts',
        url: '#assistant',
      },
      {
        title: 'Settings',
        url: '#settings',
      },
    ],
  },
]

const projects = [
  {
    name: sampleProject.title,
    url: '#project',
    icon: PenLineIcon,
  },
  {
    name: 'World bible',
    url: '#outline',
    icon: MapIcon,
  },
  {
    name: 'Archive',
    url: '#settings',
    icon: FolderIcon,
  },
  {
    name: 'Canvas',
    url: '#manuscript',
    icon: FrameIcon,
  },
]
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
