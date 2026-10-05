import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(65)).toBe('1:05')
  })

  it('formats hours when needed', () => {
    expect(formatTime(3661)).toBe('1:01:01')
  })

  it('returns 0:00 for invalid values', () => {
    expect(formatTime(Number.NaN)).toBe('0:00')
    expect(formatTime(-3)).toBe('0:00')
  })
})
