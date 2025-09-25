export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GitHub issues ve PR'ları senkronize et
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const integrationId = searchParams.get('integrationId')

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    
    // Entegrasyon bilgilerini al
    const { data: integration, error: integrationError } = await admin
      .from('user_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('provider', 'github')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const accessToken = integration.access_token
    const repos = integration.provider_data?.repos || []

    let syncedIssues = 0
    let syncedPRs = 0
    const errors = []

    // Her repository için issues ve PR'ları al
    for (const repo of repos.slice(0, 10)) { // İlk 10 repo ile sınırla
      try {
        // Issues al
        const issuesResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/issues?state=all&per_page=100`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        })

        if (issuesResponse.ok) {
          const issues = await issuesResponse.json()
          
          for (const issue of issues) {
            // Issue'yu veritabanına kaydet
            const { error: issueError } = await admin
              .from('github_issues')
              .upsert({
                integration_id: integrationId,
                github_id: issue.id,
                repository: repo.full_name,
                number: issue.number,
                title: issue.title,
                body: issue.body,
                state: issue.state,
                labels: issue.labels?.map((l: any) => l.name) || [],
                assignees: issue.assignees?.map((a: any) => a.login) || [],
                author: issue.user?.login,
                created_at: issue.created_at,
                updated_at: issue.updated_at,
                closed_at: issue.closed_at,
                html_url: issue.html_url,
                is_pull_request: issue.pull_request ? true : false,
              }, { onConflict: 'integration_id,github_id' })

            if (!issueError) {
              syncedIssues++
            }
          }
        }

        // Pull Requests al (issues'dan farklı olarak)
        const prsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/pulls?state=all&per_page=100`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        })

        if (prsResponse.ok) {
          const prs = await prsResponse.json()
          
          for (const pr of prs) {
            // PR'ı veritabanına kaydet
            const { error: prError } = await admin
              .from('github_pull_requests')
              .upsert({
                integration_id: integrationId,
                github_id: pr.id,
                repository: repo.full_name,
                number: pr.number,
                title: pr.title,
                body: pr.body,
                state: pr.state,
                labels: pr.labels?.map((l: any) => l.name) || [],
                assignees: pr.assignees?.map((a: any) => a.login) || [],
                author: pr.user?.login,
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                closed_at: pr.closed_at,
                merged_at: pr.merged_at,
                html_url: pr.html_url,
                head_ref: pr.head.ref,
                base_ref: pr.base.ref,
                draft: pr.draft,
              }, { onConflict: 'integration_id,github_id' })

            if (!prError) {
              syncedPRs++
            }
          }
        }

      } catch (repoError) {
        errors.push(`Repository ${repo.full_name}: ${repoError}`)
      }
    }

    // Son senkronizasyon zamanını güncelle
    await admin
      .from('user_integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId)

    return NextResponse.json({
      success: true,
      syncedIssues,
      syncedPRs,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('GitHub sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

