import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestaurantContext } from '@/lib/restaurant-context'
import WeekendPage from '@/app/weekend/page'
import type { Restaurant } from '@/lib/types'

const mockWeekendRestaurants: Restaurant[] = [
  { id: 'wknd-1', name: '假日燒肉', type: 'jp', price: 500, distance: 1200, rating: 4.5 },
  { id: 'wknd-2', name: '假日火鍋', type: 'chi', price: 350, distance: 900, rating: 4.2 },
]

function renderWeekendPage(weekendRestaurants: Restaurant[] = mockWeekendRestaurants) {
  return render(
    <RestaurantContext
      value={{
        restaurants: [],
        weekendRestaurants,
        isHydrated: true,
        addRestaurant: vi.fn(),
        removeRestaurant: vi.fn(),
        updateRestaurant: vi.fn(),
        addWeekendRestaurant: vi.fn(),
        removeWeekendRestaurant: vi.fn(),
        updateWeekendRestaurant: vi.fn(),
      }}
    >
      <WeekendPage />
    </RestaurantContext>,
  )
}

describe('WeekendPage', () => {
  test('shows page title "假日推薦"', () => {
    renderWeekendPage()
    expect(screen.getByRole('heading', { name: '假日推薦' })).toBeInTheDocument()
  })

  test('empty state: shows prompt and link to /restaurants', () => {
    renderWeekendPage([])
    expect(screen.getByText(/尚未新增假日餐廳/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /餐廳管理/ })).toHaveAttribute('href', '/restaurants')
  })

  test('roll button picks a restaurant from the pool', async () => {
    renderWeekendPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /隨機推薦/ }))
    const names = mockWeekendRestaurants.map((r) => r.name)
    const displayed = names.find((n) => screen.queryByText(n))
    expect(displayed).toBeDefined()
  })

  test('re-roll button appears after first pick but not before', async () => {
    renderWeekendPage()
    const user = userEvent.setup()
    expect(screen.queryByRole('button', { name: /換一間/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /隨機推薦/ }))
    expect(screen.getByRole('button', { name: /換一間/ })).toBeInTheDocument()
  })

  test('result card shows restaurant price after rolling', async () => {
    renderWeekendPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /隨機推薦/ }))
    const priceVisible = screen.queryByText(/500/) || screen.queryByText(/350/)
    expect(priceVisible).toBeInTheDocument()
  })
})
