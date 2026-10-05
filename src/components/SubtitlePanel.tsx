import { useEffect, useRef } from 'react'
import type { Cue } from '../types/subtitle'
import { formatTime } from '../lib/formatTime'
import { SubtitleCue } from './SubtitleCue'

type SubtitlePanelProps = {
  cues?: Cue[]
  activeCueId?: string | null
  disabled?: boolean
  onCueSelect?: (id: string) => void
}

export function SubtitlePanel({
  cues = [],
  activeCueId = null,
  disabled = false,
  onCueSelect,
}: SubtitlePanelProps) {
  const hasCues = cues.length > 0
  const activeItemRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    if (!activeCueId || !activeItemRef.current) {
      return
    }
    activeItemRef.current.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [activeCueId])

  return (
    <aside
      aria-label="Subtitle list"
      className="flex h-full min-h-80 flex-col overflow-hidden rounded-lg border border-line bg-panel"
    >
      <header className="border-b border-line px-4 py-3">
        <h2 className="font-display text-lg text-ink">Subtitles</h2>
        <p className="text-xs text-ink-muted">
          {hasCues
            ? `${cues.length} cue${cues.length === 1 ? '' : 's'}`
            : 'No subtitles loaded'}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {hasCues ? (
          <ul className="flex flex-col gap-1">
            {cues.map((cue) => {
              const isActive = cue.id === activeCueId
              return (
                <li
                  key={cue.id}
                  ref={isActive ? activeItemRef : undefined}
                >
                  <SubtitleCue
                    id={cue.id}
                    startLabel={formatTime(cue.start)}
                    endLabel={formatTime(cue.end)}
                    text={cue.text}
                    isActive={isActive}
                    disabled={disabled || !onCueSelect}
                    onSelect={disabled ? undefined : onCueSelect}
                  />
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="text-sm font-medium text-ink">No subtitles loaded</p>
            <p className="text-xs text-ink-muted">
              Upload an .srt or .vtt file to enable click-to-loop.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
