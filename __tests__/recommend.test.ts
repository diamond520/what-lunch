import { describe, test, expect } from 'vitest'
import { generateWeeklyPlan, type WeeklyPlan } from '@/lib/recommend'
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
        plan.days[i].type === plan.days[i - 1].type &&
        plan.days[i].type === plan.days[i - 2].type
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

  test('handles minimum satisfiable budget (325 = 5 x 65)', () => {
    const plan = generateWeeklyPlan(DEFAULT_RESTAURANTS, 325)
    expect(plan.days).toHaveLength(5)
    expect(plan.totalCost).toBeLessThanOrEqual(325)
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
      { id: 'only', name: 'Only', type: 'chi', price: 100, distance: 50 },
    ]
    const plan = generateWeeklyPlan(single, 1000)
    expect(plan.days).toHaveLength(5)
    expect(plan.days.every(d => d.id === 'only')).toBe(true)
  })

  test('handles pool with all same cuisine type', () => {
    const sameCuisine: Restaurant[] = [
      { id: 'a', name: 'A', type: 'jp', price: 80, distance: 100 },
      { id: 'b', name: 'B', type: 'jp', price: 90, distance: 200 },
      { id: 'c', name: 'C', type: 'jp', price: 70, distance: 150 },
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
          plan.days[j].type === plan.days[j - 1].type &&
          plan.days[j].type === plan.days[j - 2].type
        expect(threeConsecutive).toBe(false)
      }
    }
  })

  test('produces varied results (not deterministic)', () => {
    const plans = Array.from({ length: 20 }, () =>
      generateWeeklyPlan(DEFAULT_RESTAURANTS, 750)
    )
    const uniqueFirstPicks = new Set(plans.map(p => p.days[0].id))
    expect(uniqueFirstPicks.size).toBeGreaterThan(1)
  })
})
