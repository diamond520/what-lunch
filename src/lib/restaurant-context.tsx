'use client'

import { createContext, useContext, useState } from 'react'
import type { Restaurant } from './types'
import { DEFAULT_RESTAURANTS } from './restaurants'

interface RestaurantContextValue {
  restaurants: Restaurant[]
  addRestaurant: (r: Restaurant) => void
  removeRestaurant: (id: string) => void
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null)

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(DEFAULT_RESTAURANTS)

  function addRestaurant(r: Restaurant) {
    setRestaurants(prev => [...prev, r])
  }

  function removeRestaurant(id: string) {
    setRestaurants(prev => prev.filter(r => r.id !== id))
  }

  return (
    <RestaurantContext value={{ restaurants, addRestaurant, removeRestaurant }}>
      {children}
    </RestaurantContext>
  )
}

export function useRestaurants(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext)
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantProvider')
  return ctx
}
