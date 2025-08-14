"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMyTasks } from '@/features/tasks/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ChevronRight, ListTodo } from 'lucide-react'
import Link from 'next/link'

export default function MyTasksPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isClient, setIsClient] = useState(false)
  const { data: myTasks, isLoading, error } = useMyTasks()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !isMobile) {
      router.replace('/dashboard')
    }
  }, [isClient, isMobile, router])

  // İlk render'da loading göster (hydration hatasını önler)
  if (!isClient) {
    return (
      <div className="px-4 py-4">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            <ChevronRight className="h-4 w-4" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="mb-4">
          <div className="h-7 w-32 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
        </div>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!isMobile) {
    return null
  }

  if (isLoading) return <div className="px-4 py-4">Yükleniyor...</div>
  if (error) return <div className="px-4 py-4 text-red-600">Hata: {error.message}</div>

  return (
    <div className="px-4 py-4">
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Görevlerim</span>
        </nav>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ListTodo className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Görevlerim</h1>
        </div>
        <p className="text-muted-foreground">Size atanmış veya oluşturduğunuz tüm görevler</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Görevlerim</CardTitle>
              <CardDescription>Size atanmış veya oluşturduğunuz tüm görevler</CardDescription>
            </div>
            <Button onClick={() => router.push('/dashboard')}>
              <Plus className="h-4 w-4 mr-2" />
              Ana Sayfaya Git
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {myTasks && myTasks.length > 0 ? (
            <ul className="space-y-2">
              {myTasks.map(task => (
                <li key={task.id} className="p-3 border rounded-md">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">{task.project_title}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Henüz size atanmış veya oluşturduğunuz görev yok.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


