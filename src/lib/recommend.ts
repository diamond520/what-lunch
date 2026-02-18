import type { Restaurant } from './types'

export interface WeeklyPlan {
  days: Restaurant[]
  totalCost: number
  weeklyBudget: number
}

function hasCuisineViolation(
  plan: Restaurant[],
  slotIndex: number,
  candidate: Restaurant,
): boolean {
  const prev1 = plan[slotIndex - 1]
  const prev2 = plan[slotIndex - 2]

  // Would this be the 3rd consecutive same cuisine?
  if (prev1 && prev2 && prev1.type === candidate.type && prev2.type === candidate.type) {
    return true
  }

  return false
}

function cheapestPrice(pool: Restaurant[]): number {
  return Math.min(...pool.map((r) => r.price))
}

function pickForSlot(
  pool: Restaurant[],
  remainingBudget: number,
  planSoFar: Restaurant[],
  slotIndex: number,
  slotsRemaining: number,
): Restaurant {
  // Reserve budget for future slots (each future slot needs at least cheapest price)
  const futureSlots = slotsRemaining - 1
  const minFutureReserve = futureSlots > 0 ? futureSlots * cheapestPrice(pool) : 0
  const spendableNow = remainingBudget - minFutureReserve

  // Filter to eligible: affordable (leaving enough for future) AND no cuisine violation
  const eligible = pool.filter(
    (r) =>
      r.price <= spendableNow &&
      !hasCuisineViolation(planSoFar, slotIndex, r),
  )

  if (eligible.length > 0) {
    return eligible[Math.floor(Math.random() * eligible.length)]
  }

  // Fallback 1: relax cuisine constraint, keep budget constraint (with future reserve)
  const affordable = pool
    .filter((r) => r.price <= spendableNow)
    .sort((a, b) => a.price - b.price)
  if (affordable.length > 0) return affordable[0]

  // Fallback 2: relax cuisine + use full remaining budget (budget impossible to fully satisfy)
  // Use cheapest that fits in remaining budget
  const fitsInBudget = pool
    .filter((r) => r.price <= remainingBudget)
    .sort((a, b) => a.price - b.price)
  if (fitsInBudget.length > 0) return fitsInBudget[0]

  // Fallback 3: truly impossible budget — use globally cheapest to minimise damage
  return pool.slice().sort((a, b) => a.price - b.price)[0]
}

export function generateWeeklyPlan(
  pool: Restaurant[],
  weeklyBudget: number,
): WeeklyPlan {
  if (pool.length === 0) {
    throw new Error('Restaurant pool cannot be empty')
  }

  const DAYS = 5
  const days: Restaurant[] = []
  let remainingBudget = weeklyBudget

  for (let i = 0; i < DAYS; i++) {
    const slotsRemaining = DAYS - i
    const pick = pickForSlot(pool, remainingBudget, days, i, slotsRemaining)
    days.push(pick)
    remainingBudget -= pick.price
  }

  return {
    days,
    totalCost: weeklyBudget - remainingBudget,
    weeklyBudget,
  }
}
