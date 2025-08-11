import { getSupabase } from "@/lib/supabase"

export type ModePalette = {
  background?: string
  foreground?: string
  primary?: string
  primaryForeground?: string
  accent?: string
  accentForeground?: string
  ring?: string
}

export type UserTheme = {
  light?: ModePalette
  dark?: ModePalette
}

export async function getUserTheme(): Promise<UserTheme | null> {
  const supabase = getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return null
  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  const theme = (data?.theme as unknown) as UserTheme | null
  return theme ?? null
}

export async function saveUserTheme(theme: UserTheme): Promise<void> {
  const supabase = getSupabase()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('not_authenticated')
  const payload = { user_id: userId, theme }
  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

export function pickReadableForeground(hex?: string): string | undefined {
  if (!hex) return undefined
  try {
    // Normalize #RRGGBB
    const c = hex.replace('#','')
    const r = parseInt(c.substring(0,2), 16) / 255
    const g = parseInt(c.substring(2,4), 16) / 255
    const b = parseInt(c.substring(4,6), 16) / 255
    const srgb = [r,g,b].map((x) => x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4))
    const L = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2]
    // Contrast threshold ~ choose white on dark colors
    return L > 0.6 ? '#111111' : '#ffffff'
  } catch {
    return undefined
  }
}


