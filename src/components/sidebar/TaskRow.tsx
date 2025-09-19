"use client"

import React from "react"
import type { TaskStat } from "./types"

interface TaskRowProps {
  task: TaskStat
  onSelect: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStat['status']) => void
  isCurrent?: boolean
}

export const TaskRow = React.memo(function TaskRow({
  task,
  onSelect,
  onStatusChange,
  isCurrent,
}: TaskRowProps) {
  const [dragX, setDragX] = React.useState(0)
  const startXRef = React.useRef<number | null>(null)

  const getPriorityColor = (priority: TaskStat['priority']) => {
    switch (priority) {
      case 'low': {
        return 'text-green-600'
      }
      case 'medium': {
        return 'text-blue-600'
      }
      case 'high': {
        return 'text-orange-600'
      }
      case 'urgent': {
        return 'text-red-600'
      }
      default: {
        return 'text-gray-600'
      }
    }
  }

  const getPriorityText = (priority: TaskStat['priority']) => {
    switch (priority) {
      case 'low': {
        return 'Düşük'
      }
      case 'medium': {
        return 'Orta'
      }
      case 'high': {
        return 'Yüksek'
      }
      case 'urgent': {
        return 'Acil'
      }
      default: {
        return priority
      }
    }
  }

  const getDaysRemainingText = (days: number | null) => {
    if (days === null) {
      return 'Tarih yok'
    }
    if (days < 0) {
      return `${Math.abs(days)} gün gecikmiş`
    }
    if (days === 0) {
      return 'Bugün'
    }
    if (days === 1) {
      return '1 gün kaldı'
    }
    return `${days} gün kaldı`
  }

  const getDaysRemainingColor = (days: number | null) => {
    if (days === null) {
      return 'text-gray-500'
    }
    if (days < 0) {
      return 'text-red-600'
    }
    if (days <= 1) {
      return 'text-orange-600'
    }
    if (days <= 3) {
      return 'text-yellow-600'
    }
    return 'text-green-600'
  }

  const statusColor = React.useMemo(() => {
    switch (task.status) {
      case 'in_progress': {
        return 'bg-blue-500'
      }
      case 'completed': {
        return 'bg-green-500'
      }
      case 'review': {
        return 'bg-yellow-500'
      }
      default: {
        return 'bg-transparent'
      }
    }
  }, [task.status])

  // Swipe-to-update helpers
  const firedRef = React.useRef(false)
  const SWIPE_THRESHOLD = 6

  const onMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX
    firedRef.current = false
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  const onMouseMove = (e: MouseEvent) => {
    if (startXRef.current == null) return
    const dx = e.clientX - startXRef.current
    const clamped = Math.max(-140, Math.min(140, dx))
    setDragX(clamped)

    if (!firedRef.current) {
      if (clamped < -SWIPE_THRESHOLD) {
        const nextStatus = getNextStatus(task.status)
        if (nextStatus) {
          firedRef.current = true
          onStatusChange(task.id, nextStatus)
          setDragX(0)
        }
      } else if (clamped > SWIPE_THRESHOLD) {
        const prevStatus = getPrevStatus(task.status)
        if (prevStatus) {
          firedRef.current = true
          onStatusChange(task.id, prevStatus)
          setDragX(0)
        }
      }
    }
  }
  const onMouseUp = () => {
    if (startXRef.current != null) {
      const dx = dragX
      const nextStatus = getNextStatus(task.status)
      const prevStatus = getPrevStatus(task.status)
      const threshold = SWIPE_THRESHOLD
      if (!firedRef.current) {
        if (dx < -threshold && nextStatus) onStatusChange(task.id, nextStatus)
        else if (dx > threshold && prevStatus) onStatusChange(task.id, prevStatus)
      }
    }
    startXRef.current = null
    setDragX(0)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
    firedRef.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current == null) return
    const dx = e.touches[0].clientX - startXRef.current
    const clamped = Math.max(-140, Math.min(140, dx))
    setDragX(clamped)

    if (!firedRef.current) {
      if (clamped < -SWIPE_THRESHOLD) {
        const nextStatus = getNextStatus(task.status)
        if (nextStatus) {
          firedRef.current = true
          onStatusChange(task.id, nextStatus)
          setDragX(0)
        }
      } else if (clamped > SWIPE_THRESHOLD) {
        const prevStatus = getPrevStatus(task.status)
        if (prevStatus) {
          firedRef.current = true
          onStatusChange(task.id, prevStatus)
          setDragX(0)
        }
      }
    }
  }
  const onTouchEnd = () => {
    if (startXRef.current != null) {
      const dx = dragX
      const nextStatus = getNextStatus(task.status)
      const prevStatus = getPrevStatus(task.status)
      const threshold = SWIPE_THRESHOLD
      if (!firedRef.current) {
        if (dx < -threshold && nextStatus) onStatusChange(task.id, nextStatus)
        else if (dx > threshold && prevStatus) onStatusChange(task.id, prevStatus)
      }
    }
    startXRef.current = null
    setDragX(0)
  }

  function getNextStatus(status: TaskStat['status']): TaskStat['status'] | null {
    if (status === 'todo') return 'in_progress'
    if (status === 'in_progress') return 'review'
    if (status === 'review') return 'completed'
    return null
  }
  function getPrevStatus(status: TaskStat['status']): TaskStat['status'] | null {
    if (status === 'completed') return 'review'
    if (status === 'review') return 'in_progress'
    if (status === 'in_progress') return 'todo'
    return null
  }

  return (
    <div
      className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors border-b p-4 text-sm last:border-b-0 flex items-start justify-between gap-2 rounded-sm ${
        task.status === 'completed' ? 'opacity-60 bg-muted/20' : ''
      }`}
      onClick={() => onSelect(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(task.id)
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(task.id)}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative text-left flex-1 transform transition-transform pl-3`}
        style={{ transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined }}
      >
        {/* Status indicator - fill full height on the left */}
        <span className={`absolute left-0 inset-y-0 w-1.5 rounded-none ${statusColor}`} />

        {/* Swipe overlay (left=next, right=prev) */}
        {dragX !== 0 && (
          <div
            className={`absolute inset-0 z-0 ${(() => {
              const target = dragX < 0 ? getNextStatus(task.status) : getPrevStatus(task.status)
              if (target === 'in_progress') return 'bg-blue-100 dark:bg-blue-900/30'
              if (target === 'review') return 'bg-yellow-100 dark:bg-yellow-900/30'
              if (target === 'completed') return 'bg-green-100 dark:bg-green-900/30'
              if (target === 'todo') return 'bg-zinc-100 dark:bg-zinc-800/40'
              return 'bg-transparent'
            })()}`}
            style={{ opacity: Math.min(Math.abs(dragX) / 120, 0.85) }}
          />
        )}

        {/* Content */}
        <div className={`relative z-10 ${Math.abs(dragX) > 20 ? 'opacity-60' : ''} flex flex-col items-start text-left`}>
          <div className={`font-medium line-clamp-1 ${
            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
          }`}>
            {task.title}
            {isCurrent && (
              <span className="ml-2 inline-block h-2 w-2 align-middle rounded-full bg-primary" title="Şu an açık" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-xs ${
              task.status === 'completed' ? 'text-muted-foreground/70' : 'text-muted-foreground'
            }`}>
              Proje: {task.project_title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-current ${getPriorityColor(task.priority)} ${
              task.status === 'completed' ? 'opacity-70' : ''
            }`}>
              {getPriorityText(task.priority)}
            </span>
            {/* Status chip next to priority */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              task.status === 'in_progress' ? 'text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800' :
              task.status === 'completed' ? 'text-green-700 border-green-200 dark:text-green-300 dark:border-green-800' :
              task.status === 'review' ? 'text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800' :
              'text-muted-foreground border-border'
            } ${task.status === 'completed' ? 'opacity-70' : ''}`}>
              {task.status === 'in_progress' ? 'Devam ediyor' : task.status === 'completed' ? 'Tamamlandı' : task.status === 'review' ? 'İncelemede' : 'Yapılacak'}
            </span>
            <span className={`text-xs ${getDaysRemainingColor(task.days_remaining)} ${
              task.status === 'completed' ? 'opacity-70' : ''
            }`}>
              {getDaysRemainingText(task.days_remaining)}
            </span>
          </div>
        </div>
        {/* Labels on top */}
        {dragX < -4 && getNextStatus(task.status) && (
          <span className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 text-xs font-semibold drop-shadow-sm ${
            getNextStatus(task.status) === 'in_progress' ? 'text-blue-700' :
            getNextStatus(task.status) === 'review' ? 'text-yellow-700' :
            'text-green-700'
          }`}>
            {getNextStatus(task.status) === 'in_progress' ? 'Devam ediyor' : getNextStatus(task.status) === 'review' ? 'İncelemede' : 'Tamamlandı'}
          </span>
        )}
        {dragX > 4 && getPrevStatus(task.status) && (
          <span className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 text-xs font-semibold drop-shadow-sm ${
            getPrevStatus(task.status) === 'in_progress' ? 'text-blue-700' :
            getPrevStatus(task.status) === 'review' ? 'text-yellow-700' :
            getPrevStatus(task.status) === 'todo' ? 'text-zinc-700 dark:text-zinc-300' : ''
          }`}>
            {getPrevStatus(task.status) === 'in_progress' ? 'Devam ediyor' : getPrevStatus(task.status) === 'review' ? 'İncelemede' : 'Yapılacak'}
          </span>
        )}
      </button>
    </div>
  )
})
