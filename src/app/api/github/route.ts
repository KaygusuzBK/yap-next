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
    case 'create_branch_for_task': {
      const { taskId, base = 'main' } = body
      if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

      // Fetch task with project settings
      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .select('id, title, project_id')
        .eq('id', taskId)
        .single()

      if (taskErr || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

      // read project integration mapping
      const { data: projectIntegration } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('project_id', task.project_id)
        .eq('provider', 'github')
        .single()
      const githubRepo: string | undefined = (projectIntegration as any)?.repo_full_name
      const baseBranch: string = (projectIntegration as any)?.default_branch || base
      if (!githubRepo) return NextResponse.json({ error: 'Project has no github repo mapping' }, { status: 400 })

      const [owner, repo] = githubRepo.split('/')
      // Simple branch name from task title
      const slug = (task.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9\-\s_]/g, '')
        .trim()
        .replace(/[\s_]+/g, '-')
        .slice(0, 60)
      const branchName = `feat/${slug || 'task-' + task.id}`

      const res = await gh.createBranchFrom(owner, repo, baseBranch, branchName)
      return NextResponse.json({ ok: true, branch: branchName, res })
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


