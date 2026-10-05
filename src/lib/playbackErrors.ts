/** Play promise rejections that should not surface as user-facing errors. */
export function isBenignPlayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** User-facing play failure message, or null when the rejection is safe to ignore. */
export function messageForPlayError(error: unknown): string | null {
  if (isBenignPlayError(error)) {
    return null
  }

  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Playback was blocked. Click Play again to start the video.'
  }

  return 'Unable to play this video. Try Convert for playback if the format or audio codec is unsupported.'
}
