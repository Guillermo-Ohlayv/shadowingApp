import { describe, expect, it } from 'vitest'
import { findActiveCue } from './cueSync'
import type { Cue } from '../types/subtitle'

const cues: Cue[] = [
  { id: 'a', start: 1, end: 3, text: 'one' },
  { id: 'b', start: 3, end: 5, text: 'two' },
  { id: 'c', start: 4, end: 6, text: 'overlap' },
]

describe('findActiveCue', () => {
  it('returns null when there are no cues', () => {
    expect(findActiveCue([], 1)).toBeNull()
  })

  it('returns null when currentTime is outside all cues', () => {
    expect(findActiveCue(cues, 0.5)).toBeNull()
    expect(findActiveCue(cues, 10)).toBeNull()
  })

  it('returns the matching cue for currentTime', () => {
    expect(findActiveCue(cues, 2)?.id).toBe('a')
    expect(findActiveCue(cues, 3)?.id).toBe('b')
  })

  it('prefers the latest-starting cue when overlapping', () => {
    expect(findActiveCue(cues, 4.5)?.id).toBe('c')
  })

  it('treats end as exclusive', () => {
    expect(findActiveCue([{ id: 'x', start: 1, end: 2, text: 'x' }], 2)).toBeNull()
  })
})
