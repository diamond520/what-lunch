'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRestaurants } from '@/lib/restaurant-context'
import { CUISINE_META } from '@/lib/types'
import type { CuisineType } from '@/lib/types'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

export default function RestaurantsPage() {
  const { restaurants, addRestaurant, removeRestaurant } = useRestaurants()

  const [name, setName] = useState('')
  const [cuisineType, setCuisineType] = useState<CuisineType>('chi')
  const [price, setPrice] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [priceError, setPriceError] = useState('')
  const [distanceError, setDistanceError] = useState('')

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

    if (!valid) return

    addRestaurant({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: cuisineType,
      price: price!,
      distance: distance!,
    })

    setName('')
    setCuisineType('chi')
    setPrice(null)
    setDistance(null)
    setPriceError('')
    setDistanceError('')
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
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRestaurant(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
                {(Object.entries(CUISINE_META) as [CuisineType, { label: string; color: string }][]).map(
                  ([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  )
                )}
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
        </div>
        <Button type="submit" className="mt-4">新增</Button>
      </form>
    </div>
  )
}
