import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { it } from 'vitest'
import { checkSdd, parseFrontmatter } from './check-sdd.mjs'

function createFixture({ planStatus = '已完成', todoStatus = planStatus, currentStatus = '空闲', completed = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'story-studio-sdd-'))
  mkdirSync(join(root, 'docs/plans/2026-08'), { recursive: true })
  mkdirSync(join(root, 'docs/specs'), { recursive: true })
  mkdirSync(join(root, 'tasks'), { recursive: true })
  writeFileSync(join(root, 'docs/specs/example.md'), '# Example\n')
  writeFileSync(join(root, 'docs/plans/2026-08/example.md'), `---
sdd: true
id: example
status: ${planStatus}
risk: S
spec: docs/specs/example.md
updated: 2026-08-03
feature: not-needed
architecture: not-needed
test-map: not-needed
adr: not-needed
evidence: recorded
---
# Example

## 完成记录

- 完成时间：2026-08-03
- 验证结果：通过
`)
  const activeSection = completed ? '无。' : `| Example | ${todoStatus} | P1 | [example.md](./example.md) | 2026-08-03 | 继续 |`
  const completedSection = completed ? `| Example | ${todoStatus} | P1 | [example.md](./example.md) | 2026-08-03 | 无 |` : '无。'
  writeFileSync(join(root, 'docs/plans/2026-08/TODO.md'), `# TODO

## 当前任务

${activeSection}

## 已完成记录

${completedSection}
`)
  writeFileSync(join(root, 'tasks/current.md'), currentStatus === '空闲'
    ? '# 当前主要任务\n\n- 当前状态：空闲\n'
    : `# 当前主要任务\n\n- 当前状态：${currentStatus}\n- 当前计划：[example](../docs/plans/2026-08/example.md)\n`)
  return root
}

it('parses machine-readable plan metadata', () => {
  assert.deepEqual(parseFrontmatter('---\nsdd: true\nstatus: 执行中\n---\n# Plan\n'), {
    sdd: 'true',
    status: '执行中',
  })
})

it('accepts a completed and closed plan', () => {
  const result = checkSdd(createFixture())
  assert.deepEqual(result.errors, [])
})

it('rejects drift between plan and monthly index', () => {
  const result = checkSdd(createFixture({ todoStatus: '待评审' }))
  assert.ok(result.errors.some(error => error.includes('与 TODO 状态')))
})

it('rejects an idle current pointer while a plan is active', () => {
  const result = checkSdd(createFixture({ planStatus: '执行中', todoStatus: '执行中', completed: false }))
  assert.ok(result.errors.some(error => error.includes('空闲状态')))
})

it('rejects completed plans without recorded evidence', () => {
  const root = createFixture()
  const planPath = join(root, 'docs/plans/2026-08/example.md')
  writeFileSync(planPath, readFileSync(planPath, 'utf8').replace('evidence: recorded', 'evidence: pending'))

  const result = checkSdd(root)
  assert.ok(result.errors.some(error => error.includes('evidence: recorded')))
})
