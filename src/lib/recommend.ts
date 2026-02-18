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
  const next1 = plan[slotIndex + 1]
  const next2 = plan[slotIndex + 2]

  // Backward: would this be 3rd consecutive (prev2, prev1, candidate)?
  if (prev1 && prev2 && prev1.type === candidate.type && prev2.type === candidate.type) {
    return true
  }

  // Forward: would this start a triple (candidate, next1, next2)?
  if (next1 && next2 && next1.type === candidate.type && next2.type === candidate.type) {
    return true
  }

  // Bridge: would this create a triple in the middle (prev1, candidate, next1)?
  if (prev1 && next1 && prev1.type === candidate.type && next1.type === candidate.type) {
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

function pickForSlotReroll(
  pool: Restaurant[],
  remaining: number,
  fullPlan: Restaurant[],
  slotIndex: number,
): Restaurant {
  // Filter to eligible: affordable AND no cuisine violation (using full plan for neighbor checks)
  const eligible = pool.filter(
    (r) =>
      r.price <= remaining &&
      !hasCuisineViolation(fullPlan, slotIndex, r),
  )

  if (eligible.length > 0) {
    return eligible[Math.floor(Math.random() * eligible.length)]
  }

  // Fallback 1: relax cuisine constraint, keep budget
  const affordable = pool
    .filter((r) => r.price <= remaining)
    .sort((a, b) => a.price - b.price)
  if (affordable.length > 0) return affordable[0]

  // Fallback 2: globally cheapest
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

export function rerollSlot(
  plan: WeeklyPlan,
  slotIndex: number,
  pool: Restaurant[],
): WeeklyPlan {
  // Calculate budget available for the new pick (total budget minus cost of all other days)
  const othersCost = plan.days.reduce((sum, r, i) => i === slotIndex ? sum : sum + r.price, 0)
  const remaining = plan.weeklyBudget - othersCost

  // Pick a new restaurant for this slot using the full plan for bidirectional cuisine checking
  const pick = pickForSlotReroll(pool, remaining, plan.days, slotIndex)

  const newDays = [...plan.days]
  newDays[slotIndex] = pick

  return {
    days: newDays,
    totalCost: newDays.reduce((sum, r) => sum + r.price, 0),
    weeklyBudget: plan.weeklyBudget,
  }
}
