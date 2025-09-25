export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GitHub entegrasyonlarını listele
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'github')

    if (error) {
      console.error('Error fetching GitHub integrations:', error)
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
    }

    return NextResponse.json({ integrations: data || [] })
  } catch (error) {
    console.error('GitHub integrations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GitHub entegrasyonunu güncelle
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const integrationId = searchParams.get('integrationId')
    const body = await req.json()

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('user_integrations')
      .update({
        sync_enabled: body.sync_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId)

    if (error) {
      console.error('Error updating GitHub integration:', error)
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update GitHub integration error:', error)
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
      console.error('Error deleting GitHub integration:', error)
      return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete GitHub integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

