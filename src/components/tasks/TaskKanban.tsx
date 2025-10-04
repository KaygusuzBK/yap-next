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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
// virtualization removed - using simple map for better performance

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

  const getStatusColor = () => "bg-muted/40"

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
            <PopoverContent className="w-60 p-2" align="start">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium">Filtreler</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-1 text-xs">
                    <X className="h-3 w-3 mr-1" /> Temizle
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <span className="text-[10px] text-muted-foreground">Proje</span>
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Tümü" className="text-xs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Öncelik</span>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Tümü" className="text-xs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="urgent">Acil</SelectItem>
                      <SelectItem value="high">Yüksek</SelectItem>
                      <SelectItem value="medium">Orta</SelectItem>
                      <SelectItem value="low">Düşük</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Atanan</span>
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Tümü" className="text-xs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {assignees.map(a => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-muted-foreground">Tarih</span>
                  <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Tümü" className="text-xs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="overdue">Geciken</SelectItem>
                      <SelectItem value="today">Bugün</SelectItem>
                      <SelectItem value="tomorrow">Yarın</SelectItem>
                      <SelectItem value="thisWeek">Bu Hafta</SelectItem>
                      <SelectItem value="noDate">Tarih Yok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
              Filtreleri Temizle
            </Button>
          )}
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
        return (
        <div
          key={status}
          className={`rounded-md border p-2 min-h-[250px] transition-colors bg-muted/40 ${
            dragOverStatus === status ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          onDragOver={(e) => handleDragOver(e, status as any)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status as any)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">{getStatusTitle(status as any)}</h3>
            <Badge variant="secondary" className="text-xs h-5 px-2 rounded-full">
              {statusTasks.length}
            </Badge>
          </div>
          
          <div className="space-y-0.5">
            {statusTasks.map((task, index) => {
                const isOverdue = task.due_date && isBefore(new Date(task.due_date), new Date())
                const isDueToday = task.due_date && isToday(new Date(task.due_date))
                const isDueTomorrow = task.due_date && isTomorrow(new Date(task.due_date))
                return (
                  <Card
                    key={task.id}
                    className={`cursor-move hover:shadow-sm transition-all ${
                      dragTaskId === task.id ? 'opacity-50' : ''
                    } ${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                  >
                  <CardContent className="p-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <CardTitle className="text-sm font-medium leading-tight line-clamp-1 flex-1">
                          {task.title}
                        </CardTitle>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs h-3 px-1 shrink-0">
                            !
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                        {/* Proje adı */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground truncate flex-1 cursor-help">
                              {task.project_title}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Proje: {task.project_title}</TooltipContent>
                        </Tooltip>
                        
                        {/* Öncelik */}
                        {task.priority && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className={`text-xs h-3 px-1 ${priorityTheme[task.priority].chip} cursor-help`}
                              >
                                <div className={`w-1 h-1 rounded-full mr-0.5 ${priorityTheme[task.priority].dot}`} />
                                {task.priority === 'urgent' ? 'A' : 
                                 task.priority === 'high' ? 'Y' :
                                 task.priority === 'medium' ? 'O' : 'D'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Öncelik: {task.priority === 'urgent' ? 'Acil' : 
                                       task.priority === 'high' ? 'Yüksek' :
                                       task.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {/* Tarih */}
                        {task.due_date && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`flex items-center text-xs cursor-help ${
                                isOverdue ? 'text-red-600 font-medium' :
                                isDueToday ? 'text-orange-600 font-medium' :
                                isDueTomorrow ? 'text-yellow-600 font-medium' :
                                'text-muted-foreground'
                              }`}>
                                <Calendar className="w-2 h-2 mr-0.5" />
                                {isDueToday ? 'Bugün' :
                                 isDueTomorrow ? 'Yarın' :
                                 format(new Date(task.due_date), 'dd/MM', { locale: tr })}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              Bitiş Tarihi: {format(new Date(task.due_date), 'dd MMMM yyyy', { locale: tr })}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {/* Atanan kişi */}
                        {task.assignee_name && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center text-xs text-muted-foreground cursor-help">
                                <User className="w-2 h-2 mr-0.5" />
                                <span className="truncate max-w-16">{task.assignee_name.split(' ')[0]}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Atanan: {task.assignee_name}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )})}
      </div>
    </div>
  )
}
