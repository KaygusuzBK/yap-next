import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Project } from '@/lib/types'
import { Calendar, DollarSign, User, Tag, Eye } from 'lucide-react'
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES, PRIORITY_LABELS, PRIORITY_COLORS } from '@/constants'
import { formatDate, formatCurrency } from '@/utils/format'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case PROJECT_STATUSES.ACTIVE:
        return 'bg-green-100 text-green-800'
      case PROJECT_STATUSES.COMPLETED:
        return 'bg-blue-100 text-blue-800'
      case PROJECT_STATUSES.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800'
      case PROJECT_STATUSES.CANCELLED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {project.description || 'Açıklama yok'}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge className={getStatusColor(project.status)}>
              {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] || project.status}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {PRIORITY_LABELS[project.priority as keyof typeof PRIORITY_LABELS] || project.priority}
            </Badge>
            {project.isPublic && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Public
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">İlerleme</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Başlangıç</p>
              <p className="font-medium">{formatDate(project.startDate)}</p>
            </div>
          </div>
          
          {project.endDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Bitiş</p>
                <p className="font-medium">{formatDate(project.endDate)}</p>
              </div>
            </div>
          )}
        </div>

        {project.budget && (
          <div className="flex items-center space-x-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Bütçe:</span>
            <span className="font-medium">{formatCurrency(project.budget)}</span>
          </div>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {project.owner && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Proje Sahibi:</span>
            <span className="font-medium">{project.owner.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 