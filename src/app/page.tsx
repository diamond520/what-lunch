import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">今日推薦</h1>
      <p className="mt-2 text-muted-foreground">
        推薦功能即將在 Phase 3 推出。目前共有 {DEFAULT_RESTAURANTS.length} 間餐廳。
      </p>
    </div>
  )
}
