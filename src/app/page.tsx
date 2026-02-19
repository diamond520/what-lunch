'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRestaurants } from '@/lib/restaurant-context'
import { useHistory } from '@/lib/history-context'
import { generateWeeklyPlan, rerollSlot, applyFilter, type FilterMode, type WeeklyPlan } from '@/lib/recommend'
import { getRecentlyVisitedIds, splitPoolByHistory, type LunchHistoryEntry } from '@/lib/history'
import { CUISINE_META, type CuisineType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { RefreshCw, Copy } from 'lucide-react'
import { toast } from 'sonner'

const DAY_LABELS = ['星期一', '星期二', '星期三', '星期四', '星期五']
const DEFAULT_BUDGET = 750
const BUDGET_MIN = 100
const BUDGET_MAX = 2000
const BUDGET_STEP = 10
const MAX_HISTORY = 5
const FILTER_STORAGE_KEY = 'what-lunch-cuisine-filter'
const POOL_WARNING_THRESHOLD = 5

interface StoredFilter {
  mode: FilterMode
  selected: CuisineType[]
}

const CUISINE_TYPE_MIGRATIONS: Record<string, CuisineType> = { tai: 'thai' }

function readStoredFilter(): StoredFilter {
  if (typeof window === 'undefined') return { mode: 'exclude', selected: [] }
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY)
    if (!stored) return { mode: 'exclude', selected: [] }
    const parsed = JSON.parse(stored) as StoredFilter
    parsed.selected = parsed.selected
      .map((t) => CUISINE_TYPE_MIGRATIONS[t] ?? t)
      .filter((t): t is CuisineType => t in CUISINE_META)
    return parsed
  } catch {
    return { mode: 'exclude', selected: [] }
  }
}

function formatWeeklyPlan(plan: WeeklyPlan): string {
  const lines = plan.days.map(
    (r, i) => `${DAY_LABELS[i]}｜${r.name} ${CUISINE_META[r.type].label} NT$${r.price}`,
  )
  return ['本週午餐計畫 🍱', ...lines, `總花費：NT$${plan.totalCost}`].join('\n')
}

