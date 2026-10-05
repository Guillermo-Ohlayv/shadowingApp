import { describe, expect, it } from 'vitest'
import {
  isTimeOutsideLoop,
  resolveLoopEnd,
  shouldWrapLoop,
} from './segmentLoopLogic'

describe('resolveLoopEnd', () => {
  it('clamps end to duration when cue extends past video', () => {
    expect(resolveLoopEnd(120, 100)).toBe(100)
  })

  it('keeps end when within duration', () => {
    expect(resolveLoopEnd(8, 100)).toBe(8)
  })

  it('uses end when duration is unknown', () => {
    expect(resolveLoopEnd(8, 0)).toBe(8)
    expect(resolveLoopEnd(8, Number.NaN)).toBe(8)
  })
})

describe('shouldWrapLoop', () => {
  it('wraps when currentTime reaches end', () => {
    expect(shouldWrapLoop(5, 2, 5)).toBe(true)
    expect(shouldWrapLoop(5.01, 2, 5)).toBe(true)
  })

  it('does not wrap before end', () => {
    expect(shouldWrapLoop(4.99, 2, 5)).toBe(false)
  })
})

describe('isTimeOutsideLoop', () => {
  it('detects times before start or at/after end', () => {
    expect(isTimeOutsideLoop(1.5, 2, 5)).toBe(true)
    expect(isTimeOutsideLoop(5, 2, 5)).toBe(true)
    expect(isTimeOutsideLoop(3, 2, 5)).toBe(false)
  })
})
