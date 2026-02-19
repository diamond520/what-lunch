'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRestaurants } from '@/lib/restaurant-context'
import { pickRandomRestaurant } from '@/lib/recommend'
import { CUISINE_META } from '@/lib/types'
import type { Restaurant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function WeekendPage() {
  const { weekendRestaurants, isHydrated } = useRestaurants()
  const [current, setCurrent] = useState<Restaurant | null>(null)

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">假日推薦</h1>
      </div>
    )
  }

  if (weekendRestaurants.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">假日推薦</h1>
        <p className="text-muted-foreground mb-4">尚未新增假日餐廳</p>
        <Link href="/restaurants" className="text-primary underline underline-offset-4">
          前往餐廳管理新增假日餐廳（切換至「假日餐廳」分頁）
        </Link>
      </div>
    )
  }

  function handleRoll() {
    setCurrent(pickRandomRestaurant(weekendRestaurants))
  }

  function handleReroll() {
    if (weekendRestaurants.length === 0) return
    const pool =
      weekendRestaurants.length > 1
        ? weekendRestaurants.filter((r) => r.id !== current?.id)
        : weekendRestaurants
    setCurrent(pickRandomRestaurant(pool))
  }

  async function handleCopyWeekend() {
    if (!current) return
    if (!navigator.clipboard) {
      toast.error('複製失敗，請手動複製')
      return
    }
    const text = [
      '假日推薦 🍽️',
      `${current.name} ${CUISINE_META[current.type].label} NT$${current.price}`,
      `距離：${current.distance}m｜評分：${current.rating}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast('已複製到剪貼簿 ✓')
    } catch {
      toast.error('複製失敗，請手動複製')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">假日推薦</h1>

      <div className="flex gap-3 mb-8">
        <Button onClick={handleRoll}>隨機推薦</Button>
        {current !== null && (
          <>
            <Button variant="outline" onClick={handleReroll}>
              換一間
            </Button>
            <Button variant="outline" onClick={handleCopyWeekend}>
              <Copy className="size-4 mr-1" />
              複製
            </Button>
          </>
        )}
      </div>

      {current !== null && (
        <div className="rounded-lg border bg-card p-6 shadow-sm max-w-sm">
          <h2 className="text-xl font-semibold mb-3">{current.name}</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: CUISINE_META[current.type].color }}
            >
              {CUISINE_META[current.type].label}
            </span>
          </div>
          <dl className="space-y-1 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">價格</dt>
              <dd>NT$ {current.price}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">距離</dt>
              <dd>{current.distance}m</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">評分</dt>
              <dd>{current.rating}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
