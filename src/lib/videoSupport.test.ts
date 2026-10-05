import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  canPlayVideoType,
  isSupportedVideoFile,
  resolveVideoMimeType,
} from './videoSupport'

describe('resolveVideoMimeType', () => {
  it('returns the file MIME type when present', () => {
    expect(
      resolveVideoMimeType({ name: 'clip.bin', type: 'video/webm' }),
    ).toBe('video/webm')
  })

  it('infers video/mp4 from .mp4 extension when type is empty', () => {
    expect(resolveVideoMimeType({ name: 'lesson.MP4', type: '' })).toBe(
      'video/mp4',
    )
  })

  it('infers video/webm from .webm extension when type is empty', () => {
    expect(resolveVideoMimeType({ name: 'clip.webm', type: '' })).toBe(
      'video/webm',
    )
  })

  it('returns empty string for unknown types', () => {
    expect(resolveVideoMimeType({ name: 'movie.xyz', type: '' })).toBe('')
  })
})

describe('canPlayVideoType', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'document',
      {
        createElement: () => ({
          canPlayType: (type: string) =>
            type === 'video/mp4' || type === 'video/webm' ? 'probably' : '',
        }),
      } as unknown as Document,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when browser reports support', () => {
    expect(canPlayVideoType('video/mp4')).toBe(true)
  })

  it('returns false when browser reports no support', () => {
    expect(canPlayVideoType('video/x-matroska')).toBe(false)
  })
})

describe('isSupportedVideoFile', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'document',
      {
        createElement: () => ({
          canPlayType: (type: string) =>
            type === 'video/mp4' || type === 'video/webm' ? 'probably' : '',
        }),
      } as unknown as Document,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('accepts browser-supported mp4 files', () => {
    expect(isSupportedVideoFile({ name: 'a.mp4', type: 'video/mp4' })).toBe(
      true,
    )
  })

  it('rejects unsupported extensions even if named oddly', () => {
    expect(isSupportedVideoFile({ name: 'a.xyz', type: '' })).toBe(false)
  })
})
