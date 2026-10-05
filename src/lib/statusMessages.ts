import type { Cue } from '../types/subtitle'
import type { ParseSubtitlesResult } from './parseSubtitles'

export type StatusTone = 'neutral' | 'info' | 'error' | 'none'

export type StatusMessage = {
  tone: StatusTone
  message: string | null
}

/** Map a subtitle parse result to a user-facing status. */
export function describeSubtitleLoad(
  result: ParseSubtitlesResult,
): StatusMessage {
  if (!result.ok) {
    return { tone: 'error', message: result.error }
  }

  if (result.cues.length === 0) {
    return {
      tone: 'info',
      message:
        'No captions found in this file. You can still play the video without subtitles.',
    }
  }

  return { tone: 'none', message: null }
}

/** Safe cue lookup — never assumes the list is non-empty. */
export function safeFindCue(cues: Cue[], id: string): Cue | null {
  if (!Array.isArray(cues) || cues.length === 0) {
    return null
  }

  return cues.find((cue) => cue.id === id) ?? null
}

/** Combine video/subtitle statuses with error-first priority. */
export function summarizeAppStatus(input: {
  videoError: string | null
  subtitleError: string | null
  subtitleInfo: string | null
}): StatusMessage {
  if (input.videoError) {
    return { tone: 'error', message: input.videoError }
  }

  if (input.subtitleError) {
    return { tone: 'error', message: input.subtitleError }
  }

  if (input.subtitleInfo) {
    return { tone: 'info', message: input.subtitleInfo }
  }

  return {
    tone: 'neutral',
    message:
      'Load a video to begin. Subtitles are optional — missing captions will not crash the app.',
  }
}
