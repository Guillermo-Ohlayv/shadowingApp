import { describe, expect, it } from 'vitest'
import { hasUsableTextTracks } from './textTracks'

describe('hasUsableTextTracks', () => {
  it('returns false for missing video or empty tracks', () => {
    expect(hasUsableTextTracks(null)).toBe(false)
    expect(hasUsableTextTracks({ textTracks: { length: 0 } as TextTrackList })).toBe(
      false,
    )
  })

  it('returns true when at least one track exists', () => {
    expect(
      hasUsableTextTracks({ textTracks: { length: 1 } as TextTrackList }),
    ).toBe(true)
  })
})
