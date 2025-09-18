"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, FileText, Users, Folder } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
  variant?: "default" | "card" | "minimal"
  size?: "sm" | "md" | "lg"
  showSearch?: boolean
  onSearch?: () => void
  searchLabel?: string
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  icon,
  variant = "default",
  size = "md",
  showSearch = false,
  onSearch,
  searchLabel = "Ara"
}: EmptyStateProps) {
  const sizeClasses = {
    sm: "p-4 min-h-[120px]",
    md: "p-8 min-h-[200px]",
    lg: "p-12 min-h-[300px]"
  }

  const content = (
    <div className={`flex flex-col items-center justify-center text-center space-y-4 ${sizeClasses[size]}`}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="space-y-2">
        <h3 className={`font-medium ${size === 'lg' ? 'text-xl' : 'text-base'}`}>{title}</h3>
        {description && (
          <p className={`text-muted-foreground max-w-md ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {showSearch && onSearch && (
          <Button variant="outline" onClick={onSearch} size="sm">
            <Search className="h-4 w-4 mr-2" />
            {searchLabel}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )

  if (variant === "card") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Boş Durum</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    )
  }

  if (variant === "minimal") {
    return (
      <div className="text-center py-8">
        {icon && <div className="mb-2 text-muted-foreground">{icon}</div>}
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    )
  }

  return (
    <div className={`rounded-lg border bg-muted/20 ${sizeClasses[size]}`}>
      {content}
    </div>
  )
}

// Özel boş durum bileşenleri
export function EmptyTasks({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      title="Henüz görev yok"
      description="Bu projede henüz görev oluşturulmamış. İlk görevinizi oluşturmak için butona tıklayın."
      actionLabel="Görev Oluştur"
      onAction={onCreateTask}
      icon={<FileText className="h-8 w-8" />}
    />
  )
}

export function EmptyProjects({ onCreateProject }: { onCreateProject?: () => void }) {
  return (
    <EmptyState
      title="Henüz proje yok"
      description="Henüz hiç proje oluşturulmamış. İlk projenizi oluşturmak için butona tıklayın."
      actionLabel="Proje Oluştur"
      onAction={onCreateProject}
      icon={<Folder className="h-8 w-8" />}
    />
  )
}

export function EmptyTeams({ onCreateTeam }: { onCreateTeam?: () => void }) {
  return (
    <EmptyState
      title="Henüz takım yok"
      description="Henüz hiç takım oluşturulmamış. İlk takımınızı oluşturmak için butona tıklayın."
      actionLabel="Takım Oluştur"
      onAction={onCreateTeam}
      icon={<Users className="h-8 w-8" />}
    />
  )
}

export function EmptySearch({ 
  searchTerm, 
  onClearSearch 
}: { 
  searchTerm?: string
  onClearSearch?: () => void 
}) {
  return (
    <EmptyState
      title="Sonuç bulunamadı"
      description={searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : "Arama kriterlerinize uygun sonuç bulunamadı."}
      actionLabel="Aramayı Temizle"
      onAction={onClearSearch}
      icon={<Search className="h-8 w-8" />}
      showSearch={true}
    />
  )
}

export function EmptyFilter({ onClearFilter }: { onClearFilter?: () => void }) {
  return (
    <EmptyState
      title="Filtre sonucu bulunamadı"
      description="Uyguladığınız filtreler için sonuç bulunamadı. Filtreleri temizleyip tekrar deneyin."
      actionLabel="Filtreleri Temizle"
      onAction={onClearFilter}
      icon={<Filter className="h-8 w-8" />}
    />
  )
}


