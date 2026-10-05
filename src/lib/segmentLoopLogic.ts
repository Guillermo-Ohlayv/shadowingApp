/** Clamp a cue end to the video duration when duration is known. */
export function resolveLoopEnd(end: number, duration: number): number {
  if (Number.isFinite(duration) && duration > 0) {
    return Math.min(end, duration)
  }
  return end
}

/** True when playback should jump back to loop start. */
export function shouldWrapLoop(
  currentTime: number,
  start: number,
  end: number,
): boolean {
  return Number.isFinite(currentTime) && currentTime >= end && end > start
}

/** True when currentTime is outside [start, end). */
export function isTimeOutsideLoop(
  currentTime: number,
  start: number,
  end: number,
): boolean {
  return currentTime < start || currentTime >= end
}
