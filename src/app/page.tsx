// app/page.tsx
import { DEFAULT_RESTAURANTS } from '@/lib/restaurants'

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">What Lunch?</h1>
      <p className="text-muted-foreground mt-2">
        {DEFAULT_RESTAURANTS.length} restaurants available
      </p>
    </main>
  )
}
