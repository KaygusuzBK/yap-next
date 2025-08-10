"use client"

import { create } from 'zustand'
import { acceptTeamInvitation, declineTeamInvitation, getPendingInvitations } from '@/features/teams/api'

export type PendingInvitation = {
  id: string
  token: string
  email: string
  role: string
  created_at: string
  expires_at: string
  teams?: { id: string; name?: string; owner_id?: string }
}

type InvitesState = {
  invitations: PendingInvitation[]
  loading: boolean
  error: string | null
  fetchInvites: () => Promise<void>
  accept: (token: string) => Promise<void>
  decline: (token: string) => Promise<void>
  removeByToken: (token: string) => void
}

export const useInvitesStore = create<InvitesState>((set, get) => ({
  invitations: [],
  loading: false,
  error: null,
  fetchInvites: async () => {
    try {
      set({ loading: true, error: null })
      const list = await getPendingInvitations()
      set({ invitations: list as PendingInvitation[] })
    } catch (e) {
      set({ invitations: [], error: e instanceof Error ? e.message : 'Bekleyen davetler alınamadı' })
    } finally {
      set({ loading: false })
    }
  },
  accept: async (token: string) => {
    await acceptTeamInvitation(token)
    get().removeByToken(token)
  },
  decline: async (token: string) => {
    await declineTeamInvitation(token)
    get().removeByToken(token)
  },
  removeByToken: (token: string) => {
    set((state) => ({ invitations: state.invitations.filter((i) => i.token !== token) }))
  },
}))


