import { describe, test, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestaurantContext } from '@/lib/restaurant-context'
import type { Restaurant } from '@/lib/types'
import RestaurantsPage from '@/app/restaurants/page'

const mockRestaurants: Restaurant[] = [
  { id: '1', name: '測試中餐', type: 'chi', price: 100, distance: 200, rating: 4.0 },
  { id: '2', name: '測試日料', type: 'jp', price: 250, distance: 500, rating: 4.5 },
  { id: '3', name: '測試韓食', type: 'kr', price: 150, distance: 300, rating: 3.8 },
]

function renderWithContext(
  restaurants: Restaurant[] = mockRestaurants,
  overrides: Partial<{
    addRestaurant: (r: Restaurant) => void
    removeRestaurant: (id: string) => void
    updateRestaurant: (r: Restaurant) => void
    addWeekendRestaurant: (r: Restaurant) => void
    removeWeekendRestaurant: (id: string) => void
    updateWeekendRestaurant: (r: Restaurant) => void
  }> = {},
) {
  const addRestaurant = overrides.addRestaurant ?? vi.fn()
  const removeRestaurant = overrides.removeRestaurant ?? vi.fn()
  const updateRestaurant = overrides.updateRestaurant ?? vi.fn()
  const addWeekendRestaurant = overrides.addWeekendRestaurant ?? vi.fn()
  const removeWeekendRestaurant = overrides.removeWeekendRestaurant ?? vi.fn()
  const updateWeekendRestaurant = overrides.updateWeekendRestaurant ?? vi.fn()

  return {
    addRestaurant,
    removeRestaurant,
    updateRestaurant,
    addWeekendRestaurant,
    removeWeekendRestaurant,
    updateWeekendRestaurant,
    ...render(
      <RestaurantContext
        value={{
          restaurants,
          weekendRestaurants: [],
          isHydrated: true,
          addRestaurant,
          removeRestaurant,
          updateRestaurant,
          addWeekendRestaurant,
          removeWeekendRestaurant,
          updateWeekendRestaurant,
        }}
      >
        <RestaurantsPage />
      </RestaurantContext>,
    ),
  }
}

