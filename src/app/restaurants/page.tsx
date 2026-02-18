'use client'

import { useState } from 'react'
import { Trash2, Save, Check, Pencil, X } from 'lucide-react'
import { useRestaurants } from '@/lib/restaurant-context'
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'
import { CUISINE_META } from '@/lib/types'
import type { CuisineType, Restaurant } from '@/lib/types'
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

interface FormState {
  name: string
  cuisineType: CuisineType
  price: string
  distance: string
  rating: string
}

interface FormErrors {
  name: string
  price: string
  distance: string
  rating: string
}

const EMPTY_FORM: FormState = {
  name: '',
  cuisineType: 'chi',
  price: '',
  distance: '',
  rating: '',
}

const EMPTY_ERRORS: FormErrors = { name: '', price: '', distance: '', rating: '' }

function validateFields(f: FormState): FormErrors {
  const errors: FormErrors = { name: '', price: '', distance: '', rating: '' }

  if (!f.name.trim()) {
    errors.name = '請輸入餐廳名稱'
  }

  const price = Number(f.price)
  if (f.price === '' || isNaN(price)) {
    errors.price = '請輸入有效的價格'
  } else if (price <= 0) {
    errors.price = '價格必須大於 0'
  }

  const distance = Number(f.distance)
  if (f.distance === '' || isNaN(distance)) {
    errors.distance = '請輸入有效的距離'
  } else if (distance < 0) {
    errors.distance = '距離不可為負數'
  }

  const rating = Number(f.rating)
  if (f.rating === '' || isNaN(rating)) {
    errors.rating = '請輸入有效的評分'
  } else if (rating < 1.0 || rating > 5.0) {
    errors.rating = '評分必須介於 1.0 與 5.0 之間'
  }

  return errors
}

function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some((e) => e !== '')
}

function formToRestaurant(f: FormState, id: string): Restaurant {
  return {
    id,
    name: f.name.trim(),
    type: f.cuisineType,
    price: Number(f.price),
    distance: Number(f.distance),
    rating: Number(f.rating),
  }
}

function restaurantToForm(r: Restaurant): FormState {
  return {
    name: r.name,
    cuisineType: r.type,
    price: String(r.price),
    distance: String(r.distance),
    rating: String(r.rating),
  }
}

export default function RestaurantsPage() {
  const { restaurants, isHydrated, addRestaurant, removeRestaurant, updateRestaurant } =
    useRestaurants()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [editErrors, setEditErrors] = useState<FormErrors>(EMPTY_ERRORS)

  const [search, setSearch] = useState('')
  const [filterCuisine, setFilterCuisine] = useState<CuisineType | 'all'>('all')

  const defaultNames = new Set(DEFAULT_RESTAURANTS.map((r) => r.name))

  const filteredRestaurants = restaurants.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(search.toLowerCase())
    const cuisineMatch = filterCuisine === 'all' || r.type === filterCuisine
    return nameMatch && cuisineMatch
  })

  async function handleSaveToConfig(r: Restaurant) {
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateFields(form)
    setErrors(errs)
    if (hasErrors(errs)) return

    addRestaurant(formToRestaurant(form, crypto.randomUUID()))
    setForm(EMPTY_FORM)
    setErrors(EMPTY_ERRORS)
  }

  function handleEditStart(r: Restaurant) {
    setEditingId(r.id)
    setEditForm(restaurantToForm(r))
    setEditErrors(EMPTY_ERRORS)
  }

  function handleEditSave() {
    if (!editingId) return
    const errs = validateFields(editForm)
    setEditErrors(errs)
    if (hasErrors(errs)) return

    updateRestaurant(formToRestaurant(editForm, editingId))
    setEditingId(null)
    setEditErrors(EMPTY_ERRORS)
  }

  function handleEditCancel() {
    setEditingId(null)
    setEditErrors(EMPTY_ERRORS)
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

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="搜尋餐廳名稱…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="搜尋餐廳"
        />
        <Select
          value={filterCuisine}
          onValueChange={(v) => setFilterCuisine(v as CuisineType | 'all')}
        >
          <SelectTrigger className="w-36" aria-label="篩選料理類型">
            <SelectValue placeholder="所有類型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有類型</SelectItem>
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
          ) : filteredRestaurants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                找不到符合條件的餐廳
              </TableCell>
            </TableRow>
          ) : (
            filteredRestaurants.map((r) =>
              editingId === r.id ? (
                <TableRow key={r.id}>
                  <TableCell>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      aria-label="編輯名稱"
                      className="h-8"
                    />
                    {editErrors.name && (
                      <p className="text-sm text-destructive">{editErrors.name}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editForm.cuisineType}
                      onValueChange={(v) =>
                        setEditForm({ ...editForm, cuisineType: v as CuisineType })
                      }
                    >
                      <SelectTrigger className="h-8" aria-label="編輯料理類型">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(CUISINE_META) as [
                            CuisineType,
                            { label: string; color: string },
                          ][]
                        ).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      aria-label="編輯價格"
                      className="h-8 w-20"
                    />
                    {editErrors.price && (
                      <p className="text-sm text-destructive">{editErrors.price}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editForm.distance}
                      onChange={(e) => setEditForm({ ...editForm, distance: e.target.value })}
                      aria-label="編輯距離"
                      className="h-8 w-20"
                    />
                    {editErrors.distance && (
                      <p className="text-sm text-destructive">{editErrors.distance}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.rating}
                      onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                      aria-label="編輯評分"
                      className="h-8 w-20"
                    />
                    {editErrors.rating && (
                      <p className="text-sm text-destructive">{editErrors.rating}</p>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEditSave}
                      title="儲存編輯"
                      aria-label="儲存編輯"
                    >
                      <Check className="size-4 text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEditCancel}
                      title="取消編輯"
                      aria-label="取消編輯"
                    >
                      <X className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditStart(r)}
                      title="編輯"
                      aria-label="編輯"
                    >
                      <Pencil className="size-4" />
                    </Button>
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
              ),
            )
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="餐廳名稱"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="cuisine">料理類型</Label>
            <Select
              value={form.cuisineType}
              onValueChange={(v) => setForm({ ...form, cuisineType: v as CuisineType })}
            >
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
              placeholder="例: 100"
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              value={form.price}
            />
            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
          </div>
          <div>
            <Label htmlFor="distance">距離 (m)</Label>
            <Input
              id="distance"
              type="number"
              step="1"
              placeholder="例: 150"
              onChange={(e) => setForm({ ...form, distance: e.target.value })}
              value={form.distance}
            />
            {errors.distance && <p className="text-sm text-destructive">{errors.distance}</p>}
          </div>
          <div>
            <Label htmlFor="rating">評分</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              placeholder="例: 4.5"
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              value={form.rating}
            />
            {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
          </div>
        </div>
        <Button type="submit" className="mt-4">
          新增
        </Button>
      </form>
    </div>
  )
}
