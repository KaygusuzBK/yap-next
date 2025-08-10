"use client";

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { fetchProjectStatuses, createProjectStatus, updateProjectStatus, deleteProjectStatus, type ProjectTaskStatus } from '../api'
import { Trash2, Plus, GripVertical } from 'lucide-react'
import { ChromePicker, type ColorResult } from 'react-color'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type Props = { projectId: string }

export default function ProjectStatusManager({ projectId }: Props) {
  const [rows, setRows] = useState<ProjectTaskStatus[]>([])
  // loading reserved for future async sequences
  const [loading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [activeGroup, setActiveGroup] = useState<ProjectTaskStatus['group']>('todo')
  const [newColor, setNewColor] = useState<string>('#64748b')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [labelDraft, setLabelDraft] = useState<string>('')

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const list = await fetchProjectStatuses(projectId)
        if (mounted) setRows(list)
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [projectId])

  const grouped = useMemo(() => {
    const groups: Record<ProjectTaskStatus['group'], ProjectTaskStatus[]> = {
      todo: [], in_progress: [], review: [], completed: []
    }
    for (const r of rows) groups[r.group].push(r)
    for (const g of Object.keys(groups) as Array<ProjectTaskStatus['group']>) {
      groups[g].sort((a,b) => a.position - b.position)
    }
    return groups
  }, [rows])

  async function onCreate() {
    if (!newLabel.trim()) return
    setCreating(true)
    try {
      // generate a safe key from label
      const genKey = newLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || 'status'
      const suffix = Date.now().toString(36)
      const key = grouped[activeGroup].some(s => s.key === genKey) ? `${genKey}_${suffix}` : genKey
      const created = await createProjectStatus({ project_id: projectId, key, label: newLabel.trim(), group: activeGroup, position: (grouped[activeGroup].at(-1)?.position ?? -1) + 1, color: newColor })
      setRows(prev => [...prev, created])
      setNewLabel('')
      setNewColor('#64748b')
    } finally {
      setCreating(false)
    }
  }

  async function onDelete(id: string) {
    await deleteProjectStatus(id)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  // default selection removed from UI

  function onDragEnd(event: DragEndEvent, group: ProjectTaskStatus['group']) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const list = grouped[group]
    const activeId = String(active.id)
    const overId = String(over.id)
    const oldIndex = list.findIndex(i => i.id === activeId)
    const newIndex = list.findIndex(i => i.id === overId)
    const reordered = arrayMove(list, oldIndex, newIndex)
    // update positions locally
    const idToPos = new Map<string, number>()
    reordered.forEach((r, i) => idToPos.set(r.id, i))
    setRows(prev => prev.map(r => r.group === group ? { ...r, position: idToPos.get(r.id) ?? r.position } : r))
    // persist best-effort (no batch api; sequential)
    reordered.forEach((r, i) => { updateProjectStatus({ id: r.id, position: i }).catch(() => {}) })
  }

  const GROUP_LABELS: Record<ProjectTaskStatus['group'], string> = {
    todo: 'Yapılacak',
    in_progress: 'Devam Ediyor',
    review: 'İncelemede',
    completed: 'Tamamlandı',
  }

  const activeList = grouped[activeGroup]

  return (
    <div className="space-y-4">
      {/* Group selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(GROUP_LABELS) as Array<ProjectTaskStatus['group']>).map((g) => (
          <Button
            key={g}
            type="button"
            variant={g === activeGroup ? 'default' : 'outline'}
            className="h-8 rounded-full"
            onClick={() => setActiveGroup(g)}
          >
            {GROUP_LABELS[g]}
          </Button>
        ))}
      </div>

      {/* Sortable list for active group */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onDragEnd(e, activeGroup)}>
        <SortableContext items={activeList.map(r => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
            {activeList.map((row) => (
              <div key={row.id} id={row.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 bg-card/50">
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                  <div className="min-w-0">
                    {editingId === row.id ? (
                      <Input
                        autoFocus
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        onBlur={async () => {
                          const v = labelDraft.trim()
                          setEditingId(null)
                          if (v && v !== row.label) {
                            const u = await updateProjectStatus({ id: row.id, label: v })
                            setRows(prev => prev.map(r => r.id === u.id ? u : r))
                          }
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur()
                          } else if (e.key === 'Escape') {
                            setEditingId(null)
                          }
                        }}
                        className="h-8"
                      />
                    ) : (
                      <div className="text-sm font-medium truncate cursor-text" onClick={() => { setEditingId(row.id); setLabelDraft(row.label) }}>{row.label}</div>
                    )}
                    <div className="text-[10px] text-muted-foreground">{row.key}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 rounded-md border" style={{ backgroundColor: row.color || '#64748b' }} aria-label="Renk seç">
                        <span className="sr-only">Renk seç</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-2">
                      <ChromePicker
                        color={row.color || '#64748b'}
                        onChangeComplete={(c: ColorResult) => {
                          const hex = c.hex
                          updateProjectStatus({ id: row.id, color: hex }).then((u) => setRows(prev => prev.map(r => r.id === u.id ? u : r)))
                        }}
                        disableAlpha
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="icon" variant="ghost" onClick={() => onDelete(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Create new for active group */}
      <div className="rounded-xl border p-3">
        <div className="mb-2 text-sm font-medium">Yeni Durum Ekle ({GROUP_LABELS[activeGroup]})</div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="space-y-1 md:col-span-4">
            <Label>Etiket</Label>
            <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Örn: Hazırda bekliyor" />
          </div>
          <div className="space-y-1 md:col-span-1">
            <Label>Renk</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-full rounded-md border" style={{ backgroundColor: newColor }} aria-label="Renk seç">
                  <span className="sr-only">Renk seç</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-2">
                <ChromePicker color={newColor} onChangeComplete={(c: ColorResult) => setNewColor(c.hex)} disableAlpha />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button onClick={onCreate} disabled={creating || !newLabel.trim()} className="rounded-full w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Ekle
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


