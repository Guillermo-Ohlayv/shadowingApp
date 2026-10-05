import type { Cue } from '../types/subtitle'

export type ParseSubtitlesOptions = {
  filename?: string
}

export type ParseSubtitlesResult =
  | { ok: true; cues: Cue[] }
  | { ok: false; error: string }

const TIMESTAMP_RE =
  /^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})\s*-->\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})/

function stripBom(content: string): string {
  return content.replace(/^\uFEFF/, '')
}

function normalizeNewlines(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function hasTimestampLine(content: string): boolean {
  return content.split('\n').some((line) => TIMESTAMP_RE.test(line.trim()))
}

function padMillis(value: string): number {
  return Number(value.padEnd(3, '0').slice(0, 3))
}

function toSeconds(
  hours: string | undefined,
  minutes: string,
  seconds: string,
  millis: string,
): number {
  const h = hours ? Number(hours) : 0
  return h * 3600 + Number(minutes) * 60 + Number(seconds) + padMillis(millis) / 1000
}

function detectFormat(
  content: string,
  filename?: string,
): 'srt' | 'vtt' | 'unknown' {
  const lowerName = filename?.toLowerCase() ?? ''
  if (lowerName.endsWith('.vtt')) return 'vtt'
  if (lowerName.endsWith('.srt')) return 'srt'
  if (/^WEBVTT\b/i.test(content.trimStart())) return 'vtt'
  if (hasTimestampLine(content)) return 'srt'
  return 'unknown'
}

function parseTimestampLine(line: string): { start: number; end: number } | null {
  const match = line.trim().match(TIMESTAMP_RE)
  if (!match) return null

  const start = toSeconds(match[1], match[2]!, match[3]!, match[4]!)
  const end = toSeconds(match[5], match[6]!, match[7]!, match[8]!)

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null
  }

  return { start, end }
}

function isSkippableMetaLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return true
  if (/^WEBVTT\b/i.test(trimmed)) return true
  if (/^(NOTE|STYLE|REGION)\b/i.test(trimmed)) return true
  if (/^\d+$/.test(trimmed)) return true // SRT index / VTT cue id numbers
  if (trimmed.includes('-->')) return false
  // VTT cue identifiers (non-timing)
  return !TIMESTAMP_RE.test(trimmed)
}

/**
 * Parse .srt / .vtt text into normalized Cue[].
 * Empty input → empty cues. Non-empty garbage → error result.
 * Never throws — malformed input always returns a result object.
 */
export function parseSubtitles(
  rawContent: string,
  options: ParseSubtitlesOptions = {},
): ParseSubtitlesResult {
  try {
    return parseSubtitlesUnsafe(rawContent, options)
  } catch {
    return {
      ok: false,
      error: 'Could not parse subtitle file. The file may be corrupted or unsupported.',
    }
  }
}

function parseSubtitlesUnsafe(
  rawContent: string,
  options: ParseSubtitlesOptions,
): ParseSubtitlesResult {
  const content = normalizeNewlines(stripBom(rawContent))
  const trimmed = content.trim()

  if (!trimmed) {
    return { ok: true, cues: [] }
  }

  if (/^WEBVTT\b/i.test(trimmed) && !hasTimestampLine(content)) {
    return { ok: true, cues: [] }
  }

  const format = detectFormat(content, options.filename)
  if (format === 'unknown' && !hasTimestampLine(content)) {
    return {
      ok: false,
      error: 'Could not parse subtitle file. Expected a valid .srt or .vtt file.',
    }
  }

  const lines = content.split('\n')
  const cues: Cue[] = []
  let index = 0

  while (index < lines.length) {
    let line = lines[index] ?? ''

    while (index < lines.length && isSkippableMetaLine(line) && !line.includes('-->')) {
      index += 1
      line = lines[index] ?? ''
    }

    if (index >= lines.length) break

    // Optional cue identifier before timing line (VTT)
    if (!line.includes('-->') && index + 1 < lines.length) {
      const maybeTiming = lines[index + 1] ?? ''
      if (maybeTiming.includes('-->')) {
        index += 1
        line = maybeTiming
      }
    }

    const timing = parseTimestampLine(line)
    if (!timing) {
      index += 1
      continue
    }

    index += 1
    const textLines: string[] = []
    while (index < lines.length) {
      const textLine = lines[index] ?? ''
      if (textLine.trim() === '') break
      if (textLine.includes('-->')) break
      textLines.push(textLine)
      index += 1
    }

    const text = textLines.join('\n').trim()
    if (text) {
      cues.push({
        id: `cue-${cues.length + 1}`,
        start: timing.start,
        end: timing.end,
        text,
      })
    }

    while (index < lines.length && (lines[index] ?? '').trim() === '') {
      index += 1
    }
  }

  if (cues.length === 0) {
    return {
      ok: false,
      error: 'Could not parse subtitle file. No valid cues were found.',
    }
  }

  return { ok: true, cues }
}
