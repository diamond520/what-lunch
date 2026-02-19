import { describe, test, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlotAnimation } from '@/hooks/use-slot-animation'

describe('useSlotAnimation', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('initial state: displayValue is null when finalValue is null, isAnimating is false', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useSlotAnimation({
        candidates: ['A', 'B', 'C'],
        finalValue: null,
      }),
    )
    expect(result.current.displayValue).toBeNull()
    expect(result.current.isAnimating).toBe(false)
  })

  test('starts animating when finalValue changes from null to a string', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ finalValue }) =>
        useSlotAnimation({
          candidates: ['A', 'B', 'C'],
          finalValue,
        }),
      { initialProps: { finalValue: null as string | null } },
    )
    expect(result.current.isAnimating).toBe(false)

    rerender({ finalValue: 'B' })
    expect(result.current.isAnimating).toBe(true)
  })

  test('settles after duration: isAnimating is false and displayValue equals finalValue', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ finalValue }) =>
        useSlotAnimation({
          candidates: ['A', 'B', 'C'],
          finalValue,
        }),
      { initialProps: { finalValue: null as string | null } },
    )

    rerender({ finalValue: 'B' })
    expect(result.current.isAnimating).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(result.current.isAnimating).toBe(false)
    expect(result.current.displayValue).toBe('B')
  })

  test('skip stops animation and shows finalValue', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ finalValue }) =>
        useSlotAnimation({
          candidates: ['A', 'B', 'C'],
          finalValue,
        }),
      { initialProps: { finalValue: null as string | null } },
    )

    rerender({ finalValue: 'C' })
    expect(result.current.isAnimating).toBe(true)

    act(() => {
      result.current.skip()
    })

    expect(result.current.isAnimating).toBe(false)
    expect(result.current.displayValue).toBe('C')
  })

  test('no re-animation on same finalValue', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ finalValue }) =>
        useSlotAnimation({
          candidates: ['A', 'B', 'C'],
          finalValue,
        }),
      { initialProps: { finalValue: null as string | null } },
    )

    rerender({ finalValue: 'A' })
    expect(result.current.isAnimating).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(result.current.isAnimating).toBe(false)

    // Re-render with same finalValue — should NOT re-animate
    rerender({ finalValue: 'A' })
    expect(result.current.isAnimating).toBe(false)
  })

  test('empty candidates — no animation, displayValue equals finalValue immediately', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ finalValue }) =>
        useSlotAnimation({
          candidates: [],
          finalValue,
        }),
      { initialProps: { finalValue: null as string | null } },
    )

    rerender({ finalValue: 'X' })
    expect(result.current.isAnimating).toBe(false)
    expect(result.current.displayValue).toBe('X')
  })
})
