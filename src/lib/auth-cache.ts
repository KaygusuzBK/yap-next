import type { User } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

let cachedUser: User | null | undefined
let inflight: Promise<User | null> | null = null

export async function getUserCached(): Promise<User | null> {
  if (cachedUser !== undefined) return cachedUser
  if (inflight) return inflight

  const supabase = getSupabase()
  inflight = supabase.auth.getUser().then(({ data }) => {
    cachedUser = data.user ?? null
    inflight = null
    return cachedUser
  }).catch(() => {
    cachedUser = null
    inflight = null
    return null
  })
  return inflight
}

export function setCachedUser(user: User | null) {
  cachedUser = user
}
