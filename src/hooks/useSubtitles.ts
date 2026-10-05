import { useCallback, useState } from 'react'
import { log } from '../lib/logger'
import { parseSubtitles } from '../lib/parseSubtitles'
import { describeSubtitleLoad } from '../lib/statusMessages'
import type { Cue } from '../types/subtitle'

export type UseSubtitlesResult = {
  cues: Cue[]
  fileName: string | null
  error: string | null
  info: string | null
  loadSubtitles: (file: File) => Promise<void>
  loadSubtitleText: (content: string, filename: string) => void
  clearSubtitles: () => void
  clearError: () => void
}

function isSubtitleFilename(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.endsWith('.srt') || lower.endsWith('.vtt')
}

function applyParseResult(
  result: ReturnType<typeof parseSubtitles>,
  filename: string,
  setters: {
    setCues: (cues: Cue[]) => void
    setFileName: (name: string | null) => void
    setError: (error: string | null) => void
    setInfo: (info: string | null) => void
  },
) {
  const status = describeSubtitleLoad(result)

  if (!result.ok) {
    log.subtitles.error('parse failed', { filename, error: result.error })
    setters.setCues([])
    setters.setFileName(null)
    setters.setInfo(null)
    setters.setError(status.message ?? result.error)
    return
  }

  log.subtitles.info('parse ok', {
    filename,
    cueCount: result.cues.length,
    firstCue: result.cues[0]
      ? { start: result.cues[0].start, end: result.cues[0].end }
      : null,
  })
  setters.setCues(result.cues)
  setters.setFileName(filename)
  setters.setError(null)
  setters.setInfo(status.tone === 'info' ? status.message : null)
}

export function useSubtitles(): UseSubtitlesResult {
  const [cues, setCues] = useState<Cue[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const clearSubtitles = useCallback(() => {
    setCues([])
    setFileName(null)
    setInfo(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const loadSubtitleText = useCallback((content: string, filename: string) => {
    log.subtitles.info('loadSubtitleText', {
      filename,
      length: content.length,
    })
    try {
      const result = parseSubtitles(content, { filename })
      applyParseResult(result, filename, {
        setCues,
        setFileName,
        setError,
        setInfo,
      })
    } catch (error) {
      log.subtitles.error('loadSubtitleText threw', error)
      setCues([])
      setFileName(null)
      setInfo(null)
      setError('Failed to parse extracted subtitles.')
    }
  }, [])

  const loadSubtitles = useCallback(async (file: File) => {
    log.subtitles.info('loadSubtitles file', {
      name: file.name,
      size: file.size,
      type: file.type,
    })
    if (!isSubtitleFilename(file.name)) {
      log.subtitles.warn('unsupported subtitle extension', { name: file.name })
      setCues([])
      setFileName(null)
      setInfo(null)
      setError('Unsupported subtitle format. Please use a .srt or .vtt file.')
      return
    }

    try {
      const content = await file.text()
      const result = parseSubtitles(content, { filename: file.name })
      applyParseResult(result, file.name, {
        setCues,
        setFileName,
        setError,
        setInfo,
      })
    } catch (error) {
      log.subtitles.error('failed to read subtitle file', error)
      setCues([])
      setFileName(null)
      setInfo(null)
      setError('Failed to read the subtitle file.')
    }
  }, [])

  return {
    cues,
    fileName,
    error,
    info,
    loadSubtitles,
    loadSubtitleText,
    clearSubtitles,
    clearError,
  }
}
