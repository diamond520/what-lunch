'use client'

import { useState } from 'react'
import { Trash2, Save, Check } from 'lucide-react'
import { useRestaurants } from '@/lib/restaurant-context'
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'
import { CUISINE_META } from '@/lib/types'
import type { CuisineType } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function RestaurantsPage() {
  const { restaurants, isHydrated, addRestaurant, removeRestaurant } = useRestaurants()

  const [name, setName] = useState('')
  const [cuisineType, setCuisineType] = useState<CuisineType>('chi')
  const [price, setPrice] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [priceError, setPriceError] = useState('')
  const [distanceError, setDistanceError] = useState('')
  const [ratingError, setRatingError] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const defaultNames = new Set(DEFAULT_RESTAURANTS.map((r) => r.name))

  async function handleSaveToConfig(r: (typeof restaurants)[number]) {
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant: r }),
      })
      if (res.ok) {
        setSavedIds((prev) => new Set(prev).add(r.id))
      } else {
        const data = await res.json()
        alert(data.error ?? '儲存失敗')
      }
    } catch {
      alert('無法連線到 API，請確認 dev server 正在執行')
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.valueAsNumber
    if (isNaN(val) && e.target.value !== '') {
      setPriceError('價格必須是數字')
      setPrice(null)
    } else {
      setPriceError('')
      setPrice(isNaN(val) ? null : val)
    }
  }

  function handleDistanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.valueAsNumber
    if (isNaN(val) && e.target.value !== '') {
      setDistanceError('距離必須是數字')
      setDistance(null)
    } else {
      setDistanceError('')
      setDistance(isNaN(val) ? null : val)
    }
  }

  function handleRatingChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.valueAsNumber
    if (isNaN(val) && e.target.value !== '') {
      setRatingError('評分必須是數字')
      setRating(null)
    } else {
      setRatingError('')
      setRating(isNaN(val) ? null : val)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let valid = true

    if (!name.trim()) {
      valid = false
    }

    if (price === null || isNaN(price)) {
      setPriceError('請輸入有效的價格')
      valid = false
    } else {
      setPriceError('')
    }

    if (distance === null || isNaN(distance)) {
      setDistanceError('請輸入有效的距離')
      valid = false
    } else {
      setDistanceError('')
    }

    if (rating === null || isNaN(rating)) {
      setRatingError('請輸入有效的評分')
      valid = false
    } else {
      setRatingError('')
    }

    if (!valid) return

    addRestaurant({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: cuisineType,
      price: price!,
      distance: distance!,
      rating: rating!,
    })

    setName('')
    setCuisineType('chi')
    setPrice(null)
    setDistance(null)
    setRating(null)
    setPriceError('')
    setDistanceError('')
    setRatingError('')
  }

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">餐廳管理</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">餐廳管理</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>料理類型</TableHead>
            <TableHead>價格 (NT$)</TableHead>
            <TableHead>距離 (m)</TableHead>
            <TableHead>評分</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                尚無餐廳資料
              </TableCell>
            </TableRow>
          ) : (
            restaurants.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: CUISINE_META[r.type].color }}
                  >
                    {CUISINE_META[r.type].label}
                  </span>
                </TableCell>
                <TableCell>{r.price}</TableCell>
                <TableCell>{r.distance}</TableCell>
                <TableCell>{r.rating}</TableCell>
                <TableCell className="flex gap-1">
                  {defaultNames.has(r.name) || savedIds.has(r.id) ? (
                    <Button variant="ghost" size="icon" disabled title="已儲存至 config">
                      <Check className="size-4 text-green-500" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSaveToConfig(r)}
                      title="儲存至 restaurants.ts"
                    >
                      <Save className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => removeRestaurant(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <h2 className="text-lg font-semibold mt-8 mb-4">新增餐廳</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">名稱</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="餐廳名稱"
              required
            />
          </div>
          <div>
            <Label htmlFor="cuisine">料理類型</Label>
            <Select value={cuisineType} onValueChange={(v) => setCuisineType(v as CuisineType)}>
              <SelectTrigger>
                <SelectValue placeholder="選擇料理類型" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(CUISINE_META) as [CuisineType, { label: string; color: string }][]
                ).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="price">價格 (NT$)</Label>
            <Input
              id="price"
              type="number"
              step="1"
              min="0"
              placeholder="例: 100"
              onChange={handlePriceChange}
              value={price ?? ''}
            />
            {priceError && <p className="text-sm text-destructive">{priceError}</p>}
          </div>
          <div>
            <Label htmlFor="distance">距離 (m)</Label>
            <Input
              id="distance"
              type="number"
              step="1"
              min="0"
              placeholder="例: 150"
              onChange={handleDistanceChange}
              value={distance ?? ''}
            />
            {distanceError && <p className="text-sm text-destructive">{distanceError}</p>}
          </div>
          <div>
            <Label htmlFor="rating">評分</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="1"
              max="5"
              placeholder="例: 4.5"
              onChange={handleRatingChange}
              value={rating ?? ''}
            />
            {ratingError && <p className="text-sm text-destructive">{ratingError}</p>}
          </div>
        </div>
        <Button type="submit" className="mt-4">
          新增
        </Button>
      </form>
    </div>
  )
}
