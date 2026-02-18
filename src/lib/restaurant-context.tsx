'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { Restaurant } from './types'
import { DEFAULT_RESTAURANTS } from './restaurants'

const STORAGE_KEY = 'what-lunch-restaurants'

interface RestaurantContextValue {
  restaurants: Restaurant[]
  isHydrated: boolean
  addRestaurant: (r: Restaurant) => void
  removeRestaurant: (id: string) => void
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null)

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(DEFAULT_RESTAURANTS)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRestaurants(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors, keep defaults
    }
    setIsHydrated(true)
  }, [])

  // Persist to localStorage after hydration
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [restaurants, isHydrated])

  function addRestaurant(r: Restaurant) {
    setRestaurants(prev => [...prev, r])
  }

  function removeRestaurant(id: string) {
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  return (
    <RestaurantContext value={{ restaurants, isHydrated, addRestaurant, removeRestaurant }}>
      {children}
    </RestaurantContext>
  )
}

export function useRestaurants(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantProvider')
  return ctx
}
