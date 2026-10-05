import type { RefObject } from 'react'

type VideoPlayerProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  videoUrl?: string | null
  overlayText?: string | null
}

export function VideoPlayer({
  videoRef,
  videoUrl = null,
  overlayText = null,
}: VideoPlayerProps) {
  return (
    <section
      aria-label="Video player"
      className="relative aspect-video overflow-hidden rounded-lg border border-line bg-ink"
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          src={videoUrl}
          controls={false}
          playsInline
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-panel/80">
          <p className="font-display text-xl text-panel">No video loaded</p>
          <p className="max-w-sm text-sm text-panel/70">
            Choose an MP4 or WebM file to start practicing.
          </p>
        </div>
      )}

      {overlayText ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          <p className="rounded bg-ink/80 px-3 py-1.5 text-center text-sm text-panel">
            {overlayText}
          </p>
        </div>
      ) : null}
    </section>
  )
}
