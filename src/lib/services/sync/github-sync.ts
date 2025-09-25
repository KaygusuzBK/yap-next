import { getSupabase } from '@/lib/supabase'
import { GitHubService, GitHubIssue } from '@/lib/integrations/github'

export interface SyncResult {
  success: boolean
  message: string
  syncedCount: number
  errors: string[]
}

export class GitHubSyncService {
  private supabase = getSupabase()

  async syncIssuesToTasks(userId: string, projectId: string): Promise<SyncResult> {
    try {
      // Kullanıcının GitHub entegrasyonunu al
      const { data: integration, error: integrationError } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'github')
        .single()

      if (integrationError || !integration) {
        return {
          success: false,
          message: 'GitHub entegrasyonu bulunamadı',
          syncedCount: 0,
          errors: ['GitHub integration not found']
        }
      }

      const githubService = new GitHubService(integration.access_token)
      
      // Proje bilgilerini al
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError || !project) {
        return {
          success: false,
          message: 'Proje bulunamadı',
          syncedCount: 0,
          errors: ['Project not found']
        }
      }

      // GitHub repository bilgilerini al (proje ayarlarından)
      const projectSettings = project.settings as any
      const githubRepo = projectSettings?.github_repo

      if (!githubRepo) {
        return {
          success: false,
          message: 'Proje için GitHub repository ayarlanmamış',
          syncedCount: 0,
          errors: ['GitHub repository not configured for project']
        }
      }

      const [owner, repo] = githubRepo.split('/')
      const issues = await githubService.getIssues(owner, repo, 'open')

      let syncedCount = 0
      const errors: string[] = []

      for (const issue of issues) {
        try {
          // Mevcut görevi kontrol et
          const { data: existingTask } = await this.supabase
            .from('tasks')
            .select('id')
            .eq('project_id', projectId)
            .eq('external_id', issue.id.toString())
            .eq('external_type', 'github_issue')
            .single()

          if (existingTask) {
            // Mevcut görevi güncelle
            await this.supabase
              .from('tasks')
              .update({
                title: issue.title,
                description: issue.body || '',
                status: issue.state === 'open' ? 'in_progress' : 'completed',
                updated_at: new Date().toISOString(),
                external_data: {
                  github_issue: issue,
                  last_synced: new Date().toISOString()
                }
              })
              .eq('id', existingTask.id)
          } else {
            // Yeni görev oluştur
            const { error: taskError } = await this.supabase
              .from('tasks')
              .insert({
                project_id: projectId,
                title: issue.title,
                description: issue.body || '',
                status: issue.state === 'open' ? 'in_progress' : 'completed',
                priority: this.mapGitHubLabelsToPriority(issue.labels),
                external_id: issue.id.toString(),
                external_type: 'github_issue',
                external_url: issue.html_url,
                external_data: {
                  github_issue: issue,
                  last_synced: new Date().toISOString()
                },
                created_at: issue.created_at,
                updated_at: issue.updated_at
              })

            if (taskError) {
              errors.push(`Görev oluşturulamadı: ${issue.title} - ${taskError.message}`)
              continue
            }
          }

          syncedCount++
        } catch (error) {
          errors.push(`Issue sync hatası: ${issue.title} - ${error}`)
        }
      }

      return {
        success: errors.length === 0,
        message: `${syncedCount} GitHub issue senkronize edildi`,
        syncedCount,
        errors
      }

    } catch (error) {
      return {
        success: false,
        message: 'GitHub sync hatası',
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async syncTaskToGitHubIssue(taskId: string): Promise<SyncResult> {
    try {
      // Görev bilgilerini al
      const { data: task, error: taskError } = await this.supabase
        .from('tasks')
        .select(`
          *,
          projects!inner(*)
        `)
        .eq('id', taskId)
        .single()

      if (taskError || !task) {
        return {
          success: false,
          message: 'Görev bulunamadı',
          syncedCount: 0,
          errors: ['Task not found']
        }
      }

      // GitHub entegrasyonunu al
      const { data: integration, error: integrationError } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', task.user_id)
        .eq('provider', 'github')
        .single()

      if (integrationError || !integration) {
        return {
          success: false,
          message: 'GitHub entegrasyonu bulunamadı',
          syncedCount: 0,
          errors: ['GitHub integration not found']
        }
      }

      const githubService = new GitHubService(integration.access_token)
      const projectSettings = task.projects.settings as any
      const githubRepo = projectSettings?.github_repo

      if (!githubRepo) {
        return {
          success: false,
          message: 'Proje için GitHub repository ayarlanmamış',
          syncedCount: 0,
          errors: ['GitHub repository not configured for project']
        }
      }

      const [owner, repo] = githubRepo.split('/')

      if (task.external_id && task.external_type === 'github_issue') {
        // Mevcut issue'yu güncelle
        const labels = this.mapTaskToGitHubLabels(task)
        await githubService.updateIssue(owner, repo, parseInt(task.external_id), {
          title: task.title,
          body: task.description || '',
          state: task.status === 'completed' ? 'closed' : 'open',
          labels
        })
      } else {
        // Yeni issue oluştur
        const labels = this.mapTaskToGitHubLabels(task)
        const issue = await githubService.createIssue(owner, repo, task.title, task.description || '', labels)
        
        // Görevi GitHub issue ile ilişkilendir
        await this.supabase
          .from('tasks')
          .update({
            external_id: issue.id.toString(),
            external_type: 'github_issue',
            external_url: issue.html_url,
            external_data: {
              github_issue: issue,
              last_synced: new Date().toISOString()
            }
          })
          .eq('id', taskId)
      }

      return {
        success: true,
        message: 'Görev GitHub ile senkronize edildi',
        syncedCount: 1,
        errors: []
      }

    } catch (error) {
      return {
        success: false,
        message: 'GitHub sync hatası',
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private mapGitHubLabelsToPriority(labels: Array<{ name: string; color: string }>): 'low' | 'medium' | 'high' | 'urgent' {
    const labelNames = labels.map(l => l.name.toLowerCase())
    
    if (labelNames.includes('urgent') || labelNames.includes('critical')) return 'urgent'
    if (labelNames.includes('high') || labelNames.includes('important')) return 'high'
    if (labelNames.includes('low') || labelNames.includes('minor')) return 'low'
    
    return 'medium'
  }

  private mapTaskToGitHubLabels(task: any): string[] {
    const labels: string[] = []
    
    // Priority'ye göre label ekle
    switch (task.priority) {
      case 'urgent':
        labels.push('urgent')
        break
      case 'high':
        labels.push('high-priority')
        break
      case 'low':
        labels.push('low-priority')
        break
      default:
        labels.push('medium-priority')
    }

    // Status'a göre label ekle
    switch (task.status) {
      case 'completed':
        labels.push('done')
        break
      case 'in_progress':
        labels.push('in-progress')
        break
      case 'pending':
        labels.push('todo')
        break
    }

    return labels
  }
}