describe('RestaurantsPage', () => {
  test('renders the page title and table', () => {
    renderWithContext()
    expect(screen.getByText('餐廳管理')).toBeInTheDocument()
    expect(screen.getByText('測試中餐')).toBeInTheDocument()
    expect(screen.getByText('測試日料')).toBeInTheDocument()
    expect(screen.getByText('測試韓食')).toBeInTheDocument()
  })

  test('renders the add form', () => {
    renderWithContext()
    expect(screen.getByLabelText('名稱')).toBeInTheDocument()
    expect(screen.getByLabelText('價格 (NT$)')).toBeInTheDocument()
    expect(screen.getByLabelText('距離 (m)')).toBeInTheDocument()
    expect(screen.getByLabelText('評分')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增' })).toBeInTheDocument()
  })

  test('shows empty state when no restaurants', () => {
    renderWithContext([])
    expect(screen.getByText('尚無餐廳資料')).toBeInTheDocument()
  })

  test('shows validation errors for empty form submission', async () => {
    const user = userEvent.setup()
    renderWithContext()

    await user.click(screen.getByRole('button', { name: '新增' }))

    expect(screen.getByText('請輸入有效的價格')).toBeInTheDocument()
    expect(screen.getByText('請輸入有效的距離')).toBeInTheDocument()
    expect(screen.getByText('請輸入有效的評分')).toBeInTheDocument()
  })

  test('shows range validation error for price <= 0', async () => {
    const user = userEvent.setup()
    renderWithContext()

    await user.type(screen.getByLabelText('名稱'), '新餐廳')
    await user.type(screen.getByLabelText('價格 (NT$)'), '-10')
    await user.type(screen.getByLabelText('距離 (m)'), '100')
    await user.type(screen.getByLabelText('評分'), '4.0')
    await user.click(screen.getByRole('button', { name: '新增' }))

    expect(screen.getByText('價格必須大於 0')).toBeInTheDocument()
  })

  test('shows range validation error for negative distance', async () => {
    const user = userEvent.setup()
    renderWithContext()

    await user.type(screen.getByLabelText('名稱'), '新餐廳')
    await user.type(screen.getByLabelText('價格 (NT$)'), '100')
    await user.type(screen.getByLabelText('距離 (m)'), '-50')
    await user.type(screen.getByLabelText('評分'), '4.0')
    await user.click(screen.getByRole('button', { name: '新增' }))

    expect(screen.getByText('距離不可為負數')).toBeInTheDocument()
  })

  test('shows range validation error for rating out of 1.0-5.0', async () => {
    const user = userEvent.setup()
    renderWithContext()

    await user.type(screen.getByLabelText('名稱'), '新餐廳')
    await user.type(screen.getByLabelText('價格 (NT$)'), '100')
    await user.type(screen.getByLabelText('距離 (m)'), '100')
    await user.type(screen.getByLabelText('評分'), '6.0')
    await user.click(screen.getByRole('button', { name: '新增' }))

    expect(screen.getByText('評分必須介於 1.0 與 5.0 之間')).toBeInTheDocument()
  })

  test('calls addRestaurant and resets form on valid submit', async () => {
    const user = userEvent.setup()
    const { addRestaurant } = renderWithContext()

    await user.type(screen.getByLabelText('名稱'), '好吃餐廳')
    await user.type(screen.getByLabelText('價格 (NT$)'), '150')
    await user.type(screen.getByLabelText('距離 (m)'), '300')
    await user.type(screen.getByLabelText('評分'), '4.5')
    await user.click(screen.getByRole('button', { name: '新增' }))

    expect(addRestaurant).toHaveBeenCalledOnce()
    const arg = (addRestaurant as ReturnType<typeof vi.fn>).mock.calls[0][0] as Restaurant
    expect(arg.name).toBe('好吃餐廳')
    expect(arg.price).toBe(150)
    expect(arg.distance).toBe(300)
    expect(arg.rating).toBe(4.5)

    // Form should reset
    expect(screen.getByLabelText('名稱')).toHaveValue('')
    expect(screen.getByLabelText('價格 (NT$)')).toHaveValue(null)
    expect(screen.getByLabelText('距離 (m)')).toHaveValue(null)
    expect(screen.getByLabelText('評分')).toHaveValue(null)
  })

  test('search filters restaurants by name', async () => {
    const user = userEvent.setup()
    renderWithContext()

    const searchInput = screen.getByLabelText('搜尋餐廳')
    await user.type(searchInput, '日料')

    expect(screen.getByText('測試日料')).toBeInTheDocument()
    expect(screen.queryByText('測試中餐')).not.toBeInTheDocument()
    expect(screen.queryByText('測試韓食')).not.toBeInTheDocument()
  })

  test('search shows no-match message when nothing found', async () => {
    const user = userEvent.setup()
    renderWithContext()

    const searchInput = screen.getByLabelText('搜尋餐廳')
    await user.type(searchInput, '不存在的餐廳')

    expect(screen.getByText('找不到符合條件的餐廳')).toBeInTheDocument()
  })

  test('edit mode: clicking pencil shows inline inputs', async () => {
    const user = userEvent.setup()
    renderWithContext()

    const editButtons = screen.getAllByLabelText('編輯')
    await user.click(editButtons[0])

    expect(screen.getByLabelText('編輯名稱')).toHaveValue('測試中餐')
    expect(screen.getByLabelText('編輯價格')).toHaveValue(100)
    expect(screen.getByLabelText('編輯距離')).toHaveValue(200)
    expect(screen.getByLabelText('編輯評分')).toHaveValue(4)
  })

  test('edit mode: cancel discards changes', async () => {
    const user = userEvent.setup()
    renderWithContext()

    const editButtons = screen.getAllByLabelText('編輯')
    await user.click(editButtons[0])

    const nameInput = screen.getByLabelText('編輯名稱')
    await user.clear(nameInput)
    await user.type(nameInput, '改過的名字')

    await user.click(screen.getByLabelText('取消編輯'))

    // Should show original name, no edit inputs
    expect(screen.getByText('測試中餐')).toBeInTheDocument()
    expect(screen.queryByLabelText('編輯名稱')).not.toBeInTheDocument()
  })

  test('edit mode: save calls updateRestaurant', async () => {
    const user = userEvent.setup()
    const { updateRestaurant } = renderWithContext()

    const editButtons = screen.getAllByLabelText('編輯')
    await user.click(editButtons[0])

    const nameInput = screen.getByLabelText('編輯名稱')
    await user.clear(nameInput)
    await user.type(nameInput, '改名餐廳')

    await user.click(screen.getByLabelText('儲存編輯'))

    expect(updateRestaurant).toHaveBeenCalledOnce()
    const arg = (updateRestaurant as ReturnType<typeof vi.fn>).mock.calls[0][0] as Restaurant
    expect(arg.id).toBe('1')
    expect(arg.name).toBe('改名餐廳')
  })

  test('edit mode: save with invalid data shows errors', async () => {
    const user = userEvent.setup()
    const { updateRestaurant } = renderWithContext()

    const editButtons = screen.getAllByLabelText('編輯')
    await user.click(editButtons[0])

    const priceInput = screen.getByLabelText('編輯價格')
    await user.clear(priceInput)
    await user.type(priceInput, '-5')

    await user.click(screen.getByLabelText('儲存編輯'))

    expect(screen.getByText('價格必須大於 0')).toBeInTheDocument()
    expect(updateRestaurant).not.toHaveBeenCalled()
  })

  test('delete button calls removeRestaurant', async () => {
    const user = userEvent.setup()
    const { removeRestaurant } = renderWithContext()

    // Find all delete buttons (Trash2 icons)
    const rows = screen.getAllByRole('row')
    // First data row (index 1 because of header)
    const firstDataRow = rows[1]
    const deleteButton = within(firstDataRow).getAllByRole('button').at(-1)!
    await user.click(deleteButton)

    expect(removeRestaurant).toHaveBeenCalledWith('1')
  })
})
