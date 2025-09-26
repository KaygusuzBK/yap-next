"use client"

import { create } from 'zustand'

type ActiveProjectState = {
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void
  load: () => void
}

export const useActiveProjectStore = create<ActiveProjectState>((set) => ({
  activeProjectId: null,
  setActiveProject: (id) => {
    set({ activeProjectId: id })
    try { localStorage.setItem('active_project_id', id ?? '') } catch {}
  },
  load: () => {
    try {
      const v = localStorage.getItem('active_project_id') || ''
      set({ activeProjectId: v || null })
    } catch {}
  }
}))


