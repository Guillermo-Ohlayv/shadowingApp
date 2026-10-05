import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { parseFfmpegHasSubtitleStream } from './ffmpegProbe'
import { log } from './logger'

const CORE_VERSION = '0.12.10'
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

export type MediaProcessProgress = {
  phase: 'loading' | 'probing' | 'extracting' | 'converting' | 'done' | 'error'
  message: string
  ratio?: number
}

async function getFfmpeg(
  onProgress?: (progress: MediaProcessProgress) => void,
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      onProgress?.({
        phase: 'loading',
        message: 'Loading FFmpeg (~30MB, first time only)…',
      })

      const ffmpeg = new FFmpeg()
      ffmpeg.on('progress', ({ progress }) => {
        onProgress?.({
          phase: 'converting',
          message: 'Processing media…',
          ratio: progress,
        })
      })

      log.ffmpeg.info('loading ffmpeg core from CDN', { core: CORE_BASE })
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(
          `${CORE_BASE}/ffmpeg-core.wasm`,
          'application/wasm',
        ),
      })

      ffmpegInstance = ffmpeg
      log.ffmpeg.info('ffmpeg core loaded')
      return ffmpeg
    })().catch((error) => {
      log.ffmpeg.error('ffmpeg load failed', error)
      loadPromise = null
      throw error
    })
  }

  return loadPromise
}

async function writeInput(ffmpeg: FFmpeg, file: File, inputName: string) {
  await ffmpeg.writeFile(inputName, await fetchFile(file))
}

async function readOutputFile(
  ffmpeg: FFmpeg,
  name: string,
): Promise<Uint8Array | null> {
  try {
    const data = await ffmpeg.readFile(name)
    if (typeof data === 'string') {
      return new TextEncoder().encode(data)
    }
    return data
  } catch {
    return null
  }
}

async function deleteQuiet(ffmpeg: FFmpeg, name: string) {
  try {
    await ffmpeg.deleteFile(name)
  } catch {
    // ignore missing files
  }
}

/** Probe whether the file contains at least one subtitle stream. */
export async function probeHasSubtitles(
  file: File,
  onProgress?: (progress: MediaProcessProgress) => void,
): Promise<boolean> {
  const ffmpeg = await getFfmpeg(onProgress)
  onProgress?.({ phase: 'probing', message: 'Checking for embedded captions…' })

  const inputName = `probe-${Date.now()}.bin`
  const logs: string[] = []
  const onLog = ({ message }: { message: string }) => {
    logs.push(message)
  }

  ffmpeg.on('log', onLog)
  try {
    await writeInput(ffmpeg, file, inputName)
    // -i alone exits non-zero; logs still contain stream info.
    await ffmpeg.exec(['-i', inputName])
  } catch {
    // expected for probe-only
  } finally {
    ffmpeg.off('log', onLog)
    await deleteQuiet(ffmpeg, inputName)
  }

  return parseFfmpegHasSubtitleStream(logs.join('\n'))
}

/** Extract the first embedded subtitle stream to WebVTT text. */
export async function extractEmbeddedSubtitles(
  file: File,
  onProgress?: (progress: MediaProcessProgress) => void,
): Promise<string | null> {
  const ffmpeg = await getFfmpeg(onProgress)
  onProgress?.({
    phase: 'extracting',
    message: 'Extracting embedded captions…',
  })
  log.ffmpeg.info('extractEmbeddedSubtitles exec', { name: file.name })

  const inputName = `input-${Date.now()}.bin`
  const outputName = 'subs.vtt'

  try {
    await writeInput(ffmpeg, file, inputName)
    await deleteQuiet(ffmpeg, outputName)

    const code = await ffmpeg.exec([
      '-i',
      inputName,
      '-map',
      '0:s:0',
      '-c:s',
      'webvtt',
      outputName,
    ])

    log.ffmpeg.debug('extract exit code', { code })

    if (code !== 0) {
      return null
    }

    const data = await readOutputFile(ffmpeg, outputName)
    if (!data || data.byteLength === 0) {
      log.ffmpeg.warn('extract produced empty output')
      return null
    }

    return new TextDecoder().decode(data)
  } catch (error) {
    log.ffmpeg.error('extractEmbeddedSubtitles error', error)
    return null
  } finally {
    await deleteQuiet(ffmpeg, inputName)
    await deleteQuiet(ffmpeg, outputName)
  }
}

/**
 * Convert/remux for browser playback: H.264 + AAC in MP4.
 * Prefer copying video when possible; always re-encode audio to AAC
 * so codecs like AC3 produce audible output in Chrome/Firefox.
 */
export async function convertForBrowserPlayback(
  file: File,
  onProgress?: (progress: MediaProcessProgress) => void,
): Promise<File> {
  const ffmpeg = await getFfmpeg(onProgress)
  onProgress?.({
    phase: 'converting',
    message: 'Converting for browser playback (this may take a while)…',
  })

  const inputName = `input-${Date.now()}.bin`
  const outputName = 'output.mp4'

  log.ffmpeg.info('convertForBrowserPlayback start', {
    name: file.name,
    size: file.size,
  })

  try {
    await writeInput(ffmpeg, file, inputName)
    await deleteQuiet(ffmpeg, outputName)

    // Try video copy + AAC audio first (fast; fixes silent AC3/DTS audio).
    log.ffmpeg.debug('trying remux: copy video + aac audio')
    let code = await ffmpeg.exec([
      '-i',
      inputName,
      '-map',
      '0:v:0?',
      '-map',
      '0:a:0?',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      outputName,
    ])

    let data = code === 0 ? await readOutputFile(ffmpeg, outputName) : null
    log.ffmpeg.debug('remux result', {
      code,
      bytes: data?.byteLength ?? 0,
    })

    if (!data || data.byteLength === 0) {
      await deleteQuiet(ffmpeg, outputName)
      // Full transcode fallback for containers/codecs that cannot be remuxed.
      log.ffmpeg.warn('remux failed — falling back to full H.264/AAC transcode')
      code = await ffmpeg.exec([
        '-i',
        inputName,
        '-map',
        '0:v:0?',
        '-map',
        '0:a:0?',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-movflags',
        '+faststart',
        outputName,
      ])
      data = code === 0 ? await readOutputFile(ffmpeg, outputName) : null
      log.ffmpeg.debug('transcode result', {
        code,
        bytes: data?.byteLength ?? 0,
      })
    }

    if (!data || data.byteLength === 0) {
      throw new Error('Conversion failed. The file may be unsupported by FFmpeg.wasm.')
    }

    // Copy into a fresh ArrayBuffer so BlobPart typing is satisfied.
    const bytes = new Uint8Array(data.byteLength)
    bytes.set(data)

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'video'
    const output = new File(
      [new Blob([bytes], { type: 'video/mp4' })],
      `${baseName}-browser.mp4`,
      { type: 'video/mp4' },
    )
    log.ffmpeg.info('conversion output ready', {
      name: output.name,
      size: output.size,
    })
    return output
  } finally {
    await deleteQuiet(ffmpeg, inputName)
    await deleteQuiet(ffmpeg, outputName)
    onProgress?.({ phase: 'done', message: 'Conversion complete.' })
  }
}
