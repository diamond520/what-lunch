'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CUISINE_META, type CuisineType, type Restaurant } from './types'

const TOKEN_STORAGE_KEY = 'what-lunch-edit-token'
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

interface StoredToken {
  token: string
  expiresAt: number // ms since epoch
}

interface RestaurantContextValue {
  restaurants: Restaurant[]
  weekendRestaurants: Restaurant[]
  isHydrated: boolean
  editToken: string
  setEditToken: (token: string) => void
  addRestaurant: (r: Restaurant) => Promise<void>
  removeRestaurant: (id: string) => Promise<void>
  updateRestaurant: (r: Restaurant) => Promise<void>
  addWeekendRestaurant: (r: Restaurant) => Promise<void>
  removeWeekendRestaurant: (id: string) => Promise<void>
  updateWeekendRestaurant: (r: Restaurant) => Promise<void>
}

export const RestaurantContext = createContext<RestaurantContextValue | null>(null)

const CUISINE_TYPE_MIGRATIONS: Record<string, CuisineType> = { tai: 'thai' }

function migrateRestaurants(list: Restaurant[]): Restaurant[] {
  return list.map((r) => {
    const migrated = CUISINE_TYPE_MIGRATIONS[r.type]
    if (migrated) return { ...r, type: migrated }
    if (!(r.type in CUISINE_META)) return { ...r, type: 'chi' as CuisineType }
    return r
  })
}

function readStoredToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return ''

    // Old format (plain string from before expiry was added) — drop it,
    // user has to re-enter password once.
    if (!raw.startsWith('{')) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      return ''
    }

    const parsed = JSON.parse(raw) as Partial<StoredToken>
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      Date.now() >= parsed.expiresAt
    ) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      return ''
    }
    return parsed.token
  } catch {
    return ''
  }
}

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [weekendRestaurants, setWeekendRestaurants] = useState<Restaurant[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [editToken, setEditTokenState] = useState<string>(readStoredToken)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/restaurants')
        if (!res.ok) throw new Error('failed to load')
        const data = (await res.json()) as { weekday: Restaurant[]; weekend: Restaurant[] }
        if (cancelled) return
        setRestaurants(migrateRestaurants(data.weekday))
        setWeekendRestaurants(migrateRestaurants(data.weekend))
      } catch {
        if (cancelled) return
        toast.error('餐廳資料載入失敗,請重新整理')
      } finally {
        if (!cancelled) setIsHydrated(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function setEditToken(token: string) {
    setEditTokenState(token)
    try {
      if (token) {
        const stored: StoredToken = { token, expiresAt: Date.now() + TOKEN_TTL_MS }
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored))
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    } catch {
      // Ignore storage errors
    }
  }

  async function persist(kind: 'weekday' | 'weekend', list: Restaurant[]): Promise<void> {
    const res = await fetch('/api/restaurants', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${editToken}`,
      },
      body: JSON.stringify({ kind, restaurants: list }),
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('編輯密碼錯誤或未輸入')
      throw new Error('儲存失敗,請稍後再試')
    }
  }

  // Optimistic update + revert on failure. Each handler captures `prev` at call
  // time, applies the change locally, then PUTs the new full list. On error,
  // restore `prev` and surface the message via toast (no rethrow — fire-and-forget).
  async function mutate(
    kind: 'weekday' | 'weekend',
    next: Restaurant[],
    prev: Restaurant[],
    setList: (list: Restaurant[]) => void,
  ): Promise<void> {
    setList(next)
    try {
      await persist(kind, next)
    } catch (e) {
      setList(prev)
      const message = e instanceof Error ? e.message : '儲存失敗'
      toast.error(message)
    }
  }

  const addRestaurant = (r: Restaurant) =>
    mutate('weekday', [...restaurants, r], restaurants, setRestaurants)
  const removeRestaurant = (id: string) =>
    mutate('weekday', restaurants.filter((x) => x.id !== id), restaurants, setRestaurants)
  const updateRestaurant = (r: Restaurant) =>
    mutate(
      'weekday',
      restaurants.map((x) => (x.id === r.id ? r : x)),
      restaurants,
      setRestaurants,
    )
  const addWeekendRestaurant = (r: Restaurant) =>
    mutate('weekend', [...weekendRestaurants, r], weekendRestaurants, setWeekendRestaurants)
  const removeWeekendRestaurant = (id: string) =>
    mutate(
      'weekend',
      weekendRestaurants.filter((x) => x.id !== id),
      weekendRestaurants,
      setWeekendRestaurants,
    )
  const updateWeekendRestaurant = (r: Restaurant) =>
    mutate(
      'weekend',
      weekendRestaurants.map((x) => (x.id === r.id ? r : x)),
      weekendRestaurants,
      setWeekendRestaurants,
    )

  return (
    <RestaurantContext
      value={{
        restaurants,
        weekendRestaurants,
        isHydrated,
        editToken,
        setEditToken,
        addRestaurant,
        removeRestaurant,
        updateRestaurant,
        addWeekendRestaurant,
        removeWeekendRestaurant,
        updateWeekendRestaurant,
      }}
    >
      {children}
    </RestaurantContext>
  )
}

export function useRestaurants(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantProvider')
  return ctx
}
