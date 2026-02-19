'use client'

import { useHistory } from '@/lib/history-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function HistoryPage() {
  const { entries, lookbackDays, isHydrated, removeEntry, clearHistory, setLookbackDays } =
    useHistory()

  if (!isHydrated) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-8">
        <h1 className="text-xl sm:text-2xl font-semibold mb-6">午餐歷史</h1>
      </div>
    )
  }

  // Group entries by date (most recent first)
  const entriesByDate = new Map<string, typeof entries>()
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  for (const entry of sorted) {
    const group = entriesByDate.get(entry.date) ?? []
    group.push(entry)
    entriesByDate.set(entry.date, group)
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8">
      <h1 className="text-xl sm:text-2xl font-semibold mb-6">午餐歷史</h1>

      {/* Lookback days setting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-6">
        <Label htmlFor="lookback">最近</Label>
        <Input
          id="lookback"
          type="number"
          min={1}
          max={30}
          step={1}
          value={lookbackDays}
          onChange={(e) => {
            const v = e.target.valueAsNumber
            setLookbackDays(isNaN(v) ? 1 : v)
          }}
          className="w-full sm:w-20"
        />
        <span className="text-sm text-muted-foreground">個工作天內不重複推薦</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground">尚無歷史記錄</p>
      ) : (
        <>
          {/* Clear all button */}
          <div className="mb-4">
            <Button variant="outline" onClick={clearHistory} className="w-full sm:w-auto">
              清除全部歷史
            </Button>
          </div>

          {/* Entries grouped by date */}
          <div className="space-y-6">
            {[...entriesByDate.entries()].map(([date, group]) => (
              <div key={date}>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">{date}</h2>
                <div className="divide-y rounded-lg border">
                  {group.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-3 sm:px-4 py-3">
                      <div>
                        <span className="font-medium">{entry.restaurantName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(entry.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        移除
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
