import { create } from 'zustand'

type RecentItem = { href: string; label: string; sub?: string; type: 'task' | 'project' | 'team'; ts: number }

type CommandMenuState = {
  open: boolean
  query: string
  recents: RecentItem[]
  setOpen: (open: boolean) => void
  setQuery: (q: string) => void
  loadRecents: () => void
  addRecent: (item: Omit<RecentItem, 'ts'>) => void
}

export const useCommandMenuStore = create<CommandMenuState>((set, get) => ({
  open: false,
  query: '',
  recents: [],
  setOpen: (open) => set({ open }),
  setQuery: (q) => set({ query: q }),
  loadRecents: () => {
    try {
      const raw = localStorage.getItem('recent-items')
      if (!raw) return
      const parsed = JSON.parse(raw) as RecentItem[]
      set({ recents: parsed.sort((a, b) => b.ts - a.ts).slice(0, 10) })
    } catch {}
  },
  addRecent: (item) => {
    try {
      const now = Date.now()
      const current = get().recents
      const next = [{ ...item, ts: now }, ...current.filter((i) => i.href !== item.href)]
      localStorage.setItem('recent-items', JSON.stringify(next.slice(0, 20)))
      set({ recents: next.slice(0, 10) })
    } catch {}
  },
}))


