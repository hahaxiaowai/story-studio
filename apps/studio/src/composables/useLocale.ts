import type { ComputedRef } from 'vue'
import { computed, ref, watch } from 'vue'

export type Locale = 'zh-CN' | 'en-US'

const LOCALE_STORAGE_KEY = 'story-studio:locale'
const DEFAULT_LOCALE: Locale = 'zh-CN'

const zhMessages = {
  'app.name': 'Story Studio',
  'app.workspace': '工作区',
  'app.spaces': '空间',
  'assistant.prompts': '提示词',
  'assistant.settings': '设置',
  'breadcrumb.project': '项目',
  'language.en': 'English',
  'language.label': '语言',
  'language.zh': '中文',
  'menu.account': '账户',
  'menu.archive': '归档',
  'menu.logout': '退出登录',
  'menu.more': '更多',
  'menu.newWorkspace': '新建工作区',
  'menu.notifications': '通知',
  'menu.openProject': '打开项目',
  'menu.rename': '重命名',
  'nav.acts': '幕',
  'nav.archive': '归档',
  'nav.assistant': '助手',
  'nav.canvas': '画布',
  'nav.cast': '角色',
  'nav.characters': '人物',
  'nav.chapters': '章节',
  'nav.group.manuscripts': '手稿',
  'nav.group.studio': '工作台',
  'nav.manuscript': '正文',
  'nav.outline': '大纲',
  'nav.overview': '概览',
  'nav.project': '项目',
  'nav.relationships': '关系',
  'nav.structure': '结构',
  'nav.worldBible': '世界设定',
  'project.aria.draftSurface': '草稿页面',
  'project.aria.inspector': '项目检查器',
  'project.aria.overview': '项目概览',
  'project.aria.workspace': 'Story Studio 工作区',
  'project.cast': '角色',
  'project.chapterOne': '第一章',
  'project.chapters': '章节',
  'project.draft': '草稿',
  'project.empty': '空',
  'project.local': '本地',
  'project.manuscript': '正文',
  'project.outline': '大纲',
  'project.status': '状态',
  'project.structure': '结构',
  'project.sync': '同步',
  'theme.dark': '切换到浅色模式',
  'theme.light': '切换到深色模式',
  'user.localWorkspace': '本地工作区',
  'user.writer': '写作者',
} as const

export type MessageKey = keyof typeof zhMessages

const enMessages: Record<MessageKey, string> = {
  'app.name': 'Story Studio',
  'app.workspace': 'Workspace',
  'app.spaces': 'Spaces',
  'assistant.prompts': 'Prompts',
  'assistant.settings': 'Settings',
  'breadcrumb.project': 'Project',
  'language.en': 'English',
  'language.label': 'Language',
  'language.zh': '中文',
  'menu.account': 'Account',
  'menu.archive': 'Archive',
  'menu.logout': 'Log out',
  'menu.more': 'More',
  'menu.newWorkspace': 'New workspace',
  'menu.notifications': 'Notifications',
  'menu.openProject': 'Open project',
  'menu.rename': 'Rename',
  'nav.acts': 'Acts',
  'nav.archive': 'Archive',
  'nav.assistant': 'Assistant',
  'nav.canvas': 'Canvas',
  'nav.cast': 'Cast',
  'nav.characters': 'Characters',
  'nav.chapters': 'Chapters',
  'nav.group.manuscripts': 'Manuscripts',
  'nav.group.studio': 'Studio',
  'nav.manuscript': 'Manuscript',
  'nav.outline': 'Outline',
  'nav.overview': 'Overview',
  'nav.project': 'Project',
  'nav.relationships': 'Relationships',
  'nav.structure': 'Structure',
  'nav.worldBible': 'World bible',
  'project.aria.draftSurface': 'Draft surface',
  'project.aria.inspector': 'Project inspector',
  'project.aria.overview': 'Project overview',
  'project.aria.workspace': 'Story Studio workspace',
  'project.cast': 'Cast',
  'project.chapterOne': 'Chapter One',
  'project.chapters': 'Chapters',
  'project.draft': 'Draft',
  'project.empty': 'Empty',
  'project.local': 'Local',
  'project.manuscript': 'Manuscript',
  'project.outline': 'Outline',
  'project.status': 'Status',
  'project.structure': 'Structure',
  'project.sync': 'Sync',
  'theme.dark': 'Switch to light mode',
  'theme.light': 'Switch to dark mode',
  'user.localWorkspace': 'local workspace',
  'user.writer': 'Writer',
}

const messages: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': zhMessages,
  'en-US': enMessages,
}

const locale = ref<Locale>(readStoredLocale())

export function isLocale(value: string | null): value is Locale {
  return value === 'zh-CN' || value === 'en-US'
}

export function translate(targetLocale: Locale, key: MessageKey): string {
  return messages[targetLocale][key]
}

export function useLocale(): {
  locale: typeof locale
  localeLabel: ComputedRef<string>
  setLocale: (nextLocale: Locale) => void
  t: (key: MessageKey) => string
} {
  const localeLabel = computed<string>(() => translate(locale.value, `language.${locale.value === 'zh-CN' ? 'zh' : 'en'}`))

  function setLocale(nextLocale: Locale): void {
    locale.value = nextLocale
  }

  function t(key: MessageKey): string {
    return translate(locale.value, key)
  }

  return {
    locale,
    localeLabel,
    setLocale,
    t,
  }
}

function readStoredLocale(): Locale {
  if (typeof localStorage === 'undefined')
    return DEFAULT_LOCALE

  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)

  return isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE
}

watch(
  locale,
  (nextLocale) => {
    if (typeof document !== 'undefined')
      document.documentElement.lang = nextLocale

    if (typeof localStorage !== 'undefined')
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
  },
  { immediate: true },
)
