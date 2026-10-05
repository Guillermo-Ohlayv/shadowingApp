import { useCallback, useRef, useState } from 'react'
import {
  convertForBrowserPlayback,
  extractEmbeddedSubtitles,
  type MediaProcessProgress,
} from '../lib/ffmpegMedia'
import { log } from '../lib/logger'
import { isSupportedVideoFile } from '../lib/videoSupport'

export type UseMediaEnhanceResult = {
  sourceFile: File | null
  progress: MediaProcessProgress | null
  isBusy: boolean
  needsConversion: boolean
  setSourceFile: (file: File | null) => void
  extractCaptions: () => Promise<string | null>
  convertPlayback: () => Promise<File | null>
  clearProgress: () => void
}

export function useMediaEnhance(): UseMediaEnhanceResult {
  const [sourceFile, setSourceFileState] = useState<File | null>(null)
  const [progress, setProgress] = useState<MediaProcessProgress | null>(null)
  const [needsConversion, setNeedsConversion] = useState(false)
  const busyRef = useRef(false)

  const setSourceFile = useCallback((file: File | null) => {
    setSourceFileState(file)
    const needs = Boolean(file && !isSupportedVideoFile(file))
    setNeedsConversion(needs)
    log.ffmpeg.info('source file set', {
      name: file?.name ?? null,
      size: file?.size ?? null,
      type: file?.type ?? null,
      needsConversion: needs,
    })
    setProgress(
      needs
        ? {
            phase: 'error',
            message:
              'This format may need conversion before the browser can play it. Use Convert for playback.',
          }
        : null,
    )
  }, [])

  const clearProgress = useCallback(() => {
    setProgress(null)
  }, [])

  const extractCaptions = useCallback(async () => {
    if (!sourceFile || busyRef.current) {
      log.ffmpeg.debug('extractCaptions skipped', {
        hasFile: Boolean(sourceFile),
        busy: busyRef.current,
      })
      return null
    }

    busyRef.current = true
    log.ffmpeg.info('extractCaptions start', { name: sourceFile.name })
    try {
      const text = await extractEmbeddedSubtitles(sourceFile, setProgress)
      if (!text) {
        log.ffmpeg.warn('no embedded captions found', {
          name: sourceFile.name,
        })
        setProgress({
          phase: 'done',
          message: 'No embedded captions found in this video.',
        })
        return null
      }

      log.ffmpeg.info('embedded captions extracted', {
        name: sourceFile.name,
        length: text.length,
      })
      setProgress({
        phase: 'done',
        message: 'Embedded captions extracted.',
      })
      return text
    } catch (error) {
      log.ffmpeg.error('extractCaptions failed', error)
      setProgress({
        phase: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to extract embedded captions.',
      })
      return null
    } finally {
      busyRef.current = false
    }
  }, [sourceFile])

  const convertPlayback = useCallback(async () => {
    if (!sourceFile || busyRef.current) {
      log.ffmpeg.debug('convertPlayback skipped', {
        hasFile: Boolean(sourceFile),
        busy: busyRef.current,
      })
      return null
    }

    busyRef.current = true
    log.ffmpeg.info('convertPlayback start', {
      name: sourceFile.name,
      size: sourceFile.size,
    })
    try {
      const converted = await convertForBrowserPlayback(sourceFile, setProgress)
      setSourceFileState(converted)
      setNeedsConversion(false)
      log.ffmpeg.info('convertPlayback done', {
        name: converted.name,
        size: converted.size,
      })
      setProgress({
        phase: 'done',
        message:
          'Converted to browser-friendly MP4 (H.264/AAC). Audio should now play.',
      })
      return converted
    } catch (error) {
      log.ffmpeg.error('convertPlayback failed', error)
      setProgress({
        phase: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Conversion failed. Try a smaller file or a different format.',
      })
      return null
    } finally {
      busyRef.current = false
    }
  }, [sourceFile])

  return {
    sourceFile,
    progress,
    isBusy: Boolean(
      progress &&
        ['loading', 'probing', 'extracting', 'converting'].includes(
          progress.phase,
        ),
    ),
    needsConversion,
    setSourceFile,
    extractCaptions,
    convertPlayback,
    clearProgress,
  }
}
