'use client'

import { useState, useEffect } from 'react'
import { Trash2, Check, Pencil, X, LogOut, Plus, MapPin } from 'lucide-react'
import { useRestaurants } from '@/lib/restaurant-context'
import { CUISINE_META } from '@/lib/types'
import { getGoogleMapsSearchUrl } from '@/lib/google-maps'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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

  // distance is optional — only validate if provided
  if (f.distance !== '') {
    const distance = Number(f.distance)
    if (isNaN(distance)) {
      errors.distance = '請輸入有效的距離'
    } else if (distance < 0) {
      errors.distance = '距離不可為負數'
    }
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
  const r: Restaurant = {
    id,
    name: f.name.trim(),
    type: f.cuisineType,
    price: Number(f.price),
    rating: Number(f.rating),
  }
  if (f.distance !== '') r.distance = Number(f.distance)
  return r
}

function restaurantToForm(r: Restaurant): FormState {
  return {
    name: r.name,
    cuisineType: r.type,
    price: String(r.price),
    distance: r.distance != null ? String(r.distance) : '',
    rating: String(r.rating),
  }
}

function AddRestaurantDialog({
  onAdd,
}: {
  onAdd: (r: Restaurant) => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS)

  function reset() {
    setForm(EMPTY_FORM)
    setErrors(EMPTY_ERRORS)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateFields(form)
    setErrors(errs)
    if (hasErrors(errs)) return

    onAdd(formToRestaurant(form, crypto.randomUUID()))
    reset()
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-1" />
          新增餐廳
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增餐廳</DialogTitle>
          <DialogDescription>填寫餐廳資訊,送出後立即同步給其他使用者</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">名稱</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="餐廳名稱"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
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
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">價格 (NT$)</Label>
              <Input
                id="price"
                type="number"
                step="1"
                placeholder="100"
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                value={form.price}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="distance">距離 (m,選填)</Label>
              <Input
                id="distance"
                type="number"
                step="1"
                placeholder="150"
                onChange={(e) => setForm({ ...form, distance: e.target.value })}
                value={form.distance}
              />
              {errors.distance && <p className="text-sm text-destructive">{errors.distance}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rating">評分</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                placeholder="4.5"
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                value={form.rating}
              />
              {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">新增</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface RestaurantListPanelProps {
  restaurants: Restaurant[]
  addRestaurant: (r: Restaurant) => Promise<void> | void
  removeRestaurant: (id: string) => Promise<void> | void
  updateRestaurant: (r: Restaurant) => Promise<void> | void
}

export function RestaurantListPanel({
  restaurants,
  addRestaurant,
  removeRestaurant,
  updateRestaurant,
}: RestaurantListPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [editErrors, setEditErrors] = useState<FormErrors>(EMPTY_ERRORS)

  const [search, setSearch] = useState('')
  const [filterCuisine, setFilterCuisine] = useState<CuisineType | 'all'>('all')

  const filteredRestaurants = restaurants.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(search.toLowerCase())
    const cuisineMatch = filterCuisine === 'all' || r.type === filterCuisine
    return nameMatch && cuisineMatch
  })

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

  return (
    <>
      {/* Search, Filter & Add */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4 mt-4">
        <Input
          placeholder="搜尋餐廳名稱…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
          aria-label="搜尋餐廳"
        />
        <Select
          value={filterCuisine}
          onValueChange={(v) => setFilterCuisine(v as CuisineType | 'all')}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="篩選料理類型">
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
        <div className="sm:ml-auto">
          <AddRestaurantDialog onAdd={addRestaurant} />
        </div>
      </div>

      <div className="overflow-x-auto">
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
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        {r.name}
                        <a
                          href={getGoogleMapsSearchUrl(r.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="在 Google Maps 開啟"
                          aria-label="在 Google Maps 開啟"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MapPin className="size-3.5" />
                        </a>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: CUISINE_META[r.type].color }}
                      >
                        {CUISINE_META[r.type].label}
                      </span>
                    </TableCell>
                    <TableCell>{r.price}</TableCell>
                    <TableCell>{r.distance ?? '—'}</TableCell>
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
      </div>

    </>
  )
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const { editToken, setEditToken } = useRestaurants()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)

  // On mount, try the stored token. If it works, unlock immediately and
  // refresh the 30-day expiry (sliding window — active users never re-prompt).
  useEffect(() => {
    if (!editToken) {
      setChecking(false)
      return
    }
    let cancelled = false
    async function check() {
      try {
        const res = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${editToken}` },
        })
        if (cancelled) return
        if (res.ok) {
          setEditToken(editToken) // refresh expiresAt
          onUnlock()
        } else if (res.status === 401) {
          setEditToken('')
        }
      } catch {
        // ignore — user can manually enter
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [editToken, setEditToken, onUnlock])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${input}` },
      })
      if (res.ok) {
        setEditToken(input)
        onUnlock()
      } else if (res.status === 401) {
        setError('密碼錯誤')
      } else {
        setError('驗證失敗,請稍後再試')
      }
    } catch {
      setError('連線失敗,請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-8">
        <p className="text-muted-foreground">驗證中…</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-md px-3 sm:px-4 py-12">
      <h1 className="text-xl sm:text-2xl font-semibold mb-2">餐廳管理</h1>
      <p className="mb-6 text-sm text-muted-foreground">請輸入編輯密碼以進入</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="admin-password" className="mb-2 block">
            編輯密碼
          </Label>
          <Input
            id="admin-password"
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="current-password"
            autoFocus
            disabled={submitting}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit" disabled={!input || submitting} className="w-full">
          {submitting ? '驗證中…' : '進入'}
        </Button>
      </form>
    </div>
  )
}

export default function AdminPage() {
  const {
    restaurants,
    weekendRestaurants,
    isHydrated,
    setEditToken,
    addRestaurant,
    removeRestaurant,
    updateRestaurant,
    addWeekendRestaurant,
    removeWeekendRestaurant,
    updateWeekendRestaurant,
  } = useRestaurants()
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />
  }

  function handleLogout() {
    setEditToken('')
    setUnlocked(false)
  }

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-6">餐廳管理</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">餐廳管理</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="size-4 mr-1" />
          登出
        </Button>
      </div>

      <Tabs defaultValue="weekday">
        <TabsList>
          <TabsTrigger value="weekday">平日餐廳</TabsTrigger>
          <TabsTrigger value="weekend">假日餐廳</TabsTrigger>
        </TabsList>
        <TabsContent value="weekday">
          <RestaurantListPanel
            restaurants={restaurants}
            addRestaurant={addRestaurant}
            removeRestaurant={removeRestaurant}
            updateRestaurant={updateRestaurant}
          />
        </TabsContent>
        <TabsContent value="weekend">
          <RestaurantListPanel
            restaurants={weekendRestaurants}
            addRestaurant={addWeekendRestaurant}
            removeRestaurant={removeWeekendRestaurant}
            updateRestaurant={updateWeekendRestaurant}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
