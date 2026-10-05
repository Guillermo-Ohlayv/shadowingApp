type ErrorMessageProps = {
  message?: string | null
  tone?: 'neutral' | 'info' | 'error'
}

export function ErrorMessage({
  message = null,
  tone = 'neutral',
}: ErrorMessageProps) {
  if (!message) {
    return null
  }

  if (tone === 'error') {
    return (
      <section
        role="alert"
        aria-label="Error"
        className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
      >
        {message}
      </section>
    )
  }

  if (tone === 'info') {
    return (
      <section
        role="status"
        aria-label="Notice"
        className="rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent"
      >
        {message}
      </section>
    )
  }

  return (
    <section
      aria-label="Status"
      className="rounded-lg border border-dashed border-line bg-panel/60 px-4 py-3 text-sm text-ink-muted"
    >
      {message}
    </section>
  )
}
