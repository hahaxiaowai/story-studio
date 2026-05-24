import { describe, expect, it } from 'vitest'
import { createSlug } from './slug'

describe('createSlug', () => {
  it('normalizes story titles into route-safe slugs', () => {
    expect(createSlug('  A Tale: Chapter One!  ')).toBe('a-tale-chapter-one')
  })
})