export default function HomePage() {
  const { restaurants, isHydrated } = useRestaurants()
  const { entries, addEntries, lookbackDays, isHydrated: historyHydrated } = useHistory()
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET)
  const [planHistory, setPlanHistory] = useState<WeeklyPlan[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [filterMode, setFilterMode] = useState<FilterMode>(() => readStoredFilter().mode)
  const [selectedCuisines, setSelectedCuisines] = useState<Set<CuisineType>>(
    () => new Set(readStoredFilter().selected),
  )

  // Animation state — separate from plan (never mutate plan for animation display)
  const [displayNames, setDisplayNames] = useState<(string | null)[]>(Array(5).fill(null))
  const [animatingSlots, setAnimatingSlots] = useState<Set<number>>(new Set())
  const genIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const genTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rerollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rerollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const plan = planHistory.length > 0 ? planHistory[selectedIndex] : null

  const filteredPool = applyFilter(restaurants, filterMode, [...selectedCuisines])

  // History-aware pool: deprioritize recently visited restaurants
  const recentIds = getRecentlyVisitedIds(entries, lookbackDays)
  const { primary, fallback } = splitPoolByHistory(filteredPool, recentIds)
  const effectivePool = primary.length > 0 ? primary : fallback

  const allRestaurantNames = useMemo(() => restaurants.map(r => r.name), [restaurants])

  const ready = isHydrated && historyHydrated
  const showWarning = isHydrated && selectedCuisines.size > 0 && filteredPool.length < POOL_WARNING_THRESHOLD
  const relaxDiversity = filterMode === 'lock' && selectedCuisines.size === 1

  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({ mode: filterMode, selected: [...selectedCuisines] }),
      )
    } catch {
      // Ignore storage errors
    }
  }, [filterMode, selectedCuisines, isHydrated])

  function handleFilterModeChange(newMode: string) {
    setFilterMode(newMode as FilterMode)
    setPlanHistory([])
    setSelectedIndex(0)
  }

  function toggleCuisine(cuisine: CuisineType) {
    setSelectedCuisines((prev) => {
      const next = new Set(prev)
      if (next.has(cuisine)) {
        next.delete(cuisine)
      } else {
        next.add(cuisine)
      }
      return next
    })
    setPlanHistory([])
    setSelectedIndex(0)
  }

  function resetFilter() {
    setFilterMode('exclude')
    setSelectedCuisines(new Set())
    setPlanHistory([])
    setSelectedIndex(0)
  }

  function stopGenAnimation() {
    if (genIntervalRef.current) clearInterval(genIntervalRef.current)
    if (genTimeoutRef.current) clearTimeout(genTimeoutRef.current)
    genIntervalRef.current = null
    genTimeoutRef.current = null
  }

  function stopRerollAnimation() {
    if (rerollIntervalRef.current) clearInterval(rerollIntervalRef.current)
    if (rerollTimeoutRef.current) clearTimeout(rerollTimeoutRef.current)
    rerollIntervalRef.current = null
    rerollTimeoutRef.current = null
  }

  function handleGenerate() {
    if (effectivePool.length === 0 || isNaN(budget)) return
    if (allRestaurantNames.length === 0) return
    const newPlan = generateWeeklyPlan(effectivePool, budget, { relaxDiversity })
    setPlanHistory((prev) => [newPlan, ...prev].slice(0, MAX_HISTORY))
    setSelectedIndex(0)

    stopGenAnimation()
    stopRerollAnimation()
    setAnimatingSlots(new Set([0, 1, 2, 3, 4]))

    let idx = 0
    genIntervalRef.current = setInterval(() => {
      idx++
      setDisplayNames(
        Array.from({ length: 5 }, (_, i) =>
          allRestaurantNames[(idx + i * 3) % allRestaurantNames.length] ?? null
        )
      )
    }, 80)

    genTimeoutRef.current = setTimeout(() => {
      stopGenAnimation()
      setDisplayNames(Array(5).fill(null))
      setAnimatingSlots(new Set())
    }, 2500)
  }

  function handleReroll(index: number) {
    if (!plan) return
    const updated = rerollSlot(plan, index, effectivePool, { relaxDiversity })
    setPlanHistory((prev) => prev.map((p, i) => (i === selectedIndex ? updated : p)))

    stopRerollAnimation()
    setAnimatingSlots(new Set([index]))

    let idx = 0
    rerollIntervalRef.current = setInterval(() => {
      idx++
      setDisplayNames((prev) => {
        const next = [...prev]
        next[index] = allRestaurantNames[idx % allRestaurantNames.length] ?? null
        return next
      })
    }, 80)

    rerollTimeoutRef.current = setTimeout(() => {
      stopRerollAnimation()
      setDisplayNames((prev) => {
        const next = [...prev]
        next[index] = null
        return next
      })
      setAnimatingSlots(new Set())
    }, 2500)
  }

  function handleConfirmPlan() {
    if (!plan) return
    const today = new Date().toLocaleDateString('sv') // 'sv' locale gives YYYY-MM-DD in local time
    const newEntries: LunchHistoryEntry[] = plan.days.map((r) => ({
      id: crypto.randomUUID(),
      date: today,
      restaurantId: r.id,
      restaurantName: r.name,
    }))
    addEntries(newEntries)
  }

  async function handleCopy() {
    if (!plan) return
    if (!navigator.clipboard) {
      toast.error('複製失敗，請手動複製')
      return
    }
    try {
      await navigator.clipboard.writeText(formatWeeklyPlan(plan))
      toast('已複製到剪貼簿 ✓')
    } catch {
      toast.error('複製失敗，請手動複製')
    }
  }

  const isAnyAnimating = animatingSlots.size > 0

  useEffect(() => {
    if (!isAnyAnimating) return
    const handler = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code)) {
        e.preventDefault()
        stopGenAnimation()
        stopRerollAnimation()
        setDisplayNames(Array(5).fill(null))
        setAnimatingSlots(new Set())
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isAnyAnimating])

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">每週午餐推薦</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">每週午餐推薦</h1>

      <div className="flex items-center gap-4 mb-6">
        <Label htmlFor="budget">每週預算 (NT$)</Label>
        <Input
          id="budget"
          type="number"
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          step={BUDGET_STEP}
          value={budget}
          onChange={(e) => setBudget(e.target.valueAsNumber)}
          className="w-32"
        />
        <Button onClick={handleGenerate} disabled={restaurants.length === 0 || effectivePool.length === 0 || isAnyAnimating}>
          產生本週午餐計畫
        </Button>
        {restaurants.length === 0 && (
          <span className="text-sm text-muted-foreground">（請先新增餐廳）</span>
        )}
      </div>

      {/* Cuisine filter section */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filterMode} onValueChange={handleFilterModeChange}>
            <TabsList>
              <TabsTrigger value="exclude" disabled={isAnyAnimating}>排除</TabsTrigger>
              <TabsTrigger value="lock" disabled={isAnyAnimating}>鎖定</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            {(Object.entries(CUISINE_META) as [CuisineType, { label: string; color: string }][]).map(
              ([key, meta]) => (
                <button
                  key={key}
                  onClick={() => toggleCuisine(key)}
                  disabled={isAnyAnimating}
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white transition-all',
                    selectedCuisines.has(key)
                      ? 'opacity-100 ring-2 ring-offset-2 ring-offset-background'
                      : 'opacity-40 hover:opacity-60',
                  )}
                  style={{
                    backgroundColor: meta.color,
                    ...(selectedCuisines.has(key) ? ({ '--tw-ring-color': meta.color } as React.CSSProperties) : {}),
                  }}
                  aria-pressed={selectedCuisines.has(key)}
                >
                  {meta.label}
                </button>
              ),
            )}
          </div>

          {selectedCuisines.size > 0 && (
            <button
              onClick={resetFilter}
              disabled={isAnyAnimating}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              重置
            </button>
          )}
        </div>

        {showWarning && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {filteredPool.length === 0
              ? '目前篩選條件下沒有符合的餐廳，請調整篩選條件'
              : `目前篩選條件下只有 ${filteredPool.length} 家餐廳，可能無法填滿 5 天`}
          </p>
        )}
      </div>

      {plan !== null && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {plan.days.map((r, i) => {
              const slotIsAnimating = animatingSlots.has(i)
              const nameToShow = slotIsAnimating && displayNames[i] !== null
                ? displayNames[i]!
                : r.name
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg border bg-card p-4 flex flex-col gap-2',
                    slotIsAnimating && 'cursor-pointer',
                  )}
                  onClick={slotIsAnimating ? () => {
                    stopGenAnimation()
                    stopRerollAnimation()
                    setDisplayNames(Array(5).fill(null))
                    setAnimatingSlots(new Set())
                  } : undefined}
                >
                  <p className="text-sm font-medium text-muted-foreground">{DAY_LABELS[i]}</p>
                  <p className="font-semibold">{nameToShow}</p>
                  {slotIsAnimating ? (
                    <>
                      <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </>
                  ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white w-fit"
                        style={{ backgroundColor: CUISINE_META[r.type].color }}
                      >
                        {CUISINE_META[r.type].label}
                      </span>
                      <p className="text-sm">NT$ {r.price}</p>
                      <p className="text-sm text-muted-foreground">{r.distance} m・⭐ {r.rating}</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleReroll(i)} disabled={isAnyAnimating}>
                    <RefreshCw className="size-3 mr-1" />
                    重抽
                  </Button>
                  {slotIsAnimating && (
                    <p className="text-xs text-muted-foreground text-center">點擊跳過</p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              本週總花費：NT$ {plan.totalCost}　剩餘預算：NT$ {plan.weeklyBudget - plan.totalCost}
            </p>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="size-4 mr-1" />
              複製計畫
            </Button>
          </div>
          <div className="mt-4 space-y-1">
            <Button variant="outline" onClick={handleConfirmPlan}>
              確認本週計畫
            </Button>
            <p className="text-xs text-muted-foreground">
              確認後，本週餐廳將加入歷史，未來推薦將避免重複
            </p>
          </div>
        </>
      )}

      {planHistory.length > 1 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">歷史計畫</h2>
          <ul className="space-y-2">
            {planHistory.map((h, i) => (
              <li key={h.id}>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md border text-sm ${
                    i === selectedIndex
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedIndex(i)}
                >
                  <span>
                    {new Date(h.createdAt).toLocaleString('zh-TW')} — NT$ {h.totalCost} /{' '}
                    {h.weeklyBudget}
                  </span>
                  {i === selectedIndex && (
                    <span className="ml-2 text-primary text-xs">（目前檢視）</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
