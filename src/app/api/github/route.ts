import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { GitHubService } from '@/lib/integrations/github'

async function getGitHub(accessToken?: string) {
  if (!accessToken) throw new Error('Missing token')
  return new GitHubService(accessToken)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body?.action as string

    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .single()

    if (!integration) return NextResponse.json({ error: 'No GitHub integration' }, { status: 400 })

    const gh = await getGitHub(integration.access_token)

    switch (action) {
      case 'list_repos': {
        const repos = await gh.getRepositories()
        return NextResponse.json({ repos })
      }
      case 'list_branches': {
        const { owner, repo } = body
        const branches = await gh.getBranches(owner, repo)
        return NextResponse.json({ branches })
      }
      case 'create_branch': {
        const { owner, repo, base, newBranch } = body
        const res = await gh.createBranchFrom(owner, repo, base, newBranch)
        return NextResponse.json({ res })
      }
      case 'create_pr': {
        const { owner, repo, head, base, title, body: prBody } = body
        const pr = await gh.createPullRequest(owner, repo, { title, head, base, body: prBody })
        return NextResponse.json({ pr })
      }
      case 'close_pr': {
        const { owner, repo, number } = body
        const pr = await gh.closePullRequest(owner, repo, number)
        return NextResponse.json({ pr })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


