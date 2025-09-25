"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Github, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { getGitHubOAuthURL } from '@/lib/integrations/github-client'

interface GitHubIntegrationProps {
  projectId: string
  currentSettings?: any
  onSettingsUpdate: (settings: any) => void
}

export default function GitHubIntegration({ projectId, currentSettings, onSettingsUpdate }: GitHubIntegrationProps) {
  const [githubRepo, setGithubRepo] = useState('')
  const [defaultBranch, setDefaultBranch] = useState('main')
  const [isConnected, setIsConnected] = useState(false)
  const [repositories, setRepositories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    checkGitHubConnection()
    loadCurrentSettings()
  }, [])

  const checkGitHubConnection = async () => {
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: integration } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'github')
          .single()

        setIsConnected(!!integration)
        
        if (integration) {
          loadRepositories(integration.access_token)
        }
      }
    } catch (error) {
      console.error('GitHub connection check error:', error)
    }
  }

  const loadCurrentSettings = async () => {
    try {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('project_integrations')
        .select('*')
        .eq('project_id', projectId)
        .eq('provider', 'github')
        .maybeSingle()
      if (data?.repo_full_name) setGithubRepo(data.repo_full_name as string)
      if (data?.default_branch) setDefaultBranch((data.default_branch as string) || 'main')
    } catch {}
  }

  const loadRepositories = async (_accessToken: string) => {
    try {
      setLoading(true)
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_repos' })
      })
      const json = await res.json()
      setRepositories(json.repos ?? [])
    } catch (error) {
      // silenced
    } finally {
      setLoading(false)
    }
  }

  const testRepository = async () => {
    if (!githubRepo) return

    try {
      setTesting(true)
      const [owner, repo] = githubRepo.split('/')
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_branches', owner, repo })
      })
      return res.ok
    } catch {
      return false
    } finally {
      setTesting(false)
    }
  }

  const handleCreateBranch = async () => {
    if (!githubRepo) return
    const base = prompt('Hangi baz branch? (örn: main)') || 'main'
    const newBranch = prompt('Yeni branch adı (örn: feature/x)') || ''
    if (!newBranch) return
    const [owner, repo] = githubRepo.split('/')
    await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_branch', owner, repo, base, newBranch })
    })
  }

  const handleCreatePr = async () => {
    if (!githubRepo) return
    const head = prompt('Kaynak branch (head) adı?') || ''
    if (!head) return
    const base = prompt('Hedef branch (base) adı? (örn: main)') || 'main'
    const title = prompt('PR başlığı?') || 'Yeni PR'
    const body = prompt('PR açıklaması (opsiyonel)') || undefined
    const [owner, repo] = githubRepo.split('/')
    await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_pr', owner, repo, head, base, title, body })
    })
  }

  const handleClosePr = async () => {
    if (!githubRepo) return
    const numberStr = prompt('Kapatılacak PR numarası?') || ''
    const number = Number(numberStr)
    if (!number) return
    const [owner, repo] = githubRepo.split('/')
    await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close_pr', owner, repo, number })
    })
  }

  const handleSave = async () => {
    try {
      const isValid = await testRepository()
      if (!isValid) {
        alert('Repository erişilemiyor veya geçersiz')
        return
      }

      const supabase = getSupabase()
      const { error } = await supabase
        .from('project_integrations')
        .upsert({
          project_id: projectId,
          provider: 'github',
          repo_full_name: githubRepo,
          default_branch: defaultBranch || 'main',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'project_id,provider' } as any)
      if (error) throw error
      onSettingsUpdate(currentSettings)
    } catch (error) {
      console.error('Save error:', error)
      alert('Ayarlar kaydedilemedi')
    }
  }

  const handleConnectGitHub = () => {
    window.open('/api/auth/github', '_blank', 'width=600,height=600')
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Entegrasyonu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            GitHub Issues&apos;ları görevlerle senkronize etmek için GitHub&apos;a bağlanın
          </p>
          <Button onClick={handleConnectGitHub} className="gap-2">
            <Github className="h-4 w-4" />
            GitHub&apos;a Bağlan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Entegrasyonu
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Bağlı
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="github-repo">GitHub Repository</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="github-repo"
              placeholder="owner/repository"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={testRepository}
              disabled={testing || !githubRepo}
            >
              {testing ? 'Test...' : 'Test'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Örnek: facebook/react, microsoft/vscode
          </p>
        </div>

        {repositories.length > 0 && (
          <div>
            <Label>Mevcut Repository&apos;leriniz</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {repositories.slice(0, 10).map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => setGithubRepo(repo.full_name)}
                >
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    <span className="text-sm font-medium">{repo.full_name}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="default-branch">Varsayılan Base Branch</Label>
          <Input
            id="default-branch"
            placeholder="main"
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value || 'main')}
            className="mt-1"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!githubRepo}>
            Kaydet
          </Button>
          <Button variant="outline" onClick={checkGitHubConnection}>
            Yenile
          </Button>
          <Button variant="outline" onClick={() => window.open(`https://github.com/${githubRepo}`, '_blank')} disabled={!githubRepo}>
            Repo&apos;yu Aç
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={handleCreateBranch} disabled={!githubRepo}>
            Branch Oluştur
          </Button>
          <Button variant="secondary" onClick={handleCreatePr} disabled={!githubRepo}>
            PR Oluştur
          </Button>
          <Button variant="secondary" onClick={handleClosePr} disabled={!githubRepo}>
            PR Kapat
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
