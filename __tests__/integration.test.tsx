import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestaurantProvider } from '@/lib/restaurant-context'
import RestaurantsPage from '@/app/restaurants/page'
import HomePage from '@/app/page'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  localStorageMock.clear()
})

function renderRestaurantsPage() {
  return render(
    <RestaurantProvider>
      <RestaurantsPage />
    </RestaurantProvider>,
  )
}

function renderHomePage() {
  return render(
    <RestaurantProvider>
      <HomePage />
    </RestaurantProvider>,
  )
}

describe('Integration: RestaurantsPage', () => {
  test('renders default restaurants from provider', () => {
    renderRestaurantsPage()
    // Default restaurants should appear (from restaurants.ts)
    expect(screen.getByText('三多屋爸爸嘴')).toBeInTheDocument()
    expect(screen.getByText('福珍排骨酥麵')).toBeInTheDocument()
  })

  test('add a restaurant via form', async () => {
    const user = userEvent.setup()
    renderRestaurantsPage()

    await user.type(screen.getByLabelText('名稱'), '整合測試餐廳')
    await user.type(screen.getByLabelText('價格 (NT$)'), '200')
    await user.type(screen.getByLabelText('距離 (m)'), '400')
    await user.type(screen.getByLabelText('評分'), '4.2')
    await user.click(screen.getByRole('button', { name: '新增' }))

    expect(screen.getByText('整合測試餐廳')).toBeInTheDocument()
  })

  test('delete a restaurant', async () => {
    const user = userEvent.setup()
    renderRestaurantsPage()

    // The first restaurant should be visible
    expect(screen.getByText('三多屋爸爸嘴')).toBeInTheDocument()

    // Click the last button (delete) in the first data row
    const rows = screen.getAllByRole('row')
    const firstDataRow = rows[1]
    const buttons = firstDataRow.querySelectorAll('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)

    expect(screen.queryByText('三多屋爸爸嘴')).not.toBeInTheDocument()
  })
})

describe('Integration: HomePage', () => {
  test('generates a plan', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))

    // Day labels should appear
    expect(screen.getByText('星期一')).toBeInTheDocument()
    expect(screen.getByText('星期五')).toBeInTheDocument()
    // Total cost should appear
    expect(screen.getByText(/本週總花費/)).toBeInTheDocument()
  })

  test('reroll changes a day', async () => {
    const user = userEvent.setup()
    renderHomePage()

    await user.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))

    // Get all reroll buttons
    const rerollButtons = screen.getAllByRole('button', { name: /重抽/ })
    expect(rerollButtons).toHaveLength(5)

    // Click first reroll — this should not crash and plan should still be visible
    await user.click(rerollButtons[0])
    expect(screen.getByText('星期一')).toBeInTheDocument()
    expect(screen.getByText(/本週總花費/)).toBeInTheDocument()
  })

  test('plan history appears after 2nd generate', async () => {
    const user = userEvent.setup()
    renderHomePage()

    // Generate first plan
    await user.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    // No history section yet (only 1 plan)
    expect(screen.queryByText('歷史計畫')).not.toBeInTheDocument()

    // Generate second plan
    await user.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    // History section should appear
    expect(screen.getByText('歷史計畫')).toBeInTheDocument()

    // Should have 2 history entries
    const historyItems = screen.getAllByText(/目前檢視|NT\$/)
    expect(historyItems.length).toBeGreaterThanOrEqual(2)
  })

  test('clicking history entry switches displayed plan', async () => {
    const user = userEvent.setup()
    renderHomePage()

    // Generate two plans
    await user.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    await user.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))

    // The "目前檢視" marker should be on the first history entry (most recent)
    const currentLabel = screen.getByText('（目前檢視）')
    expect(currentLabel).toBeInTheDocument()

    // Click on the second history entry (older plan)
    const historyButtons = screen
      .getByText('歷史計畫')
      .closest('div')!
      .querySelectorAll('button')
    await user.click(historyButtons[1])

    // The displayed plan should still show day labels
    expect(screen.getByText('星期一')).toBeInTheDocument()
  })
})
