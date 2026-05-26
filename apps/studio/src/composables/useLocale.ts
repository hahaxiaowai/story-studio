import type { ComputedRef } from 'vue'
import { computed, watch } from 'vue'
import { useStudioData } from '@/modules/storage/useStudioData'

export type Locale = 'zh-CN' | 'en-US'

const zhMessages = {
  'app.name': 'Story Studio',
  'app.workspace': '工作区',
  'app.spaces': '空间',
  'assistant.prompts': '提示词',
  'assistant.settings': '设置',
  'breadcrumb.project': '工作区',
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
  'menu.openWorkspace': '打开工作区',
  'menu.rename': '重命名',
  'nav.acts': '幕',
  'nav.archive': '归档',
  'nav.assistant': '助手',
  'nav.canvas': '画布',
  'nav.cast': '角色',
  'nav.characters': '人物',
  'nav.chapters': '章节',
  'nav.content': '内容',
  'nav.group.manuscripts': '手稿',
  'nav.group.public': '公共功能',
  'nav.group.studio': '工作台',
  'nav.group.workspace': '当前工作区',
  'nav.manuscript': '正文',
  'nav.maps': '地图',
  'nav.materials': '素材',
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
  'project.content': '内容',
  'project.draft': '草稿',
  'project.empty': '空',
  'project.local': '本地',
  'project.maps': '地图',
  'project.manuscript': '正文',
  'project.outline': '大纲',
  'project.status': '状态',
  'project.structure': '结构',
  'project.sync': '同步',
  'property.add': '新增属性',
  'property.configure': '配置属性',
  'property.delete': '删除',
  'property.hidden': '隐藏',
  'property.name': '属性名',
  'property.optionHint': '选项用英文逗号分隔',
  'property.required': '必填',
  'property.save': '保存',
  'property.type': '类型',
  'property.visible': '显示',
  'character.add': '新建人物',
  'character.empty': '还没有人物',
  'character.title': '人物',
  'theme.dark': '切换到浅色模式',
  'theme.light': '切换到深色模式',
  'user.localWorkspace': '本地工作区',
  'user.writer': '写作者',
  'workspace.create.description': '填写这部作品的基础信息，创建后会自动切换到新工作区。',
  'workspace.create.title': '新建工作区',
  'workspace.form.cancel': '取消',
  'workspace.form.description': '简介',
  'workspace.form.descriptionPlaceholder': '写下作品题材、核心设定或创作方向',
  'workspace.form.name': '作品名称',
  'workspace.form.namePlaceholder': '例如：长夜手稿',
  'workspace.form.submit': '创建工作区',
  'workspace.validation.nameRequired': '请填写作品名称。',
} as const

export type MessageKey = keyof typeof zhMessages

const enMessages: Record<MessageKey, string> = {
  'app.name': 'Story Studio',
  'app.workspace': 'Workspace',
  'app.spaces': 'Spaces',
  'assistant.prompts': 'Prompts',
  'assistant.settings': 'Settings',
  'breadcrumb.project': 'Workspace',
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
  'menu.openWorkspace': 'Open workspace',
  'menu.rename': 'Rename',
  'nav.acts': 'Acts',
  'nav.archive': 'Archive',
  'nav.assistant': 'Assistant',
  'nav.canvas': 'Canvas',
  'nav.cast': 'Cast',
  'nav.characters': 'Characters',
  'nav.chapters': 'Chapters',
  'nav.content': 'Content',
  'nav.group.manuscripts': 'Manuscripts',
  'nav.group.public': 'Public',
  'nav.group.studio': 'Studio',
  'nav.group.workspace': 'Current workspace',
  'nav.manuscript': 'Manuscript',
  'nav.maps': 'Map',
  'nav.materials': 'Materials',
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
  'project.content': 'Content',
  'project.draft': 'Draft',
  'project.empty': 'Empty',
  'project.local': 'Local',
  'project.maps': 'Map',
  'project.manuscript': 'Manuscript',
  'project.outline': 'Outline',
  'project.status': 'Status',
  'project.structure': 'Structure',
  'project.sync': 'Sync',
  'property.add': 'Add property',
  'property.configure': 'Configure properties',
  'property.delete': 'Delete',
  'property.hidden': 'Hidden',
  'property.name': 'Property name',
  'property.optionHint': 'Separate options with commas',
  'property.required': 'Required',
  'property.save': 'Save',
  'property.type': 'Type',
  'property.visible': 'Visible',
  'character.add': 'New character',
  'character.empty': 'No characters yet',
  'character.title': 'Characters',
  'theme.dark': 'Switch to light mode',
  'theme.light': 'Switch to dark mode',
  'user.localWorkspace': 'local workspace',
  'user.writer': 'Writer',
  'workspace.create.description': 'Add the basic details for this work. The new workspace will become active after creation.',
  'workspace.create.title': 'New workspace',
  'workspace.form.cancel': 'Cancel',
  'workspace.form.description': 'Description',
  'workspace.form.descriptionPlaceholder': 'Add the genre, core premise, or writing direction',
  'workspace.form.name': 'Work title',
  'workspace.form.namePlaceholder': 'For example: Long Night Manuscript',
  'workspace.form.submit': 'Create workspace',
  'workspace.validation.nameRequired': 'Enter a work title.',
}

const messages: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': zhMessages,
  'en-US': enMessages,
}

export function isLocale(value: string | null): value is Locale {
  return value === 'zh-CN' || value === 'en-US'
}

export function translate(targetLocale: Locale, key: MessageKey): string {
  return messages[targetLocale][key]
}

export function useLocale(): {
  locale: ComputedRef<Locale>
  localeLabel: ComputedRef<string>
  setLocale: (nextLocale: Locale) => void
  t: (key: MessageKey) => string
} {
  const studioData = useStudioData()
  const locale = computed<Locale>(() => studioData.document.value.preferences.locale)
  const localeLabel = computed<string>(() => translate(locale.value, `language.${locale.value === 'zh-CN' ? 'zh' : 'en'}`))

  function setLocale(nextLocale: Locale): void {
    studioData.updateDocument((document) => {
      document.preferences.locale = nextLocale
    })
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

if (typeof document !== 'undefined') {
  const { locale } = useLocale()

  watch(
    locale,
    (nextLocale) => {
      document.documentElement.lang = nextLocale
    },
    { immediate: true },
  )
}
