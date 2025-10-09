export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GitHub entegrasyonlarını listele
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const promises: any[] = []
    promises.push(
      admin
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'github')
    )
    if (projectId) {
      promises.push(
        admin
          .from('project_integrations')
          .select('*')
          .eq('project_id', projectId)
          .eq('provider', 'github')
          .single()
      )
    }
    const [userIntRes, projectIntRes] = await Promise.all(promises as any)
    const data = (userIntRes as any).data
    const error = (userIntRes as any).error

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching GitHub integrations:', error)
      }
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
    }

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching GitHub integrations:', error)
      }
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
    }

    const projectIntegration = projectId ? (projectIntRes as any)?.data ?? null : null
    return NextResponse.json({ integrations: data || [], projectIntegration })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('GitHub integrations error:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GitHub entegrasyonunu güncelle
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const integrationId = searchParams.get('integrationId')
    const projectId = searchParams.get('projectId')
    const body = await req.json()

    const admin = getSupabaseAdmin()
    if (projectId) {
      // upsert project repo mapping
      const payload = {
        project_id: projectId,
        provider: 'github',
        repo_full_name: body.repo_full_name,
        default_branch: body.default_branch ?? 'main',
        updated_at: new Date().toISOString()
      }
      const { error } = await admin
        .from('project_integrations')
        .upsert(payload, { onConflict: 'project_id,provider' })
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error upserting project integration:', error)
        }
        return NextResponse.json({ error: 'Failed to save project integration' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 })
    }

    const { error } = await admin
      .from('user_integrations')
      .update({
        sync_enabled: body.sync_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId)

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating GitHub integration:', error)
      }
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Update GitHub integration error:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GitHub entegrasyonunu sil
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const integrationId = searchParams.get('integrationId')

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('user_integrations')
      .delete()
      .eq('id', integrationId)

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting GitHub integration:', error)
      }
      return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Delete GitHub integration error:', error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

