import { describe, test, expect, vi, afterEach } from 'vitest'
import { getRecentlyVisitedIds, splitPoolByHistory } from '@/lib/history'
import type { LunchHistoryEntry } from '@/lib/history'

function makeEntry(date: string, restaurantId: string, restaurantName = 'Test'): LunchHistoryEntry {
  return { id: crypto.randomUUID(), date, restaurantId, restaurantName }
}

describe('getRecentlyVisitedIds', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // Fixed "today" = Thursday 2026-02-19
  // Business days back from Thu 2026-02-19:
  //   1 bd = Wed 2026-02-18
  //   2 bd = Tue 2026-02-17
  //   3 bd = Mon 2026-02-16
  //   4 bd = Fri 2026-02-13
  //   5 bd = Thu 2026-02-12

  test('empty entries returns empty set', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19'))
    expect(getRecentlyVisitedIds([], 5).size).toBe(0)
  })

  test('entry with today date is included (within window)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19'))
    const entries = [makeEntry('2026-02-19', 'r1')]
    const result = getRecentlyVisitedIds(entries, 5)
    expect(result.has('r1')).toBe(true)
  })

  test('entry at exact cutoff boundary is included (inclusive)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19'))
    // 5 business days back from 2026-02-19 = 2026-02-12
    const entries = [makeEntry('2026-02-12', 'r2')]
    const result = getRecentlyVisitedIds(entries, 5)
    expect(result.has('r2')).toBe(true)
  })

  test('entry one day before cutoff is excluded', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19'))
    // 6 business days back from 2026-02-19 = 2026-02-11
    const entries = [makeEntry('2026-02-11', 'r3')]
    const result = getRecentlyVisitedIds(entries, 5)
    expect(result.has('r3')).toBe(false)
  })

  test('weekends are skipped when counting back from Monday', () => {
    vi.useFakeTimers()
    // Monday 2026-02-16
    vi.setSystemTime(new Date('2026-02-16'))
    // 1 business day back from Mon = Fri 2026-02-13 (skips Sat 2026-02-14, Sun 2026-02-15)
    const fridayEntry = [makeEntry('2026-02-13', 'r4')]
    const result = getRecentlyVisitedIds(fridayEntry, 1)
    expect(result.has('r4')).toBe(true)

    // Saturday 2026-02-14 is AFTER the cutoff (Fri 2026-02-13), so it IS included
    // Weekend entries are still "recent" — the lookback skips weekends for counting,
    // but entries ON weekends within the date range are still considered recent visits
    const saturdayEntry = [makeEntry('2026-02-14', 'r5')]
    const result2 = getRecentlyVisitedIds(saturdayEntry, 1)
    expect(result2.has('r5')).toBe(true)
  })

  test('multiple entries — all recent ones returned', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19'))
    const entries = [
      makeEntry('2026-02-19', 'r1'),
      makeEntry('2026-02-18', 'r2'),
      makeEntry('2026-02-10', 'r3'), // too old
    ]
    const result = getRecentlyVisitedIds(entries, 5)
    expect(result.has('r1')).toBe(true)
    expect(result.has('r2')).toBe(true)
    expect(result.has('r3')).toBe(false)
  })

  test('duplicate restaurantId is deduplicated in Set', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19'))
    const entries = [
      makeEntry('2026-02-19', 'r1'),
      makeEntry('2026-02-18', 'r1'), // same restaurant, different day
    ]
    const result = getRecentlyVisitedIds(entries, 5)
    expect(result.size).toBe(1)
    expect(result.has('r1')).toBe(true)
  })

  test('lookback=1 from Thursday: only today and yesterday (Wed) in window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-19')) // Thu
    // 1 business day back = Wed 2026-02-18 (cutoff)
    const entries = [
      makeEntry('2026-02-19', 'r1'), // today — in
      makeEntry('2026-02-18', 'r2'), // 1 bd ago — in (boundary)
      makeEntry('2026-02-17', 'r3'), // 2 bd ago — out
    ]
    const result = getRecentlyVisitedIds(entries, 1)
    expect(result.has('r1')).toBe(true)
    expect(result.has('r2')).toBe(true)
    expect(result.has('r3')).toBe(false)
  })
})

describe('splitPoolByHistory', () => {
  const pool = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
  ]

  test('empty recentIds — primary is full pool', () => {
    const { primary, fallback } = splitPoolByHistory(pool, new Set())
    expect(primary).toHaveLength(3)
    expect(fallback).toHaveLength(3)
  })

  test('all items recent — primary is empty, fallback is full', () => {
    const { primary, fallback } = splitPoolByHistory(pool, new Set(['a', 'b', 'c']))
    expect(primary).toHaveLength(0)
    expect(fallback).toHaveLength(3)
  })

  test('some items recent — primary contains only unvisited', () => {
    const { primary, fallback } = splitPoolByHistory(pool, new Set(['a']))
    expect(primary.map((r) => r.id)).toEqual(['b', 'c'])
    expect(fallback).toHaveLength(3)
  })

  test('does not mutate original pool', () => {
    const original = [...pool]
    splitPoolByHistory(pool, new Set(['a']))
    expect(pool).toEqual(original)
  })

  test('works with Restaurant-shaped objects (duck typing)', () => {
    const restaurants = [
      { id: 'r1', name: 'R1', type: 'chi', price: 100, distance: 100, rating: 4.0 },
      { id: 'r2', name: 'R2', type: 'jp', price: 80, distance: 200, rating: 4.5 },
    ]
    const { primary } = splitPoolByHistory(restaurants, new Set(['r1']))
    expect(primary).toHaveLength(1)
    expect(primary[0].id).toBe('r2')
  })
})
