import { describe, test, expect } from 'vitest'
import { generateWeeklyPlan, rerollSlot, applyFilter, type FilterMode, type WeeklyPlan } from '@/lib/recommend'
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'
import type { Restaurant } from '@/lib/types'

describe('generateWeeklyPlan', () => {
  test('returns 5 days', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    expect(plan.days).toHaveLength(5)
  })

  test('total cost does not exceed weekly budget', () => {
    const budget = 750
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
    expect(plan.totalCost).toBeLessThanOrEqual(budget)
  })

  test('no more than 2 consecutive same cuisine type', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    for (let i = 2; i < plan.days.length; i++) {
      const threeConsecutive =
        plan.days[i].type === plan.days[i - 1].type && plan.days[i].type === plan.days[i - 2].type
      expect(threeConsecutive, `3 consecutive ${plan.days[i].type} at index ${i}`).toBe(false)
    }
  })

  test('records the weekly budget used', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 600)
    expect(plan.weeklyBudget).toBe(600)
  })

  test('handles generous budget (2000)', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 2000)
    expect(plan.days).toHaveLength(5)
    expect(plan.totalCost).toBeLessThanOrEqual(2000)
  })

  test('handles minimum satisfiable budget (225 = 5 x 45)', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 225)
    expect(plan.days).toHaveLength(5)
    expect(plan.totalCost).toBeLessThanOrEqual(225)
  })

  test('does NOT throw on impossible budget (50) — returns graceful fallback', () => {
    expect(() => generateWeeklyPlan(DEFAULT_RESTAURANTS, 50)).not.toThrow()
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 50)
    expect(plan.days).toHaveLength(5)
  })

  test('does NOT throw on budget below minimum (100)', () => {
    expect(() => generateWeeklyPlan(DEFAULT_RESTAURANTS, 100)).not.toThrow()
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 100)
    expect(plan.days).toHaveLength(5)
  })

  test('handles single restaurant in pool', () => {
    const single: Restaurant[] = [
      { id: 'only', name: 'Only', type: 'chi', price: 100, distance: 50, rating: 4.0 },
    ]
    const plan = generateWeeklyPlan(single, 1000)
    expect(plan.days).toHaveLength(5)
    expect(plan.days.every((d) => d.id === 'only')).toBe(true)
  })

  test('handles pool with all same cuisine type', () => {
    const sameCuisine: Restaurant[] = [
      { id: 'a', name: 'A', type: 'jp', price: 80, distance: 100, rating: 4.0 },
      { id: 'b', name: 'B', type: 'jp', price: 90, distance: 200, rating: 4.0 },
      { id: 'c', name: 'C', type: 'jp', price: 70, distance: 150, rating: 4.0 },
    ]
    const plan = generateWeeklyPlan(sameCuisine, 1000)
    expect(plan.days).toHaveLength(5)
  })

  test('throws on empty pool', () => {
    expect(() => generateWeeklyPlan([], 750)).toThrow()
  })

  // Statistical validation: run 100 times
  test('budget constraint holds over 100 iterations', () => {
    const budget = 600
    for (let i = 0; i < 100; i++) {
      const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, budget)
      expect(plan.totalCost).toBeLessThanOrEqual(budget)
    }
  })

  test('cuisine diversity holds over 100 iterations', () => {
    for (let i = 0; i < 100; i++) {
      const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
      for (let j = 2; j < plan.days.length; j++) {
        const threeConsecutive =
          plan.days[j].type === plan.days[j - 1].type && plan.days[j].type === plan.days[j - 2].type
        expect(threeConsecutive).toBe(false)
      }
    }
  })

  test('produces varied results (not deterministic)', () => {
    const plans = Array.from({ length: 20 }, () => generateWeeklyPlan(DEFAULT_RESTAURANTS, 750))
    const uniqueFirstPicks = new Set(plans.map((p) => p.days[0].id))
    expect(uniqueFirstPicks.size).toBeGreaterThan(1)
  })
})

