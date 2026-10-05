type VideoLoaderProps = {
  onVideoSelected?: (file: File) => void
  onSubtitleSelected?: (file: File) => void
}

export function VideoLoader({
  onVideoSelected,
  onSubtitleSelected,
}: VideoLoaderProps) {
  return (
    <section
      aria-label="File loaders"
      className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-panel p-4"
    >
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Video</span>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*,.mp4,.m4v,.webm,.mkv,.avi,.mov"
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-medium file:text-accent"
          onChange={(event) => {
            try {
              const file = event.target.files?.[0]
              if (file && onVideoSelected) {
                onVideoSelected(file)
              }
            } catch {
              // File picker errors should never crash the app.
            }
          }}
          disabled={!onVideoSelected}
        />
        <span className="text-xs text-ink-muted">
          MP4/WebM preferred — other formats can be converted
        </span>
      </label>

      <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Subtitles (optional)</span>
        <input
          type="file"
          accept=".srt,.vtt,text/vtt,application/x-subrip"
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-medium file:text-accent"
          onChange={(event) => {
            try {
              const file = event.target.files?.[0]
              if (file && onSubtitleSelected) {
                onSubtitleSelected(file)
              }
            } catch {
              // File picker errors should never crash the app.
            }
          }}
          disabled={!onSubtitleSelected}
        />
        <span className="text-xs text-ink-muted">.srt or .vtt — not required</span>
      </label>
    </section>
  )
}
