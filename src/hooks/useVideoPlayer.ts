import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { messageForPlayError } from '../lib/playbackErrors'
import { log } from '../lib/logger'
import { isSupportedVideoFile } from '../lib/videoSupport'

export type UseVideoPlayerResult = {
  videoRef: RefObject<HTMLVideoElement | null>
  videoUrl: string | null
  fileName: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  error: string | null
  hasVideo: boolean
  loadVideo: (file: File) => void
  clearError: () => void
  togglePlayPause: () => void
  play: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
}

export function useVideoPlayer(): UseVideoPlayerResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [playbackRate, setPlaybackRateState] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const resetPlaybackState = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const loadVideo = useCallback(
    (file: File) => {
      try {
        log.video.info('loadVideo requested', {
          name: file.name,
          type: file.type,
          size: file.size,
        })

        if (!isSupportedVideoFile(file)) {
          log.video.warn('browser reports unsupported format', {
            name: file.name,
            type: file.type,
          })
          revokeObjectUrl()
          setVideoUrl(null)
          setFileName(null)
          resetPlaybackState()
          setError(
            `This browser cannot play “${file.name}” natively. Use Convert for playback below.`,
          )
          return
        }

        revokeObjectUrl()
        const nextUrl = URL.createObjectURL(file)
        objectUrlRef.current = nextUrl
        setVideoUrl(nextUrl)
        setFileName(file.name)
        resetPlaybackState()
        setError(null)
        log.video.info('object URL created', { name: file.name })
      } catch (error) {
        log.video.error('loadVideo failed', error)
        revokeObjectUrl()
        setVideoUrl(null)
        setFileName(null)
        resetPlaybackState()
        setError('Failed to load the video file.')
      }
    },
    [resetPlaybackState, revokeObjectUrl],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const play = useCallback(() => {
    const video = videoRef.current
    if (!video || !videoUrl) {
      log.video.debug('play skipped — no video element or URL')
      return
    }

    log.video.debug('play() called', {
      currentTime: video.currentTime,
      readyState: video.readyState,
      networkState: video.networkState,
      paused: video.paused,
    })

    void video.play().catch((error: unknown) => {
      const message = messageForPlayError(error)
      if (!message) {
        log.video.debug('play() rejected benignly', {
          name: error instanceof DOMException ? error.name : 'unknown',
          error,
        })
        return
      }
      log.video.error('play() failed', { message, error })
      setError(message)
      setIsPlaying(false)
    })
  }, [videoUrl])

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video || !videoUrl) {
      return
    }

    if (video.paused || video.ended) {
      log.video.info('toggle → play')
      play()
    } else {
      log.video.info('toggle → pause')
      video.pause()
    }
  }, [play, videoUrl])

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video || !videoUrl) {
        return
      }

      const nextTime = Math.min(
        Math.max(time, 0),
        Number.isFinite(video.duration) ? video.duration : time,
      )
      video.currentTime = nextTime
      setCurrentTime(nextTime)
    },
    [videoUrl],
  )

  const setVolume = useCallback(
    (nextVolume: number) => {
      const clamped = Math.min(Math.max(nextVolume, 0), 1)
      setVolumeState(clamped)
      if (videoRef.current) {
        videoRef.current.volume = clamped
      }
    },
    [],
  )

  const setPlaybackRate = useCallback(
    (rate: number) => {
      setPlaybackRateState(rate)
      if (videoRef.current) {
        videoRef.current.playbackRate = rate
      }
    },
    [],
  )

  useEffect(() => {
    return () => {
      revokeObjectUrl()
    }
  }, [revokeObjectUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) {
      return
    }

    video.volume = volume
    video.playbackRate = playbackRate

    const onLoadedMetadata = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0
      setDuration(nextDuration)
      setCurrentTime(video.currentTime)
      log.video.info('loadedmetadata', {
        duration: nextDuration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      })
    }

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const onPlay = () => {
      log.video.debug('event: play')
      setIsPlaying(true)
    }
    const onPause = () => {
      log.video.debug('event: pause', { currentTime: video.currentTime })
      setIsPlaying(false)
    }
    const onEnded = () => {
      log.video.info('event: ended')
      setIsPlaying(false)
      setCurrentTime(video.currentTime)
    }
    const onError = () => {
      const mediaError = video.error
      log.video.error('event: error', {
        code: mediaError?.code,
        message: mediaError?.message,
        fileName,
      })
      setIsPlaying(false)
      setError(
        `This video could not be played${fileName ? ` (“${fileName}”)` : ''}. The format may be unsupported.`,
      )
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
    }
    // Apply current volume/rate on attach; setters update the element directly.
  }, [fileName, videoUrl])

  return {
    videoRef,
    videoUrl,
    fileName,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    error,
    hasVideo: Boolean(videoUrl),
    loadVideo,
    clearError,
    togglePlayPause,
    play,
    seek,
    setVolume,
    setPlaybackRate,
  }
}