describe('rerollSlot', () => {
  test('only changes the target slot (middle)', () => {
    const original = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    const updated = rerollSlot(original, 2, DEFAULT_RESTAURANTS)
    expect(updated.days[0]).toBe(original.days[0])
    expect(updated.days[1]).toBe(original.days[1])
    // days[2] may or may not change (random)
    expect(updated.days[3]).toBe(original.days[3])
    expect(updated.days[4]).toBe(original.days[4])
  })

  test('only changes the target slot (first)', () => {
    const original = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    const updated = rerollSlot(original, 0, DEFAULT_RESTAURANTS)
    expect(updated.days[1]).toBe(original.days[1])
    expect(updated.days[2]).toBe(original.days[2])
    expect(updated.days[3]).toBe(original.days[3])
    expect(updated.days[4]).toBe(original.days[4])
  })

  test('only changes the target slot (last)', () => {
    const original = generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    const updated = rerollSlot(original, 4, DEFAULT_RESTAURANTS)
    expect(updated.days[0]).toBe(original.days[0])
    expect(updated.days[1]).toBe(original.days[1])
    expect(updated.days[2]).toBe(original.days[2])
    expect(updated.days[3]).toBe(original.days[3])
  })

  test('preserves budget constraint after reroll', () => {
    const original = generateWeeklyPlan(DEFAULT_RESTAURANTS, 600)
    const updated = rerollSlot(original, 2, DEFAULT_RESTAURANTS)
    expect(updated.totalCost).toBeLessThanOrEqual(600)
    expect(updated.weeklyBudget).toBe(600)
  })

  test('does not create backward cuisine violation', () => {
    // Force slots 0,1 to be same cuisine, then reroll slot 2
    const jp1: Restaurant = {
      id: 'jp1',
      name: 'JP1',
      type: 'jp',
      price: 80,
      distance: 100,
      rating: 4.0,
    }
    const jp2: Restaurant = {
      id: 'jp2',
      name: 'JP2',
      type: 'jp',
      price: 90,
      distance: 100,
      rating: 4.0,
    }
    const chi1: Restaurant = {
      id: 'chi1',
      name: 'CHI1',
      type: 'chi',
      price: 70,
      distance: 100,
      rating: 4.0,
    }
    const plan: WeeklyPlan = {
      id: 'test-backward',
      createdAt: '2025-01-01T00:00:00.000Z',
      days: [jp1, jp2, chi1, chi1, chi1],
      totalCost: 380,
      weeklyBudget: 1000,
    }
    // Pool has jp and chi options
    const pool: Restaurant[] = [
      jp1,
      jp2,
      chi1,
      { id: 'kr1', name: 'KR1', type: 'kr', price: 75, distance: 100, rating: 4.0 },
    ]
    for (let i = 0; i < 50; i++) {
      const updated = rerollSlot(plan, 2, pool)
      // slot 2 must not be jp (would create jp,jp,jp at 0,1,2)
      const backwardViolation =
        updated.days[0].type === updated.days[1].type &&
        updated.days[1].type === updated.days[2].type
      expect(backwardViolation, 'backward 3-consecutive violation').toBe(false)
    }
  })

  test('does not create forward cuisine violation', () => {
    // Force slots 3,4 to be same cuisine, then reroll slot 2
    const jp1: Restaurant = {
      id: 'jp1',
      name: 'JP1',
      type: 'jp',
      price: 80,
      distance: 100,
      rating: 4.0,
    }
    const chi1: Restaurant = {
      id: 'chi1',
      name: 'CHI1',
      type: 'chi',
      price: 70,
      distance: 100,
      rating: 4.0,
    }
    const kr1: Restaurant = {
      id: 'kr1',
      name: 'KR1',
      type: 'kr',
      price: 75,
      distance: 100,
      rating: 4.0,
    }
    const plan: WeeklyPlan = {
      id: 'test-forward',
      createdAt: '2025-01-01T00:00:00.000Z',
      days: [chi1, kr1, chi1, jp1, jp1],
      totalCost: 375,
      weeklyBudget: 1000,
    }
    const pool: Restaurant[] = [jp1, chi1, kr1]
    for (let i = 0; i < 50; i++) {
      const updated = rerollSlot(plan, 2, pool)
      // slot 2 must not be jp (would create jp,jp,jp at 2,3,4)
      const forwardViolation =
        updated.days[2].type === updated.days[3].type &&
        updated.days[3].type === updated.days[4].type
      expect(forwardViolation, 'forward 3-consecutive violation').toBe(false)
    }
  })

  test('does not create bridge cuisine violation', () => {
    // Force slot 1 and slot 3 to same cuisine, reroll slot 2
    const jp1: Restaurant = {
      id: 'jp1',
      name: 'JP1',
      type: 'jp',
      price: 80,
      distance: 100,
      rating: 4.0,
    }
    const chi1: Restaurant = {
      id: 'chi1',
      name: 'CHI1',
      type: 'chi',
      price: 70,
      distance: 100,
      rating: 4.0,
    }
    const kr1: Restaurant = {
      id: 'kr1',
      name: 'KR1',
      type: 'kr',
      price: 75,
      distance: 100,
      rating: 4.0,
    }
    const plan: WeeklyPlan = {
      id: 'test-bridge',
      createdAt: '2025-01-01T00:00:00.000Z',
      days: [chi1, jp1, kr1, jp1, chi1],
      totalCost: 375,
      weeklyBudget: 1000,
    }
    const pool: Restaurant[] = [jp1, chi1, kr1]
    for (let i = 0; i < 50; i++) {
      const updated = rerollSlot(plan, 2, pool)
      // slot 2 must not be jp (would create jp,jp,jp at 1,2,3)
      const bridgeViolation =
        updated.days[1].type === updated.days[2].type &&
        updated.days[2].type === updated.days[3].type
      expect(bridgeViolation, 'bridge 3-consecutive violation').toBe(false)
    }
  })

  // Statistical validation
  test('budget and cuisine constraints hold over 100 rerolls', () => {
    for (let i = 0; i < 100; i++) {
      const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 700)
      const slot = Math.floor(Math.random() * 5)
      const updated = rerollSlot(plan, slot, DEFAULT_RESTAURANTS)
      expect(updated.totalCost).toBeLessThanOrEqual(700)
      for (let j = 2; j < updated.days.length; j++) {
        const triple =
          updated.days[j].type === updated.days[j - 1].type &&
          updated.days[j].type === updated.days[j - 2].type
        expect(triple).toBe(false)
      }
    }
  })
})

