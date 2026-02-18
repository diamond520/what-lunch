import { describe, test, expect } from 'vitest'
import { pickRandomRestaurant } from '@/lib/recommend'
import type { Restaurant } from '@/lib/types'

const pool: Restaurant[] = [
  { id: 'w1', name: '假日餐廳A', type: 'west', price: 400, distance: 1000, rating: 4.5 },
  { id: 'w2', name: '假日餐廳B', type: 'jp', price: 350, distance: 800, rating: 4.3 },
  { id: 'w3', name: '假日餐廳C', type: 'chi', price: 200, distance: 600, rating: 4.0 },
]

describe('pickRandomRestaurant', () => {
  test('returns a restaurant from the pool', () => {
    const result = pickRandomRestaurant(pool)
    expect(pool).toContainEqual(result)
  })

  test('throws on empty pool', () => {
    expect(() => pickRandomRestaurant([])).toThrow('Restaurant pool cannot be empty')
  })

  test('returns the only item when pool has one entry', () => {
    expect(pickRandomRestaurant([pool[0]])).toBe(pool[0])
  })

  test('produces varied results over many calls', () => {
    const bigPool: Restaurant[] = [
      { id: 'w1', name: '假日餐廳A', type: 'west', price: 400, distance: 1000, rating: 4.5 },
      { id: 'w2', name: '假日餐廳B', type: 'jp', price: 350, distance: 800, rating: 4.3 },
      { id: 'w3', name: '假日餐廳C', type: 'chi', price: 200, distance: 600, rating: 4.0 },
      { id: 'w4', name: '假日餐廳D', type: 'kr', price: 300, distance: 500, rating: 4.1 },
      { id: 'w5', name: '假日餐廳E', type: 'tai', price: 250, distance: 700, rating: 3.9 },
    ]
    const seenIds = new Set<string>()
    for (let i = 0; i < 50; i++) {
      seenIds.add(pickRandomRestaurant(bigPool).id)
    }
    expect(seenIds.size).toBeGreaterThan(1)
  })
})
