import { getSupabase } from "@/lib/supabase"

export type NotificationPrefs = {
  mentionDm?: boolean
  emailDigest?: 'off' | 'daily' | 'weekly'
}

export type GeneralPrefs = {
  language?: string
  timezone?: string
  defaultLanding?: '/dashboard' | '/dashboard#projects' | '/dashboard#tasks'
}

export type WebhookConfig = {
  id: string
  url: string
  events: string[]
}

export type ApiToken = {
  id: string
  label?: string
  token: string
  createdAt: string
}

export type UserPrefs = {
  general?: GeneralPrefs
  notifications?: NotificationPrefs
  webhooks?: WebhookConfig[]
  api_tokens?: ApiToken[]
}

export async function getUserPrefs(): Promise<UserPrefs> {
  const supabase = getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return {} as UserPrefs
  const { data } = await supabase
    .from('user_preferences')
    .select('prefs')
    .eq('user_id', userId)
    .maybeSingle()
  const prefs = (data?.prefs as unknown) as UserPrefs | undefined
  return prefs ?? {}
}

export async function saveUserPrefs(partial: Partial<UserPrefs>): Promise<void> {
  const supabase = getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('not_authenticated')
  const current = await getUserPrefs().catch(() => ({} as UserPrefs))
  const merged = { ...current, ...partial }
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, prefs: merged }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function updateProfileName(name: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.updateUser({ data: { full_name: name, name }})
  if (error) throw error
}

export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl }})
  if (error) throw error
}

export async function changePassword(newPassword: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export function generateToken(label?: string): ApiToken {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  return { id: crypto.randomUUID(), label, token, createdAt: new Date().toISOString() }
}


