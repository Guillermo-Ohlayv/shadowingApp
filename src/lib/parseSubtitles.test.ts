import { describe, expect, it } from 'vitest'
import { parseSubtitles } from './parseSubtitles'

describe('parseSubtitles', () => {
  it('returns empty cues for empty content', () => {
    expect(parseSubtitles('')).toEqual({ ok: true, cues: [] })
    expect(parseSubtitles('   \n\t  ')).toEqual({ ok: true, cues: [] })
  })

  it('parses a valid .srt file', () => {
    const content = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,500 --> 00:00:07,000
Second line
`

    const result = parseSubtitles(content, { filename: 'demo.srt' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cues).toHaveLength(2)
    expect(result.cues[0]).toMatchObject({
      start: 1,
      end: 4,
      text: 'Hello world',
    })
    expect(result.cues[1]).toMatchObject({
      start: 5.5,
      end: 7,
      text: 'Second line',
    })
    expect(result.cues[0]?.id).toBeTruthy()
    expect(result.cues[1]?.id).not.toBe(result.cues[0]?.id)
  })

  it('parses a valid .vtt file', () => {
    const content = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello from vtt

00:01:00.250 --> 00:01:02.000
Later cue
`

    const result = parseSubtitles(content, { filename: 'demo.vtt' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cues).toEqual([
      expect.objectContaining({
        start: 1,
        end: 4,
        text: 'Hello from vtt',
      }),
      expect.objectContaining({
        start: 60.25,
        end: 62,
        text: 'Later cue',
      }),
    ])
  })

  it('handles CRLF and UTF-8 BOM', () => {
    const content =
      '\uFEFF1\r\n00:00:00,500 --> 00:00:01,500\r\nLine one\r\n\r\n'

    const result = parseSubtitles(content, { filename: 'crlf.srt' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cues).toEqual([
      expect.objectContaining({
        start: 0.5,
        end: 1.5,
        text: 'Line one',
      }),
    ])
  })

  it('keeps overlapping cues', () => {
    const content = `1
00:00:01,000 --> 00:00:05,000
First

2
00:00:03,000 --> 00:00:06,000
Overlap
`

    const result = parseSubtitles(content, { filename: 'overlap.srt' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.cues).toHaveLength(2)
  })

  it('skips malformed cues but keeps valid ones', () => {
    const content = `1
not a timestamp
Broken

2
00:00:02,000 --> 00:00:03,000
Good cue
`

    const result = parseSubtitles(content, { filename: 'partial.srt' })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.cues).toEqual([
      expect.objectContaining({
        start: 2,
        end: 3,
        text: 'Good cue',
      }),
    ])
  })

  it('joins multi-line cue text', () => {
    const content = `WEBVTT

00:00:01.000 --> 00:00:02.000
Hello
world
`

    const result = parseSubtitles(content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.cues[0]?.text).toBe('Hello\nworld')
  })

  it('returns an error for non-empty invalid files', () => {
    const result = parseSubtitles('this is not a subtitle file', {
      filename: 'bad.srt',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.length).toBeGreaterThan(0)
  })

  it('returns empty cues for WEBVTT with no cues', () => {
    expect(parseSubtitles('WEBVTT\n\n')).toEqual({ ok: true, cues: [] })
  })
})
