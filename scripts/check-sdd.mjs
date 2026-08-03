import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const SDD_STATUSES = [
  '待确认',
  '已确认',
  '执行中',
  '待验证',
  '待评审',
  '已完成',
  '暂缓',
]

const ACTIVE_STATUSES = new Set(['执行中', '待验证', '待评审'])
const COMPLETION_VALUES = new Set(['updated', 'not-needed'])
const REQUIRED_FIELDS = ['id', 'status', 'risk', 'spec', 'updated']

function normalizePath(path) {
  return path.replaceAll('\\', '/')
}

export function parseFrontmatter(source) {
  if (!source.startsWith('---\n'))
    return undefined

  const end = source.indexOf('\n---\n', 4)
  if (end === -1)
    return undefined

  const metadata = {}
  for (const line of source.slice(4, end).split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1)
      continue
    metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return metadata
}

function listMarkdownFiles(directory) {
  if (!existsSync(directory))
    return []

  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? listMarkdownFiles(path) : path.endsWith('.md') ? [path] : []
  })
}

function extractCurrentValue(source, label) {
  return source.match(new RegExp(`^- ${label}：(.+)$`, 'm'))?.[1].trim()
}

function extractMarkdownTarget(value) {
  return value?.match(/\]\(([^)]+)\)/)?.[1]
}

function findTodoRow(todoSource, planName) {
  return todoSource.split('\n').find(line => line.startsWith('|') && line.includes(`](${`./${planName}`})`))
}

function validateLinks(root, files, errors) {
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0]
      if (!target || /^(?:https?:|mailto:)/.test(target))
        continue
      const resolved = resolve(dirname(file), target)
      if (!existsSync(resolved))
        errors.push(`${normalizePath(relative(root, file))}: 链接目标不存在 ${target}`)
    }
  }
}

export function checkSdd(root) {
  const errors = []
  const managedPlans = listMarkdownFiles(join(root, 'docs/plans'))
    .filter(path => !path.endsWith('/TODO.md') && !path.endsWith('/_template.md'))
    .map(path => ({ path, source: readFileSync(path, 'utf8') }))
    .map(plan => ({ ...plan, metadata: parseFrontmatter(plan.source) }))
    .filter(plan => plan.metadata?.sdd === 'true')

  const ids = new Set()
  for (const plan of managedPlans) {
    const label = normalizePath(relative(root, plan.path))
    const metadata = plan.metadata
    for (const field of REQUIRED_FIELDS) {
      if (!metadata[field])
        errors.push(`${label}: 缺少 SDD 元数据 ${field}`)
    }
    if (metadata.id && ids.has(metadata.id))
      errors.push(`${label}: SDD id 重复 ${metadata.id}`)
    ids.add(metadata.id)

    if (metadata.status && !SDD_STATUSES.includes(metadata.status))
      errors.push(`${label}: 非法状态 ${metadata.status}`)
    if (metadata.risk && !['XS', 'S', 'M', 'L'].includes(metadata.risk))
      errors.push(`${label}: 非法风险等级 ${metadata.risk}`)
    if (metadata.spec && !existsSync(resolve(root, metadata.spec)))
      errors.push(`${label}: Spec 不存在 ${metadata.spec}`)

    const todoPath = join(dirname(plan.path), 'TODO.md')
    if (!existsSync(todoPath)) {
      errors.push(`${label}: 当月 TODO.md 不存在`)
    }
    else {
      const todoSource = readFileSync(todoPath, 'utf8')
      const row = findTodoRow(todoSource, plan.path.split('/').at(-1))
      if (!row) {
        errors.push(`${label}: 当月 TODO.md 缺少计划行`)
      }
      else {
        const cells = row.split('|').map(cell => cell.trim()).filter(Boolean)
        if (cells[1] !== metadata.status)
          errors.push(`${label}: Plan 状态 ${metadata.status} 与 TODO 状态 ${cells[1]} 不一致`)
        const completedHeading = todoSource.indexOf('## 已完成记录')
        const rowIndex = todoSource.indexOf(row)
        if (metadata.status === '已完成' && (completedHeading === -1 || rowIndex < completedHeading))
          errors.push(`${label}: 已完成计划必须位于 TODO 的已完成记录`)
        if (metadata.status !== '已完成' && completedHeading !== -1 && rowIndex > completedHeading)
          errors.push(`${label}: 未完成计划不得位于 TODO 的已完成记录`)
      }
    }

    if (metadata.status === '已完成') {
      for (const field of ['feature', 'architecture', 'test-map', 'adr']) {
        if (!COMPLETION_VALUES.has(metadata[field]))
          errors.push(`${label}: 已完成计划必须记录 ${field}: updated | not-needed`)
      }
      if (metadata.evidence !== 'recorded')
        errors.push(`${label}: 已完成计划必须记录 evidence: recorded`)
      for (const stale of ['完成时间：未完成', '验证结果：尚未执行', '评审结果：尚未进入']) {
        if (plan.source.includes(stale))
          errors.push(`${label}: 已完成计划仍包含过期文本“${stale}”`)
      }
    }
  }

  const currentPath = join(root, 'tasks/current.md')
  if (!existsSync(currentPath)) {
    errors.push('tasks/current.md: 文件不存在')
  }
  else {
    const currentSource = readFileSync(currentPath, 'utf8')
    const currentStatus = extractCurrentValue(currentSource, '当前状态')
    const planTarget = extractMarkdownTarget(extractCurrentValue(currentSource, '当前计划'))
    if (currentStatus === '空闲') {
      if (planTarget)
        errors.push('tasks/current.md: 空闲状态不得保留当前计划链接')
      const active = managedPlans.filter(plan => ACTIVE_STATUSES.has(plan.metadata.status))
      if (active.length > 0)
        errors.push(`tasks/current.md: 空闲状态与 ${active.length} 个活动计划冲突`)
    }
    else if (planTarget) {
      const currentPlanPath = resolve(dirname(currentPath), planTarget)
      const currentPlan = managedPlans.find(plan => resolve(plan.path) === currentPlanPath)
      if (currentPlan && currentPlan.metadata.status !== currentStatus)
        errors.push(`tasks/current.md: 状态 ${currentStatus} 与 Plan 状态 ${currentPlan.metadata.status} 不一致`)
    }
  }

  const linkFiles = [currentPath, ...managedPlans.map(plan => plan.path), ...managedPlans.map(plan => resolve(root, plan.metadata.spec))]
    .filter((path, index, files) => existsSync(path) && files.indexOf(path) === index)
  validateLinks(root, linkFiles, errors)
  return { errors, managedPlanCount: managedPlans.length }
}

function main() {
  const root = resolve(process.argv[2] ?? process.cwd())
  const result = checkSdd(root)
  if (result.errors.length > 0) {
    console.error(`SDD 检查失败（${result.errors.length} 项）：`)
    for (const error of result.errors)
      console.error(`- ${error}`)
    process.exitCode = 1
    return
  }
  console.log(`SDD 检查通过：${result.managedPlanCount} 个机器可读计划。`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]))
  main()
