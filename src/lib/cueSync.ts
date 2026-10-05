import type { Cue } from '../types/subtitle'

/** Find the cue active at currentTime. Overlaps prefer latest start. End is exclusive. */
export function findActiveCue(cues: Cue[], currentTime: number): Cue | null {
  if (!cues.length || !Number.isFinite(currentTime)) {
    return null
  }

  let active: Cue | null = null

  for (const cue of cues) {
    if (currentTime >= cue.start && currentTime < cue.end) {
      if (!active || cue.start >= active.start) {
        active = cue
      }
    }
  }

  return active
}
