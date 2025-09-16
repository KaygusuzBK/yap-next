"use client"

import * as React from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TaskFilters } from "../types"

type TaskFiltersProps = {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  onMyTasksOpen: () => void
}

export function TaskFiltersComponent({ filters, onFiltersChange, onMyTasksOpen }: TaskFiltersProps) {
  const activeCount = [
    filters.statusFilter !== 'all',
    filters.dueFilter !== 'all',
    filters.priorityFilter !== 'all',
    filters.sortBy !== 'smart',
  ].filter(Boolean).length

  return (
    <div className="mb-2 flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8" data-tour="filter">
            <Filter className="h-4 w-4 mr-2" />
            Filtre
            {activeCount > 0 && (
              <span className="ml-2 rounded bg-primary/10 px-1.5 text-xs">
                {activeCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Durum</div>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, statusFilter: 'all' })} inset>
            Tüm Durumlar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, statusFilter: 'open' })} inset>
            Açık
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, statusFilter: 'completed' })} inset>
            Biten
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Tarih</div>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, dueFilter: 'all' })} inset>
            Tümü
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, dueFilter: 'overdue' })} inset>
            Gecikmiş
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, dueFilter: 'today' })} inset>
            Bugün
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, dueFilter: 'week' })} inset>
            7 Gün
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Öncelik</div>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, priorityFilter: 'all' })} inset>
            Tümü
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, priorityFilter: 'urgent' })} inset>
            Acil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, priorityFilter: 'high' })} inset>
            Yüksek
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, priorityFilter: 'medium' })} inset>
            Orta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, priorityFilter: 'low' })} inset>
            Düşük
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Sırala</div>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, sortBy: 'smart' })} inset>
            Öncelik+Durum
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, sortBy: 'due' })} inset>
            Bitiş Tarihi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFiltersChange({ ...filters, sortBy: 'priority' })} inset>
            Öncelik
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="outline" className="h-8" onClick={onMyTasksOpen}>
        Görevlerim
      </Button>
    </div>
  )
}
