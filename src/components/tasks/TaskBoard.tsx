"use client"

import { useState, useMemo } from "react"
import { type Task } from "@/features/tasks/api"
import { type ProjectTaskStatus } from "@/features/tasks/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Flag, MoreHorizontal, Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { format, isAfter, isBefore, isToday, isTomorrow } from "date-fns"
import { tr } from "date-fns/locale"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TaskBoardProps {
  tasks: Task[]
  statusesByProject: Record<string, ProjectTaskStatus[]>
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  getGroupForTask: (task: Task) => "todo" | "in_progress" | "review" | "completed"
  projects?: Array<{ id: string; title: string }>
}

export default function TaskBoard({ 
  tasks, 
  statusesByProject, 
  onTaskUpdate, 
  getGroupForTask,
  projects = []
}: TaskBoardProps) {
  // Filtre ve sıralama state'leri
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [dueDateFilter, setDueDateFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("priority")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [groupBy, setGroupBy] = useState<string>("status")
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

  const getStatusColor = (status: "todo" | "in_progress" | "review" | "completed") => {
    const colors = {
      todo: "bg-gray-100 dark:bg-gray-800",
      in_progress: "bg-blue-100 dark:bg-blue-900/30",
      review: "bg-yellow-100 dark:bg-yellow-900/30",
      completed: "bg-green-100 dark:bg-green-900/30"
    }
    return colors[status]
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

  // Filtrelenmiş ve sıralanmış görevler
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
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

    // Sıralama
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4
          break
        case "dueDate":
          aValue = a.due_date ? new Date(a.due_date).getTime() : Infinity
          bValue = b.due_date ? new Date(b.due_date).getTime() : Infinity
          break
        case "createdAt":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "assignee":
          aValue = a.assignee_name || ""
          bValue = b.assignee_name || ""
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [tasks, searchTerm, priorityFilter, projectFilter, assigneeFilter, dueDateFilter, sortBy, sortOrder])

  const tasksByStatus = useMemo(() => {
    const groups = {
      todo: [] as Task[],
      in_progress: [] as Task[],
      review: [] as Task[],
      completed: [] as Task[],
    }
    
    filteredAndSortedTasks.forEach(task => {
      const group = getGroupForTask(task)
      groups[group].push(task)
    })
    
    return groups
  }, [filteredAndSortedTasks, getGroupForTask])

  // Benzersiz atanan kişileri al
  const assignees = useMemo(() => {
    const uniqueAssignees = Array.from(new Set(tasks.map(t => t.assignee_name).filter(Boolean)))
    return uniqueAssignees.sort()
  }, [tasks])

  const handleStatusChange = (taskId: string, newStatus: "todo" | "in_progress" | "review" | "completed") => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Find the default status key for this group
    const statuses = statusesByProject[task.project_id]
    if (statuses && statuses.length > 0) {
      const byGroup = statuses.filter(s => s.group === newStatus)
      const firstByOrder = byGroup.sort((a,b) => a.position - b.position)[0]
      if (firstByOrder) {
        onTaskUpdate(taskId, { status: firstByOrder.key })
        return
      }
    }
    
    // Fallback to base key
    onTaskUpdate(taskId, { status: newStatus })
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
    <div className="space-y-6">
      {/* Filtre ve Sıralama Bölümü */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
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
          
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Öncelik</SelectItem>
                <SelectItem value="dueDate">Bitiş Tarihi</SelectItem>
                <SelectItem value="createdAt">Oluşturulma</SelectItem>
                <SelectItem value="title">Başlık</SelectItem>
                <SelectItem value="assignee">Atanan</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
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
      {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
        <div key={status} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status as any)}`} />
              {getStatusTitle(status as any)}
              <Badge variant="secondary" className="ml-2">
                {statusTasks.length}
              </Badge>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statusTasks.map(task => (
              <Card key={task.id} className="hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                      {task.title}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status !== 'todo' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'todo')}>
                            Yapılacaklara Taşı
                          </DropdownMenuItem>
                        )}
                        {status !== 'in_progress' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                            Devam Eden'e Taşı
                          </DropdownMenuItem>
                        )}
                        {status !== 'review' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'review')}>
                            İnceleme'ye Taşı
                          </DropdownMenuItem>
                        )}
                        {status !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                            Tamamlandı Olarak İşaretle
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {task.priority && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs w-fit ${priorityTheme[task.priority].chip}`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-1 ${priorityTheme[task.priority].dot}`} />
                          {task.priority === 'urgent' ? 'Acil' : 
                           task.priority === 'high' ? 'Yüksek' :
                           task.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </Badge>
                      )}
                      
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
                      
                      {task.due_date && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          Bitiş: {format(new Date(task.due_date), 'dd MMM yyyy', { locale: tr })}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Proje: {task.project_title}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {statusTasks.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Bu durumda görev yok
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
