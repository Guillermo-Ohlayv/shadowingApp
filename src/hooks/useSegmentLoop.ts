import { useCallback, useEffect, useRef, useState } from 'react'
import { log } from '../lib/logger'
import {
  isTimeOutsideLoop,
  resolveLoopEnd,
  shouldWrapLoop,
} from '../lib/segmentLoopLogic'
import type { Cue } from '../types/subtitle'
import type { LoopState } from '../types/loop'

type UseSegmentLoopArgs = {
  currentTime: number
  duration: number
  seek: (time: number) => void
  play: () => void
}

export type UseSegmentLoopResult = {
  loopState: LoopState
  isLooping: boolean
  startLoop: (cue: Cue) => void
  exitLoop: () => void
  resetLoop: () => void
  handleManualSeek: (time: number) => void
}

export function useSegmentLoop({
  currentTime,
  duration,
  seek,
  play,
}: UseSegmentLoopArgs): UseSegmentLoopResult {
  const [loopState, setLoopState] = useState<LoopState>(null)
  const wrappingRef = useRef(false)

  const resetLoop = useCallback(() => {
    log.loop.debug('resetLoop')
    setLoopState(null)
  }, [])

  const exitLoop = useCallback(() => {
    log.loop.info('exitLoop')
    setLoopState(null)
  }, [])

  const startLoop = useCallback(
    (cue: Cue) => {
      const end = resolveLoopEnd(cue.end, duration)
      const start = Math.min(cue.start, end)
      log.loop.info('startLoop', {
        id: cue.id,
        start,
        end,
        text: cue.text.slice(0, 80),
      })
      setLoopState({
        activeCueId: cue.id,
        start,
        end,
      })
      seek(start)
      play()
    },
    [duration, play, seek],
  )

  const handleManualSeek = useCallback(
    (time: number) => {
      if (
        loopState &&
        isTimeOutsideLoop(time, loopState.start, loopState.end)
      ) {
        log.loop.info('manual seek outside loop — exiting', {
          time,
          loop: loopState,
        })
        setLoopState(null)
      }
      seek(time)
    },
    [loopState, seek],
  )

  useEffect(() => {
    if (!loopState) {
      return
    }

    if (!shouldWrapLoop(currentTime, loopState.start, loopState.end)) {
      wrappingRef.current = false
      return
    }

    if (wrappingRef.current) {
      return
    }

    wrappingRef.current = true
    log.loop.debug('wrap loop', {
      currentTime,
      start: loopState.start,
      end: loopState.end,
    })
    seek(loopState.start)
    play()
  }, [currentTime, loopState, play, seek])

  // Re-clamp loop end if duration becomes known after start
  useEffect(() => {
    if (!(duration > 0)) {
      return
    }

    setLoopState((prev) => {
      if (!prev) {
        return prev
      }
      const nextEnd = resolveLoopEnd(prev.end, duration)
      if (nextEnd === prev.end) {
        return prev
      }
      return { ...prev, end: nextEnd }
    })
  }, [duration])

  return {
    loopState,
    isLooping: loopState !== null,
    startLoop,
    exitLoop,
    resetLoop,
    handleManualSeek,
  }
}
