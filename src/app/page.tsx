'use client'

import { useState } from 'react'
import { useRestaurants } from '@/lib/restaurant-context'
import { generateWeeklyPlan, rerollSlot, type WeeklyPlan } from '@/lib/recommend'
import { CUISINE_META } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'

const DAY_LABELS = ['星期一', '星期二', '星期三', '星期四', '星期五']
const DEFAULT_BUDGET = 750
const BUDGET_MIN = 100
const BUDGET_MAX = 2000
const BUDGET_STEP = 10
const MAX_HISTORY = 5

export default function HomePage() {
  const { restaurants, isHydrated } = useRestaurants()
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET)
  const [history, setHistory] = useState<WeeklyPlan[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  const plan = history.length > 0 ? history[selectedIndex] : null

  function handleGenerate() {
    if (restaurants.length === 0 || isNaN(budget)) return
    const newPlan = generateWeeklyPlan(restaurants, budget)
    setHistory((prev) => [newPlan, ...prev].slice(0, MAX_HISTORY))
    setSelectedIndex(0)
  }

  function handleReroll(index: number) {
    if (!plan) return
    const updated = rerollSlot(plan, index, restaurants)
    setHistory((prev) => prev.map((p, i) => (i === selectedIndex ? updated : p)))
  }

  if (!isHydrated) {
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
        <Button onClick={handleGenerate} disabled={restaurants.length === 0}>
          產生本週午餐計畫
        </Button>
        {restaurants.length === 0 && (
          <span className="text-sm text-muted-foreground">（請先新增餐廳）</span>
        )}
      </div>

      {plan !== null && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {plan.days.map((r, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">{DAY_LABELS[i]}</p>
                <p className="font-semibold">{r.name}</p>
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white w-fit"
                  style={{ backgroundColor: CUISINE_META[r.type].color }}
                >
                  {CUISINE_META[r.type].label}
                </span>
                <p className="text-sm">NT$ {r.price}</p>
                <p className="text-sm text-muted-foreground">
                  {r.distance} m・⭐ {r.rating}
                </p>
                <Button variant="outline" size="sm" onClick={() => handleReroll(i)}>
                  <RefreshCw className="size-3 mr-1" />
                  重抽
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            本週總花費：NT$ {plan.totalCost}　剩餘預算：NT$ {plan.weeklyBudget - plan.totalCost}
          </p>
        </>
      )}

      {history.length > 1 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">歷史計畫</h2>
          <ul className="space-y-2">
            {history.map((h, i) => (
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
