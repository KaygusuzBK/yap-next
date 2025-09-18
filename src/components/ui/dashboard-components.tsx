"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, EmptyTasks, EmptyProjects, EmptyTeams } from "@/components/ui/empty-state"
import { ErrorState, NetworkError, NotFoundError } from "@/components/ui/error-states"
import { SkeletonList, SkeletonCard, SkeletonTable } from "@/components/ui/loading-states"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// Dashboard sayfa başlığı bileşeni
interface DashboardHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  breadcrumb?: Array<{ label: string; href?: string }>
  className?: string
}

export function DashboardHeader({ 
  title, 
  description, 
  icon, 
  actions, 
  breadcrumb,
  className 
}: DashboardHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {breadcrumb && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {item.href ? (
                <a 
                  href={item.href} 
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// Durum mesajı bileşeni
interface StatusMessageProps {
  type: "success" | "error" | "warning" | "info"
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function StatusMessage({ 
  type, 
  title, 
  description, 
  action, 
  className 
}: StatusMessageProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <Clock className="h-5 w-5 text-blue-600" />
  }

  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    info: "border-blue-200 bg-blue-50 text-blue-800"
  }

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border",
      styles[type],
      className
    )}>
      {icons[type]}
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        {description && (
          <p className="text-sm mt-1 opacity-90">{description}</p>
        )}
      </div>
      {action && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={action.onClick}
          className="ml-auto"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Liste konteyner bileşeni
interface ListContainerProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  loading?: boolean
  error?: Error | null
  empty?: boolean
  emptyState?: React.ReactNode
  onRetry?: () => void
  className?: string
}

export function ListContainer({
  title,
  description,
  actions,
  children,
  loading = false,
  error = null,
  empty = false,
  emptyState,
  onRetry,
  className
}: ListContainerProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent>
          <SkeletonList />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent>
          <ErrorState
            title="Veri yüklenirken hata oluştu"
            description={error.message}
            onRetry={onRetry}
            showRetry={!!onRetry}
          />
        </CardContent>
      </Card>
    )
  }

  if (empty) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent>
          {emptyState || <EmptyState title="Veri bulunamadı" />}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Arama ve filtre bileşeni
interface SearchAndFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  filters?: Array<{
    key: string
    label: string
    options: Array<{ value: string; label: string }>
    value: string
    onChange: (value: string) => void
  }>
  onClearFilters?: () => void
  className?: string
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  placeholder = "Ara...",
  filters = [],
  onClearFilters,
  className
}: SearchAndFilterProps) {
  const hasActiveFilters = filters.some(f => f.value !== "")

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {hasActiveFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <XCircle className="h-4 w-4 mr-2" />
            Temizle
          </Button>
        )}
      </div>
      
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
    </div>
  )
}

// İstatistik kartı bileşeni
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  icon?: React.ReactNode
  loading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  loading = false,
  className
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                <Badge 
                  variant={trend.positive ? "default" : "destructive"}
                  className="text-xs"
                >
                  {trend.positive ? "+" : ""}{trend.value}%
                </Badge>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
