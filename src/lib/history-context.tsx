'use client'

import { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react'
import {
  type LunchHistoryEntry,
  HISTORY_STORAGE_KEY,
  LOOKBACK_STORAGE_KEY,
  MAX_HISTORY_ENTRIES,
  readStoredHistory,
  readStoredLookback,
} from './history'

interface HistoryContextValue {
  entries: LunchHistoryEntry[]
  lookbackDays: number
  isHydrated: boolean
  addEntries: (newEntries: LunchHistoryEntry[]) => void
  removeEntry: (id: string) => void
  clearHistory: () => void
  setLookbackDays: (n: number) => void
}

export const HistoryContext = createContext<HistoryContextValue | null>(null)

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LunchHistoryEntry[]>(readStoredHistory)
  const [lookbackDays, setLookbackDaysState] = useState<number>(readStoredLookback)
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  // Persist history entries to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [entries, isHydrated])

  // Persist lookbackDays setting to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(LOOKBACK_STORAGE_KEY, String(lookbackDays))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [lookbackDays, isHydrated])

  function addEntries(newEntries: LunchHistoryEntry[]) {
    setEntries((prev) => [...newEntries, ...prev].slice(0, MAX_HISTORY_ENTRIES))
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function clearHistory() {
    setEntries([])
  }

  function setLookbackDays(n: number) {
    setLookbackDaysState(Math.max(1, n))
  }

  return (
    <HistoryContext
      value={{
        entries,
        lookbackDays,
        isHydrated,
        addEntries,
        removeEntry,
        clearHistory,
        setLookbackDays,
      }}
    >
      {children}
    </HistoryContext>
  )
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider')
  return ctx
}
