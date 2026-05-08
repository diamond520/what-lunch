'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { useRestaurants } from '@/lib/restaurant-context'
import { CUISINE_META } from '@/lib/types'
import { getGoogleMapsSearchUrl } from '@/lib/google-maps'
import type { CuisineType } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Restaurant } from '@/lib/types'

function ReadOnlyPanel({ restaurants }: { restaurants: Restaurant[] }) {
  const [search, setSearch] = useState('')
  const [filterCuisine, setFilterCuisine] = useState<CuisineType | 'all'>('all')

  const filtered = restaurants.filter((r) => {
    const nameMatch = r.name.toLowerCase().includes(search.toLowerCase())
    const cuisineMatch = filterCuisine === 'all' || r.type === filterCuisine
    return nameMatch && cuisineMatch
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4 mt-4">
        <Input
          placeholder="搜尋餐廳名稱…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
          aria-label="搜尋餐廳"
        />
        <Select
          value={filterCuisine}
          onValueChange={(v) => setFilterCuisine(v as CuisineType | 'all')}
        >
          <SelectTrigger className="w-full sm:w-36" aria-label="篩選料理類型">
            <SelectValue placeholder="所有類型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有類型</SelectItem>
            {(
              Object.entries(CUISINE_META) as [CuisineType, { label: string; color: string }][]
            ).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>料理類型</TableHead>
              <TableHead>價格 (NT$)</TableHead>
              <TableHead>距離 (m)</TableHead>
              <TableHead>評分</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  尚無餐廳資料
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  找不到符合條件的餐廳
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      {r.name}
                      <a
                        href={getGoogleMapsSearchUrl(r.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="在 Google Maps 開啟"
                        aria-label="在 Google Maps 開啟"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MapPin className="size-3.5" />
                      </a>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: CUISINE_META[r.type].color }}
                    >
                      {CUISINE_META[r.type].label}
                    </span>
                  </TableCell>
                  <TableCell>{r.price}</TableCell>
                  <TableCell>{r.distance ?? '—'}</TableCell>
                  <TableCell>{r.rating}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

export default function RestaurantsPage() {
  const { restaurants, weekendRestaurants, isHydrated } = useRestaurants()

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-6">餐廳列表</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8">
      <h1 className="text-xl sm:text-2xl font-semibold mb-6">餐廳列表</h1>
      <Tabs defaultValue="weekday">
        <TabsList>
          <TabsTrigger value="weekday">平日餐廳</TabsTrigger>
          <TabsTrigger value="weekend">假日餐廳</TabsTrigger>
        </TabsList>
        <TabsContent value="weekday">
          <ReadOnlyPanel restaurants={restaurants} />
        </TabsContent>
        <TabsContent value="weekend">
          <ReadOnlyPanel restaurants={weekendRestaurants} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
