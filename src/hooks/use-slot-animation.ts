'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseSlotAnimationOptions {
  candidates: string[]       // names to cycle through during animation
  finalValue: string | null  // the pre-computed final pick; null = not yet picked
  durationMs?: number        // total animation time (default 2500)
  intervalMs?: number        // cycling speed (default 80ms)
}

interface UseSlotAnimationResult {
  displayValue: string | null  // what to render in the slot
  isAnimating: boolean
  skip: () => void             // stop immediately and show finalValue
}

export function useSlotAnimation({
  candidates,
  finalValue,
  durationMs = 2500,
  intervalMs = 80,
}: UseSlotAnimationOptions): UseSlotAnimationResult {
  const [displayValue, setDisplayValue] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevFinalRef = useRef<string | null>(null)

  const stopAnimation = useCallback((settledValue?: string | null) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    intervalRef.current = null
    timeoutRef.current = null
    if (settledValue !== undefined) {
      setDisplayValue(settledValue)
      setIsAnimating(false)
    }
  }, [])

  const skip = useCallback(() => {
    stopAnimation(finalValue)
  }, [stopAnimation, finalValue])

  useEffect(() => {
    if (finalValue === null) return
    if (finalValue === prevFinalRef.current) return
    prevFinalRef.current = finalValue

    if (candidates.length === 0) {
      setDisplayValue(finalValue)
      return
    }

    stopAnimation()
    setIsAnimating(true)

    let idx = 0
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % candidates.length
      setDisplayValue(candidates[idx])
    }, intervalMs)

    timeoutRef.current = setTimeout(() => {
      stopAnimation(finalValue)
    }, durationMs)

    return () => stopAnimation()
  }, [finalValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return { displayValue, isAnimating, skip }
}
