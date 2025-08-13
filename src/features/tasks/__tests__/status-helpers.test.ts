import { describe, it, expect, vi } from 'vitest'
import { fetchStatusesForProjects } from '../../tasks/api'

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        in: () => ({
          order: () => ({ data: [], error: null }),
        }),
      }),
    }),
  }),
}))

// This test only checks function shape/early-return, not network
describe('fetchStatusesForProjects', () => {
  it('returns empty map for empty array', async () => {
    const res = await fetchStatusesForProjects([])
    expect(res).toEqual({})
  })
})


