'use client'

import { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react'
import type { Restaurant } from './types'
import { DEFAULT_RESTAURANTS } from './restaurants'

const STORAGE_KEY = 'what-lunch-restaurants'

interface RestaurantContextValue {
  restaurants: Restaurant[]
  isHydrated: boolean
  addRestaurant: (r: Restaurant) => void
  removeRestaurant: (id: string) => void
  updateRestaurant: (r: Restaurant) => void
}

export const RestaurantContext = createContext<RestaurantContextValue | null>(null)

function readStoredRestaurants(): Restaurant[] {
  if (typeof window === 'undefined') return DEFAULT_RESTAURANTS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_RESTAURANTS
  } catch {
    return DEFAULT_RESTAURANTS
  }
}

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(readStoredRestaurants)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [restaurants, isHydrated])

  function addRestaurant(r: Restaurant) {
    setRestaurants((prev) => [...prev, r])
  }

  function removeRestaurant(id: string) {
    setRestaurants((prev) => prev.filter((r) => r.id !== id))
  }

  function updateRestaurant(r: Restaurant) {
    setRestaurants((prev) => prev.map((x) => (x.id === r.id ? r : x)))
  }

  return (
    <RestaurantContext
      value={{ restaurants, isHydrated, addRestaurant, removeRestaurant, updateRestaurant }}
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
