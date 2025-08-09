export type OrderKey = 'teams' | 'projects' | 'tasks'

export function saveOrder(key: OrderKey, ids: string[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`sidebar-order-${key}`, JSON.stringify(ids))
    }
  } catch {}
}

export function loadOrder(key: OrderKey): string[] | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(`sidebar-order-${key}`)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

export function applySavedOrder<T extends { id: string }>(key: OrderKey, list: T[]): T[] {
  const order = loadOrder(key)
  if (!order) return list
  const idToItem = new Map(list.map((i) => [i.id, i]))
  const ordered: T[] = []
  order.forEach((id) => {
    const it = idToItem.get(id)
    if (it) ordered.push(it)
  })
  list.forEach((it) => {
    if (!order.includes(it.id)) ordered.push(it)
  })
  return ordered
}


