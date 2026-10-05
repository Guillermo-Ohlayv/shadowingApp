import { describe, expect, it } from 'vitest'
import { isBenignPlayError, messageForPlayError } from './playbackErrors'
import { parseFfmpegHasSubtitleStream } from './ffmpegProbe'

describe('isBenignPlayError', () => {
  it('treats AbortError as benign', () => {
    expect(isBenignPlayError(new DOMException('aborted', 'AbortError'))).toBe(
      true,
    )
  })

  it('treats other errors as real failures', () => {
    expect(isBenignPlayError(new DOMException('denied', 'NotAllowedError'))).toBe(
      false,
    )
    expect(isBenignPlayError(new Error('boom'))).toBe(false)
  })
})

describe('messageForPlayError', () => {
  it('returns null for benign errors', () => {
    expect(
      messageForPlayError(new DOMException('aborted', 'AbortError')),
    ).toBeNull()
  })

  it('explains NotAllowedError', () => {
    expect(
      messageForPlayError(new DOMException('denied', 'NotAllowedError')),
    ).toMatch(/Play again/i)
  })
})

describe('parseFfmpegHasSubtitleStream', () => {
  it('detects subtitle streams in ffmpeg logs', () => {
    const log = `
Stream #0:0: Video: h264
Stream #0:1: Audio: aac
Stream #0:2(eng): Subtitle: subrip
`
    expect(parseFfmpegHasSubtitleStream(log)).toBe(true)
  })

  it('returns false when no subtitle stream is present', () => {
    const log = `
Stream #0:0: Video: h264
Stream #0:1: Audio: ac3
`
    expect(parseFfmpegHasSubtitleStream(log)).toBe(false)
  })
})
