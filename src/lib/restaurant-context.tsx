'use client'

import { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react'
import type { Restaurant } from './types'
import { DEFAULT_RESTAURANTS, DEFAULT_WEEKEND_RESTAURANTS } from './restaurants'

const STORAGE_KEY = 'what-lunch-restaurants'
const WEEKEND_STORAGE_KEY = 'what-lunch-weekend-restaurants'

interface RestaurantContextValue {
  restaurants: Restaurant[]
  weekendRestaurants: Restaurant[]
  isHydrated: boolean
  addRestaurant: (r: Restaurant) => void
  removeRestaurant: (id: string) => void
  updateRestaurant: (r: Restaurant) => void
  addWeekendRestaurant: (r: Restaurant) => void
  removeWeekendRestaurant: (id: string) => void
  updateWeekendRestaurant: (r: Restaurant) => void
}

export const RestaurantContext = createContext<RestaurantContextValue | null>(null)

function readStoredRestaurantsFromKey(key: string, defaults: Restaurant[]): Restaurant[] {
  if (typeof window === 'undefined') return defaults
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaults
  } catch {
    return defaults
  }
}

function readStoredRestaurants(): Restaurant[] {
  return readStoredRestaurantsFromKey(STORAGE_KEY, DEFAULT_RESTAURANTS)
}

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(readStoredRestaurants)
  const [weekendRestaurants, setWeekendRestaurants] = useState<Restaurant[]>(
    () => readStoredRestaurantsFromKey(WEEKEND_STORAGE_KEY, DEFAULT_WEEKEND_RESTAURANTS),
  )
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // Persist weekday restaurants to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [restaurants, isHydrated])

  // Persist weekend restaurants to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(WEEKEND_STORAGE_KEY, JSON.stringify(weekendRestaurants))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [weekendRestaurants, isHydrated])

  function addRestaurant(r: Restaurant) {
    setRestaurants((prev) => [...prev, r])
  }

  function removeRestaurant(id: string) {
    setRestaurants((prev) => prev.filter((r) => r.id !== id))
  }

  function updateRestaurant(r: Restaurant) {
    setRestaurants((prev) => prev.map((x) => (x.id === r.id ? r : x)))
  }

  function addWeekendRestaurant(r: Restaurant) {
    setWeekendRestaurants((prev) => [...prev, r])
  }

  function removeWeekendRestaurant(id: string) {
    setWeekendRestaurants((prev) => prev.filter((r) => r.id !== id))
  }

  function updateWeekendRestaurant(r: Restaurant) {
    setWeekendRestaurants((prev) => prev.map((x) => (x.id === r.id ? r : x)))
  }

  return (
    <RestaurantContext
      value={{
        restaurants,
        weekendRestaurants,
        isHydrated,
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
