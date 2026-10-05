type SubtitleCueProps = {
  id: string
  startLabel: string
  endLabel: string
  text: string
  isActive?: boolean
  disabled?: boolean
  onSelect?: (id: string) => void
}

export function SubtitleCue({
  id,
  startLabel,
  endLabel,
  text,
  isActive = false,
  disabled = false,
  onSelect,
}: SubtitleCueProps) {
  const className = [
    'w-full rounded-md border px-3 py-2 text-left transition-colors',
    isActive
      ? 'border-accent bg-accent-soft text-ink'
      : 'border-transparent bg-transparent text-ink',
    onSelect && !disabled ? 'cursor-pointer hover:bg-surface' : '',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      <span className="mb-1 block font-mono text-xs text-ink-muted">
        {startLabel} → {endLabel}
      </span>
      <span className="block whitespace-pre-wrap text-sm leading-snug">{text}</span>
    </>
  )

  if (!onSelect) {
    return <div className={className}>{body}</div>
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(id)}
      className={className}
    >
      {body}
    </button>
  )
}
