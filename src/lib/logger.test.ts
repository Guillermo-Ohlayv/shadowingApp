import { describe, expect, it } from 'vitest'
import { formatLogPrefix } from './logger'

describe('formatLogPrefix', () => {
  it('includes app name, scope, and level', () => {
    expect(formatLogPrefix('video', 'error')).toBe('[Shadowing:video:error]')
    expect(formatLogPrefix('ffmpeg', 'info')).toBe('[Shadowing:ffmpeg:info]')
  })
})
