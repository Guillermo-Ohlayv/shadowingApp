import { describe, expect, it } from 'vitest'
import {
  describeSubtitleLoad,
  safeFindCue,
  summarizeAppStatus,
} from './statusMessages'
import type { Cue } from '../types/subtitle'

describe('describeSubtitleLoad', () => {
  it('reports info when a file has zero cues', () => {
    expect(describeSubtitleLoad({ ok: true, cues: [] })).toEqual({
      tone: 'info',
      message:
        'No captions found in this file. You can still play the video without subtitles.',
    })
  })

  it('reports success with no status message when cues exist', () => {
    const cues: Cue[] = [{ id: '1', start: 0, end: 1, text: 'hi' }]
    expect(describeSubtitleLoad({ ok: true, cues })).toEqual({
      tone: 'none',
      message: null,
    })
  })

  it('reports parse errors', () => {
    expect(
      describeSubtitleLoad({ ok: false, error: 'Could not parse subtitle file.' }),
    ).toEqual({
      tone: 'error',
      message: 'Could not parse subtitle file.',
    })
  })
})

describe('safeFindCue', () => {
  it('returns null for missing ids or empty lists', () => {
    expect(safeFindCue([], 'x')).toBeNull()
    expect(safeFindCue([{ id: 'a', start: 0, end: 1, text: 'a' }], 'b')).toBeNull()
  })

  it('returns the matching cue when present', () => {
    const cues: Cue[] = [{ id: 'a', start: 0, end: 1, text: 'a' }]
    expect(safeFindCue(cues, 'a')?.text).toBe('a')
  })
})

describe('summarizeAppStatus', () => {
  it('prefers errors over info', () => {
    expect(
      summarizeAppStatus({
        videoError: 'bad video',
        subtitleError: 'bad subs',
        subtitleInfo: 'no captions',
      }),
    ).toEqual({ tone: 'error', message: 'bad video' })
  })

  it('shows subtitle info when there is no error', () => {
    expect(
      summarizeAppStatus({
        videoError: null,
        subtitleError: null,
        subtitleInfo: 'no captions',
      }),
    ).toEqual({ tone: 'info', message: 'no captions' })
  })

  it('falls back to idle guidance', () => {
    expect(
      summarizeAppStatus({
        videoError: null,
        subtitleError: null,
        subtitleInfo: null,
      }),
    ).toEqual({
      tone: 'neutral',
      message:
        'Load a video to begin. Subtitles are optional — missing captions will not crash the app.',
    })
  })
})
