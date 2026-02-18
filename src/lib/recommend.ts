import type { Restaurant } from './types'

export interface WeeklyPlan {
  days: Restaurant[]
  totalCost: number
  weeklyBudget: number
}

export function generateWeeklyPlan(
  pool: Restaurant[],
  weeklyBudget: number,
): WeeklyPlan {
  throw new Error('Not implemented')
}
