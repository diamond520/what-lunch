// lib/types.ts
// Single source of truth for all type definitions and cuisine constants.
// Pattern: as const satisfies Record<> derives union type from object keys
// while validating each entry's shape at compile time.

export const CUISINE_META = {
  chi: { label: '中式', color: '#67C23A' },
  jp: { label: '日式', color: '#E6A23C' },
  kr: { label: '韓式', color: '#F56C6C' },
  tw: { label: '台式', color: '#8B5CF6' },
  thai: { label: '泰式', color: '#909399' },
  west: { label: '西式', color: '#109399' },
} as const satisfies Record<string, { label: string; color: string }>

// CuisineType is inferred as: 'chi' | 'jp' | 'kr' | 'tw' | 'thai' | 'west'
// This union is derived from CUISINE_META keys — adding a new cuisine here
// automatically expands the type, and forgetting to add a color/label causes
// a TypeScript error at the definition site, not at the usage site.
export type CuisineType = keyof typeof CUISINE_META

export interface Restaurant {
  id: string
  name: string
  type: CuisineType // enforced as union — 'chinese' would be a compile error
  price: number // TWD, integer — explicit number fixes the old Vue 2 string coercion bug
  distance: number // meters, integer
  rating: number // Google Maps rating (1.0–5.0)
}
