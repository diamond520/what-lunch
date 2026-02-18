// lib/restaurants.ts
// Default restaurant data — real restaurants near 承德路一段70號 (台北大同區).
// Walking distance ≤ 15 min (~1km). Google Maps ratings as of 2025.

import type { Restaurant } from './types'

export const DEFAULT_RESTAURANTS = [
  { id: 'id-1', name: '三多屋爸爸嘴', type: 'jp', price: 250, distance: 500, rating: 4.2 },
  { id: 'id-2', name: '福珍排骨酥麵', type: 'chi', price: 75, distance: 500, rating: 4.0 },
  { id: 'id-3', name: '大稻埕魯肉飯', type: 'chi', price: 45, distance: 550, rating: 4.3 },
  { id: 'id-4', name: '笑貓咖哩承德店', type: 'jp', price: 200, distance: 400, rating: 4.5 },
  { id: 'id-5', name: '川畝園麵食館', type: 'chi', price: 100, distance: 600, rating: 4.5 },
  { id: 'id-6', name: '京都勝牛(京站)', type: 'jp', price: 280, distance: 700, rating: 4.3 },
  { id: 'id-7', name: '銀座杏子豬排(京站)', type: 'jp', price: 250, distance: 700, rating: 4.2 },
  { id: 'id-8', name: '大戶屋(京站)', type: 'jp', price: 250, distance: 700, rating: 4.2 },
  { id: 'id-9', name: '晶湯匙(京站)', type: 'tai', price: 350, distance: 700, rating: 4.0 },
  { id: 'id-10', name: '燒肉LIKE(京站)', type: 'jp', price: 200, distance: 700, rating: 3.9 },
  { id: 'id-11', name: '九月茶餐廳', type: 'chi', price: 180, distance: 1400, rating: 4.2 },
  { id: 'id-12', name: '韓國媽媽烤肉', type: 'kr', price: 150, distance: 600, rating: 3.8 },
  { id: 'id-13', name: '涓豆腐(京站)', type: 'kr', price: 280, distance: 700, rating: 4.0 },
] satisfies Restaurant[]
