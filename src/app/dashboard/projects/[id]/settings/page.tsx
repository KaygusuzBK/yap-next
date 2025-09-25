"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { getSupabase } from '@/lib/supabase'
import GitHubIntegration from '@/components/projects/GitHubIntegration'

interface Project {
  id: string
  name: string
  description: string
  settings: any
  is_primary: boolean
}

export default function ProjectSettingsPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsUpdate = async (newSettings: any) => {
    if (!project) return

    try {
      setSaving(true)
      const supabase = getSupabase()
      const { error } = await supabase
        .from('projects')
        .update({
          settings: newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      if (error) throw error
      
      setProject({ ...project, settings: newSettings })
    } catch (error) {
      console.error('Error updating project settings:', error)
      alert('Ayarlar kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Proje bulunamadı</h1>
          <p className="text-muted-foreground">Bu proje mevcut değil veya erişim yetkiniz yok.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{project.name} - Ayarlar</h1>
        <p className="text-muted-foreground">Proje ayarlarını ve entegrasyonlarını yönetin</p>
      </div>

      <div className="grid gap-6">
        {/* Genel Ayarlar */}
        <Card>
          <CardHeader>
            <CardTitle>Genel Ayarlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-name">Proje Adı</Label>
              <Input
                id="project-name"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="project-description">Açıklama</Label>
              <Textarea
                id="project-description"
                value={project.description || ''}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-primary">Ana Proje</Label>
                <p className="text-sm text-muted-foreground">
                  Bu projeyi varsayılan proje olarak ayarla
                </p>
              </div>
              <Switch
                id="is-primary"
                checked={project.is_primary}
                onCheckedChange={(is_primary) => setProject({ ...project, is_primary })}
              />
            </div>

            <Button 
              onClick={() => handleSettingsUpdate(project.settings)}
              disabled={saving}
            >
              {saving ? 'Kaydediliyor...' : 'Genel Ayarları Kaydet'}
            </Button>
          </CardContent>
        </Card>

        {/* GitHub Entegrasyonu */}
        <GitHubIntegration
          projectId={projectId}
          currentSettings={project.settings}
          onSettingsUpdate={handleSettingsUpdate}
        />

        {/* Diğer Entegrasyonlar */}
        <Card>
          <CardHeader>
            <CardTitle>Diğer Entegrasyonlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Yakında daha fazla entegrasyon eklenecek...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

