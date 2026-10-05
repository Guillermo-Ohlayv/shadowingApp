type MediaToolsProps = {
  disabled?: boolean
  isBusy?: boolean
  needsConversion?: boolean
  progressMessage?: string | null
  progressRatio?: number
  onExtractCaptions?: () => void
  onConvertPlayback?: () => void
}

export function MediaTools({
  disabled = false,
  isBusy = false,
  needsConversion = false,
  progressMessage = null,
  progressRatio,
  onExtractCaptions,
  onConvertPlayback,
}: MediaToolsProps) {
  return (
    <section
      aria-label="Advanced media tools"
      className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-ink">Advanced (FFmpeg)</h2>
        <p className="text-xs text-ink-muted">
          Extract embedded captions, or convert video/audio for browser playback
          (fixes silent tracks and unsupported containers).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || isBusy || !onExtractCaptions}
          onClick={onExtractCaptions}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Extract embedded captions
        </button>
        <button
          type="button"
          disabled={disabled || isBusy || !onConvertPlayback}
          onClick={onConvertPlayback}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-panel disabled:cursor-not-allowed disabled:opacity-40"
        >
          {needsConversion ? 'Convert for playback' : 'Fix audio / convert'}
        </button>
      </div>

      {progressMessage ? (
        <div className="text-xs text-ink-muted" role="status">
          <p>{progressMessage}</p>
          {typeof progressRatio === 'number' && progressRatio > 0 ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-line">
              <div
                className="h-full bg-accent transition-[width]"
                style={{
                  width: `${Math.min(100, Math.round(progressRatio * 100))}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
