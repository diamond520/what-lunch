import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { RestaurantProvider } from '@/lib/restaurant-context'
import { HistoryProvider } from '@/lib/history-context'
import { DEFAULT_RESTAURANTS, DEFAULT_WEEKEND_RESTAURANTS } from '@/lib/restaurants'
import RestaurantsPage from '@/app/restaurants/page'
import HomePage from '@/app/page'

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

  // Mock fetch: GET returns defaults, PUT returns ok.
  global.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (method === 'GET') {
      return new Response(
        JSON.stringify({ weekday: DEFAULT_RESTAURANTS, weekend: DEFAULT_WEEKEND_RESTAURANTS }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    if (method === 'PUT') {
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
    return new Response('Not found', { status: 404 })
  }) as unknown as typeof fetch
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
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
    <HistoryProvider>
      <RestaurantProvider>
        <HomePage />
      </RestaurantProvider>
    </HistoryProvider>,
  )
}

describe('Integration: RestaurantsPage (read-only)', () => {
  test('renders default restaurants from provider', async () => {
    renderRestaurantsPage()
    expect(await screen.findByText('三多屋爸爸嘴')).toBeInTheDocument()
    expect(screen.getByText('福珍排骨酥麵')).toBeInTheDocument()
  })

  test('does not expose edit/add controls', async () => {
    renderRestaurantsPage()
    await screen.findByText('三多屋爸爸嘴')
    expect(screen.queryByRole('button', { name: '新增' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('編輯')).not.toBeInTheDocument()
  })
})

describe('Integration: HomePage', () => {
  test('generates a plan', async () => {
    renderHomePage()
    // Wait for restaurants to load before generating
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '產生本週午餐計畫' })).not.toBeDisabled()
    })
    vi.useFakeTimers()

    fireEvent.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('星期一')).toBeInTheDocument()
    expect(screen.getByText('星期五')).toBeInTheDocument()
    expect(screen.getByText(/本週總花費/)).toBeInTheDocument()
  })

  test('reroll changes a day', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '產生本週午餐計畫' })).not.toBeDisabled()
    })
    vi.useFakeTimers()

    fireEvent.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const rerollButtons = screen.getAllByRole('button', { name: /重抽/ })
    expect(rerollButtons).toHaveLength(5)

    fireEvent.click(rerollButtons[0])
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('星期一')).toBeInTheDocument()
    expect(screen.getByText(/本週總花費/)).toBeInTheDocument()
  })

  test('plan history appears after 2nd generate', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '產生本週午餐計畫' })).not.toBeDisabled()
    })
    vi.useFakeTimers()

    fireEvent.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.queryByText('歷史計畫')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('歷史計畫')).toBeInTheDocument()

    const historyItems = screen.getAllByText(/目前檢視|NT\$/)
    expect(historyItems.length).toBeGreaterThanOrEqual(2)
  })

  test('clicking history entry switches displayed plan', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '產生本週午餐計畫' })).not.toBeDisabled()
    })
    vi.useFakeTimers()

    fireEvent.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    fireEvent.click(screen.getByRole('button', { name: '產生本週午餐計畫' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const currentLabel = screen.getByText('（目前檢視）')
    expect(currentLabel).toBeInTheDocument()

    const historyButtons = screen
      .getByText('歷史計畫')
      .closest('div')!
      .querySelectorAll('button')
    fireEvent.click(historyButtons[1])

    expect(screen.getByText('星期一')).toBeInTheDocument()
  })
})
