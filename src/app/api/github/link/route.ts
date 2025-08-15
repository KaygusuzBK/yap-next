import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const project_id = String(form.get('project_id') || '')
  const repo_owner = String(form.get('repo_owner') || '')
  const repo_name = String(form.get('repo_name') || '')
  const installation_id_raw = String(form.get('installation_id') || '')
  const installation_id = Number(installation_id_raw)
  if (!project_id || !repo_owner || !repo_name || !installation_id || Number.isNaN(installation_id)) {
    return new Response('Eksik veya hatalı parametre', { status: 400 })
  }
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('project_github_links')
    .upsert({ project_id, repo_owner, repo_name, installation_id })
  if (error) return new Response(error.message, { status: 500 })
  return Response.json({ ok: true })
}


