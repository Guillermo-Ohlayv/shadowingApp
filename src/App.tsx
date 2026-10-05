import { useEffect, useRef } from 'react'
import { ErrorMessage } from './components/ErrorMessage'
import { MediaTools } from './components/MediaTools'
import { PlayerControls } from './components/PlayerControls'
import { SubtitlePanel } from './components/SubtitlePanel'
import { VideoLoader } from './components/VideoLoader'
import { VideoPlayer } from './components/VideoPlayer'
import { useMediaEnhance } from './hooks/useMediaEnhance'
import { useSegmentLoop } from './hooks/useSegmentLoop'
import { useSubtitles } from './hooks/useSubtitles'
import { useSubtitleSync } from './hooks/useSubtitleSync'
import { useVideoPlayer } from './hooks/useVideoPlayer'
import { formatTime } from './lib/formatTime'
import { log } from './lib/logger'
import { safeFindCue, summarizeAppStatus } from './lib/statusMessages'

function App() {
  const {
    videoRef,
    videoUrl,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    error: videoError,
    hasVideo,
    loadVideo,
    togglePlayPause,
    play,
    seek,
    setVolume,
    setPlaybackRate,
  } = useVideoPlayer()

  const {
    cues,
    error: subtitleError,
    info: subtitleInfo,
    loadSubtitles,
    loadSubtitleText,
  } = useSubtitles()

  const {
    sourceFile,
    progress,
    isBusy,
    needsConversion,
    setSourceFile,
    extractCaptions,
    convertPlayback,
  } = useMediaEnhance()

  const { activeCueId, overlayText: syncedOverlay } = useSubtitleSync(
    cues,
    currentTime,
  )

  const {
    loopState,
    isLooping,
    startLoop,
    exitLoop,
    resetLoop,
    handleManualSeek,
  } = useSegmentLoop({
    currentTime,
    duration,
    seek,
    play,
  })

  const previousVideoUrl = useRef(videoUrl)
  const previousCues = useRef(cues)
  const autoExtractKey = useRef<string | null>(null)

  useEffect(() => {
    if (previousVideoUrl.current !== videoUrl) {
      previousVideoUrl.current = videoUrl
      resetLoop()
    }
  }, [resetLoop, videoUrl])

  useEffect(() => {
    if (previousCues.current !== cues) {
      previousCues.current = cues
      resetLoop()
    }
  }, [cues, resetLoop])

  // Auto-extract embedded captions once per selected source file when none loaded.
  useEffect(() => {
    if (!sourceFile || cues.length > 0 || isBusy) {
      return
    }

    const key = `${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}`
    if (autoExtractKey.current === key) {
      return
    }
    autoExtractKey.current = key

    void (async () => {
      log.app.info('auto-extract embedded captions', { key })
      const text = await extractCaptions()
      if (text) {
        loadSubtitleText(text, `${sourceFile.name}.vtt`)
      }
    })()
  }, [cues.length, extractCaptions, isBusy, loadSubtitleText, sourceFile])

  const loopCue = loopState
    ? safeFindCue(cues, loopState.activeCueId)
    : null
  const highlightCueId = loopState?.activeCueId ?? activeCueId
  const overlayText = loopCue?.text ?? syncedOverlay

  const enhanceMessage =
    progress?.phase === 'error'
      ? progress.message
      : progress?.phase === 'done' ||
          progress?.phase === 'loading' ||
          progress?.phase === 'probing' ||
          progress?.phase === 'extracting' ||
          progress?.phase === 'converting'
        ? progress.message
        : null

  const status = summarizeAppStatus({
    videoError,
    subtitleError,
    subtitleInfo,
  })

  const bannerMessage =
    enhanceMessage && (isBusy || progress?.phase === 'error' || progress?.phase === 'done')
      ? enhanceMessage
      : status.message
  const bannerTone: 'neutral' | 'info' | 'error' =
    progress?.phase === 'error' || status.tone === 'error'
      ? 'error'
      : isBusy || progress?.phase === 'done' || status.tone === 'info'
        ? 'info'
        : 'neutral'

  const canLoop = hasVideo && cues.length > 0

  const handleVideoSelected = (file: File) => {
    log.app.info('video selected', {
      name: file.name,
      size: file.size,
      type: file.type,
    })
    autoExtractKey.current = null
    setSourceFile(file)
    loadVideo(file)
  }

  const handleCueSelect = (id: string) => {
    if (!canLoop) {
      log.app.debug('cue select ignored — loop unavailable', {
        hasVideo,
        cueCount: cues.length,
      })
      return
    }

    const cue = safeFindCue(cues, id)
    if (!cue) {
      log.app.warn('cue select — id not found', { id })
      return
    }

    startLoop(cue)
  }

  const handleConvert = async () => {
    log.app.info('user requested convert for playback')
    const converted = await convertPlayback()
    if (converted) {
      loadVideo(converted)
    }
  }

  const handleExtract = async () => {
    log.app.info('user requested extract captions')
    const text = await extractCaptions()
    if (text && sourceFile) {
      loadSubtitleText(text, `${sourceFile.name}.vtt`)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-accent">
          Practice tool
        </p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Shadowing App
        </h1>
        <p className="max-w-2xl text-sm text-ink-muted sm:text-base">
          Load a local video and optional subtitles, then click a cue to loop
          that segment for shadowing practice.
        </p>
      </header>

      <VideoLoader
        onVideoSelected={handleVideoSelected}
        onSubtitleSelected={(file) => {
          void loadSubtitles(file)
        }}
      />

      <MediaTools
        disabled={!sourceFile}
        isBusy={isBusy}
        needsConversion={needsConversion}
        progressMessage={enhanceMessage}
        progressRatio={progress?.ratio}
        onExtractCaptions={() => {
          void handleExtract()
        }}
        onConvertPlayback={() => {
          void handleConvert()
        }}
      />

      <ErrorMessage message={bannerMessage} tone={bannerTone} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
        <div className="flex flex-col gap-3">
          <VideoPlayer
            videoRef={videoRef}
            videoUrl={videoUrl}
            overlayText={overlayText}
          />
          <PlayerControls
            disabled={!hasVideo}
            isPlaying={isPlaying}
            isLooping={isLooping}
            currentTime={currentTime}
            duration={duration}
            currentTimeLabel={formatTime(currentTime)}
            durationLabel={formatTime(duration)}
            volume={volume}
            playbackRate={playbackRate}
            onPlayPause={togglePlayPause}
            onSeek={handleManualSeek}
            onVolumeChange={setVolume}
            onPlaybackRateChange={setPlaybackRate}
            onExitLoop={exitLoop}
          />
        </div>
        <SubtitlePanel
          cues={cues}
          activeCueId={highlightCueId}
          disabled={!canLoop}
          onCueSelect={handleCueSelect}
        />
      </div>
    </div>
  )
}

export default App
