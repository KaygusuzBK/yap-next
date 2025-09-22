"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { type Task } from "@/features/tasks/api"
import { type ProjectTaskStatus } from "@/features/tasks/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Flag, Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react"
import { format, isAfter, isBefore, isToday, isTomorrow, isYesterday } from "date-fns"
import { tr } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useVirtualizer } from '@tanstack/react-virtual'
// virtualization temporarily removed due to bundler incompatibility

interface TaskKanbanProps {
  tasks: Task[]
  statusesByProject: Record<string, ProjectTaskStatus[]>
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  getGroupForTask: (task: Task) => "todo" | "in_progress" | "review" | "completed"
  getDefaultKeyForGroup: (projectId: string, group: "todo" | "in_progress" | "review" | "completed") => string
  projects?: Array<{ id: string; title: string }>
}

export default function TaskKanban({ 
  tasks, 
  statusesByProject, 
  onTaskUpdate, 
  getGroupForTask,
  getDefaultKeyForGroup,
  projects = []
}: TaskKanbanProps) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<"todo" | "in_progress" | "review" | "completed" | null>(null)
  
  // Filtre state'leri
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [dueDateFilter, setDueDateFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const priorityTheme: Record<NonNullable<Task["priority"]>, { chip: string; dot: string }> = {
    urgent: {
      chip: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
      dot: "bg-red-500",
    },
    high: {
      chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
      dot: "bg-amber-500",
    },
    medium: {
      chip: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30",
      dot: "bg-sky-500",
    },
    low: {
      chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
      dot: "bg-emerald-500",
    },
  }

  // Filtrelenmiş görevler
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Arama filtresi
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Öncelik filtresi
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false
      }
      
      // Proje filtresi
      if (projectFilter !== "all" && task.project_id !== projectFilter) {
        return false
      }
      
      // Atanan kişi filtresi
      if (assigneeFilter !== "all" && task.assignee_name !== assigneeFilter) {
        return false
      }
      
      // Bitiş tarihi filtresi
      if (dueDateFilter !== "all" && task.due_date) {
        const dueDate = new Date(task.due_date)
        const today = new Date()
        
        switch (dueDateFilter) {
          case "overdue":
            if (!isBefore(dueDate, today)) return false
            break
          case "today":
            if (!isToday(dueDate)) return false
            break
          case "tomorrow":
            if (!isTomorrow(dueDate)) return false
            break
          case "thisWeek":
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            if (!isAfter(dueDate, today) || !isBefore(dueDate, weekFromNow)) return false
            break
          case "noDate":
            return false
        }
      } else if (dueDateFilter === "noDate" && task.due_date) {
        return false
      }
      
      return true
    })
  }, [tasks, searchTerm, priorityFilter, projectFilter, assigneeFilter, dueDateFilter])

  const statusGroups = useMemo(() => {
    const groups = {
      todo: [] as Task[],
      in_progress: [] as Task[],
      review: [] as Task[],
      completed: [] as Task[],
    }
    
    filteredTasks.forEach(task => {
      const group = getGroupForTask(task)
      groups[group].push(task)
    })
    
    return groups
  }, [filteredTasks, getGroupForTask])

  // Benzersiz atanan kişileri al
  const assignees = useMemo(() => {
    const uniqueAssignees = Array.from(new Set(tasks.map(t => t.assignee_name).filter(Boolean)))
    return uniqueAssignees.sort()
  }, [tasks])

  const handleDragStart = (taskId: string) => {
    setDragTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, status: "todo" | "in_progress" | "review" | "completed") => {
    e.preventDefault()
    setDragOverStatus(status)
  }

  const handleDragLeave = () => {
    setDragOverStatus(null)
  }

  const handleDrop = (e: React.DragEvent, targetStatus: "todo" | "in_progress" | "review" | "completed") => {
    e.preventDefault()
    if (!dragTaskId) return

    const task = tasks.find(t => t.id === dragTaskId)
    if (!task) return

    const newStatus = getDefaultKeyForGroup(task.project_id, targetStatus)
    onTaskUpdate(dragTaskId, { status: newStatus })
    
    setDragTaskId(null)
    setDragOverStatus(null)
  }

  const getStatusTitle = (status: "todo" | "in_progress" | "review" | "completed") => {
    const titles = {
      todo: "Yapılacaklar",
      in_progress: "Devam Eden",
      review: "İnceleme",
      completed: "Tamamlanan"
    }
    return titles[status]
  }

  const getStatusColor = (status: "todo" | "in_progress" | "review" | "completed") => {
    const colors = {
      todo: "bg-gray-100 dark:bg-gray-800",
      in_progress: "bg-blue-100 dark:bg-blue-900/30",
      review: "bg-yellow-100 dark:bg-yellow-900/30",
      completed: "bg-green-100 dark:bg-green-900/30"
    }
    return colors[status]
  }

  const clearFilters = () => {
    setSearchTerm("")
    setPriorityFilter("all")
    setProjectFilter("all")
    setAssigneeFilter("all")
    setDueDateFilter("all")
  }

  const activeFiltersCount = [
    searchTerm,
    priorityFilter !== "all",
    projectFilter !== "all", 
    assigneeFilter !== "all",
    dueDateFilter !== "all"
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Filtre ve Arama Bölümü */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Görevlerde ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filtreler
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtreler</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Temizle
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Öncelik</label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tüm öncelikler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm öncelikler</SelectItem>
                        <SelectItem value="urgent">Acil</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="low">Düşük</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Proje</label>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tüm projeler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm projeler</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Atanan</label>
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tüm atananlar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm atananlar</SelectItem>
                        {assignees.map(assignee => (
                          <SelectItem key={assignee} value={assignee}>
                            {assignee}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bitiş Tarihi</label>
                    <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tüm tarihler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm tarihler</SelectItem>
                        <SelectItem value="overdue">Gecikenler</SelectItem>
                        <SelectItem value="today">Bugün</SelectItem>
                        <SelectItem value="tomorrow">Yarın</SelectItem>
                        <SelectItem value="thisWeek">Bu hafta</SelectItem>
                        <SelectItem value="noDate">Tarih yok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Aktif filtreler */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Arama: {searchTerm}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
              </Badge>
            )}
            {priorityFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Öncelik: {priorityFilter === 'urgent' ? 'Acil' : 
                         priorityFilter === 'high' ? 'Yüksek' :
                         priorityFilter === 'medium' ? 'Orta' : 'Düşük'}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPriorityFilter("all")} />
              </Badge>
            )}
            {projectFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Proje: {projects.find(p => p.id === projectFilter)?.title}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setProjectFilter("all")} />
              </Badge>
            )}
            {assigneeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Atanan: {assigneeFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setAssigneeFilter("all")} />
              </Badge>
            )}
            {dueDateFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Tarih: {dueDateFilter === 'overdue' ? 'Gecikenler' :
                       dueDateFilter === 'today' ? 'Bugün' :
                       dueDateFilter === 'tomorrow' ? 'Yarın' :
                       dueDateFilter === 'thisWeek' ? 'Bu hafta' : 'Tarih yok'}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setDueDateFilter("all")} />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {Object.entries(statusGroups).map(([status, statusTasks]) => {
        const parentRef = useRef<HTMLDivElement | null>(null)
        const virtualizer = useVirtualizer({
          count: statusTasks.length,
          getScrollElement: () => parentRef.current,
          estimateSize: () => 160,
          overscan: 4,
        })
        return (
        <div
          key={status}
          className={`rounded-lg border-2 border-dashed p-4 min-h-[400px] transition-colors ${
            dragOverStatus === status ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'
          } ${getStatusColor(status as any)}`}
          onDragOver={(e) => handleDragOver(e, status as any)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status as any)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">{getStatusTitle(status as any)}</h3>
            <Badge variant="secondary" className="text-xs">
              {statusTasks.length}
            </Badge>
          </div>
          
          <div className="space-y-3" ref={parentRef} style={{ maxHeight: 560, overflow: 'auto', position: 'relative' }}>
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vItem => {
              const index = vItem.index
              const task = statusTasks[index]
                const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date())
                const isDueToday = task.due_date && isToday(new Date(task.due_date))
                const isDueTomorrow = task.due_date && isTomorrow(new Date(task.due_date))
                return (
                <Card
                  key={task.id}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${vItem.start}px)` }}
                  className={`cursor-move hover:shadow-md transition-all ${
                    dragTaskId === task.id ? 'opacity-50' : ''
                  } ${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                        {task.title}
                      </CardTitle>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          Gecikti
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Proje bilgisi */}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Proje:</span> {task.project_title}
                      </div>
                      
                      {/* Öncelik ve durum */}
                      <div className="flex items-center justify-between">
                        {task.priority && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${priorityTheme[task.priority].chip}`}
                          >
                            <div className={`w-2 h-2 rounded-full mr-1 ${priorityTheme[task.priority].dot}`} />
                            {task.priority === 'urgent' ? 'Acil' : 
                             task.priority === 'high' ? 'Yüksek' :
                             task.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </Badge>
                        )}
                        
                        {task.due_date && (
                          <div className={`flex items-center text-xs ${
                            isOverdue ? 'text-red-600 font-medium' :
                            isDueToday ? 'text-orange-600 font-medium' :
                            isDueTomorrow ? 'text-yellow-600 font-medium' :
                            'text-muted-foreground'
                          }`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {isDueToday ? 'Bugün' :
                             isDueTomorrow ? 'Yarın' :
                             format(new Date(task.due_date), 'dd MMM', { locale: tr })}
                          </div>
                        )}
                      </div>
                      
                      {/* Atanan kişi ve oluşturulma tarihi */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {task.assignee_name || 'Atanmamış'}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(task.created_at), 'dd MMM', { locale: tr })}
                        </div>
                      </div>
                      
                      {/* Etiketler veya ek bilgiler */}
                      <div className="flex flex-wrap gap-1">
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{task.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          </div>
        </div>
      )})}
      </div>
    </div>
  )
}
