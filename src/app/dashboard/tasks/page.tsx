"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMyTasks } from '@/features/tasks/queries'
import { Button } from '@/components/ui/button'
import { Plus, ListTodo } from 'lucide-react'
import { DashboardHeader } from '@/components/ui/dashboard-components'
import { ListContainer } from '@/components/ui/dashboard-components'
import { EmptyTasks } from '@/components/ui/empty-state'
import { SkeletonBreadcrumb, SkeletonHeader } from '@/components/ui/loading-states'

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
        <SkeletonBreadcrumb />
        <SkeletonHeader />
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

  return (
    <div className="px-4 py-4">
      <DashboardHeader
        title="Görevlerim"
        description="Size atanmış veya oluşturduğunuz tüm görevler"
        icon={<ListTodo className="h-6 w-6" />}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Görevlerim" }
        ]}
        actions={
          <Button onClick={() => router.push('/dashboard')}>
            <Plus className="h-4 w-4 mr-2" />
            Ana Sayfaya Git
          </Button>
        }
      />
      
      <ListContainer
        loading={isLoading}
        error={error}
        empty={!isLoading && !error && (!myTasks || myTasks.length === 0)}
        emptyState={<EmptyTasks onCreateTask={() => router.push('/dashboard')} />}
        onRetry={() => window.location.reload()}
      >
        {myTasks && myTasks.length > 0 && (
          <ul className="space-y-2">
            {myTasks.map(task => (
              <li key={task.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-muted-foreground">{task.project_title}</p>
              </li>
            ))}
          </ul>
        )}
      </ListContainer>
    </div>
  )
}


