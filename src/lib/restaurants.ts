// lib/restaurants.ts
// Default restaurant data for the What Lunch app.
// 19 Taipei restaurants migrated from the old Vue 2 dishes.json.
//
// Use `satisfies Restaurant[]` (not `: Restaurant[]`) to:
// - Validate each entry's shape at compile time
// - Preserve literal type narrowing (type stays 'chi' not 'string')
// - Catch string-typed price/distance values (the old Vue 2 bug)

import type { Restaurant } from './types'

export const DEFAULT_RESTAURANTS = [
  { id: 'id-1',  name: '鼎泰豐',   type: 'chi',  price: 120, distance: 150 },
  { id: 'id-2',  name: '一蘭拉麵', type: 'jp',   price: 100, distance: 150 },
  { id: 'id-3',  name: '西提',     type: 'west', price: 160, distance: 250 },
  { id: 'id-4',  name: '韓國郎',   type: 'kr',   price: 115, distance: 150 },
  { id: 'id-5',  name: 'Sukiya',   type: 'jp',   price: 100, distance: 50  },
  { id: 'id-6',  name: '王品',     type: 'west', price: 120, distance: 400 },
  { id: 'id-7',  name: '瓦城',     type: 'tai',  price: 85,  distance: 110 },
  { id: 'id-8',  name: '吉野家',   type: 'jp',   price: 70,  distance: 310 },
  { id: 'id-9',  name: '我家牛排', type: 'west', price: 105, distance: 90  },
  { id: 'id-10', name: '小食泰',   type: 'tai',  price: 65,  distance: 850 },
  { id: 'id-11', name: '迴轉壽司', type: 'jp',   price: 70,  distance: 240 },
  { id: 'id-12', name: '夏慕尼',   type: 'west', price: 130, distance: 150 },
  { id: 'id-13', name: '打拋專賣', type: 'tai',  price: 150, distance: 510 },
  { id: 'id-14', name: '日式燒肉', type: 'jp',   price: 125, distance: 190 },
  { id: 'id-15', name: '義麵屋',   type: 'west', price: 145, distance: 380 },
  { id: 'id-16', name: '湄南小鎮', type: 'tai',  price: 105, distance: 110 },
  { id: 'id-17', name: '丼飯',     type: 'jp',   price: 100, distance: 10  },
  { id: 'id-18', name: '漢堡王',   type: 'west', price: 110, distance: 150 },
  { id: 'id-19', name: '熱炒100',  type: 'chi',  price: 90,  distance: 290 },
] satisfies Restaurant[]
