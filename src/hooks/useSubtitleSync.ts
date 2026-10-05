import { useMemo } from 'react'
import { findActiveCue } from '../lib/cueSync'
import type { Cue } from '../types/subtitle'

export function useSubtitleSync(cues: Cue[], currentTime: number) {
  const activeCue = useMemo(
    () => findActiveCue(cues, currentTime),
    [cues, currentTime],
  )

  return {
    activeCue,
    activeCueId: activeCue?.id ?? null,
    overlayText: activeCue?.text ?? null,
  }
}