describe('applyFilter', () => {
  const testPool: Restaurant[] = [
    { id: 'chi1', name: 'CHI1', type: 'chi', price: 80, distance: 100, rating: 4.0 },
    { id: 'jp1', name: 'JP1', type: 'jp', price: 90, distance: 200, rating: 4.2 },
    { id: 'kr1', name: 'KR1', type: 'kr', price: 75, distance: 150, rating: 4.1 },
    { id: 'tai1', name: 'TAI1', type: 'tai', price: 70, distance: 300, rating: 3.9 },
    { id: 'west1', name: 'WEST1', type: 'west', price: 120, distance: 250, rating: 4.5 },
  ]

  test("exclude mode removes Japanese restaurants", () => {
    const result = applyFilter(testPool, 'exclude', ['jp'])
    expect(result).toHaveLength(4)
    expect(result.every(r => r.type !== 'jp')).toBe(true)
  })

  test("exclude mode removes multiple cuisine types", () => {
    const result = applyFilter(testPool, 'exclude', ['jp', 'kr'])
    expect(result).toHaveLength(3)
    expect(result.every(r => r.type !== 'jp' && r.type !== 'kr')).toBe(true)
  })

  test("lock mode keeps only Chinese restaurants", () => {
    const result = applyFilter(testPool, 'lock', ['chi'])
    expect(result).toHaveLength(1)
    expect(result.every(r => r.type === 'chi')).toBe(true)
  })

  test("lock mode keeps Chinese and Western restaurants", () => {
    const result = applyFilter(testPool, 'lock', ['chi', 'west'])
    expect(result).toHaveLength(2)
    expect(result.every(r => r.type === 'chi' || r.type === 'west')).toBe(true)
  })

  test("exclude mode with empty selected returns full pool", () => {
    const result = applyFilter(testPool, 'exclude', [])
    expect(result).toHaveLength(5)
    expect(result).toEqual(testPool)
  })

  test("lock mode with empty selected returns full pool", () => {
    const result = applyFilter(testPool, 'lock', [])
    expect(result).toHaveLength(5)
    expect(result).toEqual(testPool)
  })
})

describe('relaxDiversity', () => {
  const chiPool: Restaurant[] = [
    { id: 'chi1', name: 'CHI1', type: 'chi', price: 80, distance: 100, rating: 4.0 },
    { id: 'chi2', name: 'CHI2', type: 'chi', price: 90, distance: 120, rating: 4.1 },
    { id: 'chi3', name: 'CHI3', type: 'chi', price: 70, distance: 130, rating: 3.9 },
    { id: 'chi4', name: 'CHI4', type: 'chi', price: 85, distance: 140, rating: 4.2 },
    { id: 'chi5', name: 'CHI5', type: 'chi', price: 75, distance: 150, rating: 4.0 },
  ]

  test('generateWeeklyPlan with relaxDiversity returns valid plan from single-cuisine pool', () => {
    const plan = generateWeeklyPlan(chiPool, 1000, { relaxDiversity: true })
    expect(plan.days).toHaveLength(5)
    expect(plan.totalCost).toBeLessThanOrEqual(1000)
  })

  test('rerollSlot with relaxDiversity returns valid plan from single-cuisine pool', () => {
    const plan = generateWeeklyPlan(chiPool, 1000, { relaxDiversity: true })
    const updated = rerollSlot(plan, 2, chiPool, { relaxDiversity: true })
    expect(updated.days).toHaveLength(5)
    expect(updated.totalCost).toBeLessThanOrEqual(1000)
  })

  test('existing behavior unchanged — mixed pool without relaxDiversity still avoids 3-consecutive violations', () => {
    for (let i = 0; i < 20; i++) {
      const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 1000)
      for (let j = 2; j < plan.days.length; j++) {
        const triple =
          plan.days[j].type === plan.days[j - 1].type &&
          plan.days[j].type === plan.days[j - 2].type
        expect(triple, `3-consecutive violation at index ${j}`).toBe(false)
      }
    }
  })
})
