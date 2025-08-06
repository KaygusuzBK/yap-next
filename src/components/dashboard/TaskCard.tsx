import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Task } from '@/lib/types'
import { Calendar, Clock, Tag, User, Repeat, AlertTriangle } from 'lucide-react'
import { TASK_STATUS_LABELS, PRIORITY_LABELS, TASK_STATUSES, TASK_PRIORITIES, PRIORITY_COLORS, RECURRING_PATTERN_LABELS } from '@/constants'
import { formatDate } from '@/utils/format'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case TASK_STATUSES.TODO:
        return 'bg-gray-100 text-gray-800'
      case TASK_STATUSES.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800'
      case TASK_STATUSES.REVIEW:
        return 'bg-yellow-100 text-yellow-800'
      case TASK_STATUSES.COMPLETED:
        return 'bg-green-100 text-green-800'
      case TASK_STATUSES.CANCELLED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-100 text-gray-800'
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-200 bg-red-50/50' : ''
      }`}
      onClick={onClick}
      style={{ borderLeftColor: task.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {task.description || 'Açıklama yok'}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge className={getStatusColor(task.status)}>
              {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] || task.status}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS] || task.priority}
            </Badge>
            {task.isRecurring && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                {RECURRING_PATTERN_LABELS[task.recurringPattern as keyof typeof RECURRING_PATTERN_LABELS] || 'Tekrarlayan'}
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Gecikmiş
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Atanan:</span>
            {task.assignee ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar || ''} alt={task.assignee.name} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Atanmamış</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {task.dueDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Bitiş Tarihi</p>
                <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {formatDate(task.dueDate)}
                </p>
              </div>
            </div>
          )}
          
          {(task.estimatedHours || task.actualHours) && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Süre</p>
                <p className="font-medium">
                  {task.actualHours || 0}h / {task.estimatedHours || 0}h
                </p>
              </div>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {task.project && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Proje:</span>
            <span className="font-medium">{task.project.title}</span>
          </div>
        )}

        {task.isRecurring && task.recurringEndDate && (
          <div className="flex items-center space-x-2 text-sm">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tekrarlama Bitiş:</span>
            <span className="font-medium">{formatDate(task.recurringEndDate)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 