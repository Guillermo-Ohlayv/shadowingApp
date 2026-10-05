const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5] as const

type PlayerControlsProps = {
  disabled?: boolean
  isPlaying?: boolean
  isLooping?: boolean
  currentTime?: number
  duration?: number
  currentTimeLabel?: string
  durationLabel?: string
  volume?: number
  playbackRate?: number
  onPlayPause?: () => void
  onSeek?: (time: number) => void
  onVolumeChange?: (volume: number) => void
  onPlaybackRateChange?: (rate: number) => void
  onExitLoop?: () => void
}

export function PlayerControls({
  disabled = false,
  isPlaying = false,
  isLooping = false,
  currentTime = 0,
  duration = 0,
  currentTimeLabel = '0:00',
  durationLabel = '0:00',
  volume = 1,
  playbackRate = 1,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onExitLoop,
}: PlayerControlsProps) {
  const canControl = !disabled && Boolean(onPlayPause)

  return (
    <section
      aria-label="Player controls"
      className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-3"
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canControl}
          onClick={onPlayPause}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-panel disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <span className="font-mono text-sm text-ink-muted">
          {currentTimeLabel} / {durationLabel}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {isLooping ? (
            <span className="rounded bg-accent-soft px-2 py-1 text-xs font-medium text-accent">
              Looping segment
            </span>
          ) : null}

          <button
            type="button"
            disabled={!isLooping || !onExitLoop}
            onClick={onExitLoop}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Exit loop
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        <span className="sr-only">Seek</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          disabled={!canControl || !onSeek || duration <= 0}
          onChange={(event) => onSeek?.(Number(event.target.value))}
          className="w-full accent-accent disabled:opacity-40"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            disabled={!canControl || !onVolumeChange}
            onChange={(event) => onVolumeChange?.(Number(event.target.value))}
            className="w-28 accent-accent disabled:opacity-40"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <span>Speed</span>
          <select
            value={playbackRate}
            disabled={!canControl || !onPlaybackRateChange}
            onChange={(event) =>
              onPlaybackRateChange?.(Number(event.target.value))
            }
            className="rounded-md border border-line bg-panel px-2 py-1 text-ink disabled:opacity-40"
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
