/**
 * orderSourceStore — thin wrapper kept for backwards compatibility.
 * All data now comes from the real API via orderSourcesApi.
 */
import { create } from 'zustand'
import { orderSourcesApi, type OrderSource as ApiOrderSource } from '../api/orderSources'

export type { OrderSource } from '../api/orderSources'

interface OrderSourceState {
  sources: ApiOrderSource[]
  loading: boolean
  fetch: () => Promise<void>
  addSource: (name: string) => Promise<void>
  updateSource: (id: string, name: string) => Promise<void>
  archiveSource: (id: string) => Promise<void>
  restoreSource: (id: string) => Promise<void>
  removeSource: (id: string) => Promise<void>
}

export const useOrderSourceStore = create<OrderSourceState>()((set) => ({
  sources: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const sources = await orderSourcesApi.list(true)
      set({ sources })
    } finally {
      set({ loading: false })
    }
  },

  addSource: async (name) => {
    const created = await orderSourcesApi.create(name)
    set((s) => ({ sources: [...s.sources, created] }))
  },

  updateSource: async (id, name) => {
    const updated = await orderSourcesApi.update(id, { name })
    set((s) => ({ sources: s.sources.map((src) => src.id === id ? updated : src) }))
  },

  archiveSource: async (id) => {
    const updated = await orderSourcesApi.update(id, { archived: true })
    set((s) => ({ sources: s.sources.map((src) => src.id === id ? updated : src) }))
  },

  restoreSource: async (id) => {
    const updated = await orderSourcesApi.update(id, { archived: false })
    set((s) => ({ sources: s.sources.map((src) => src.id === id ? updated : src) }))
  },

  removeSource: async (id) => {
    await orderSourcesApi.delete(id)
    set((s) => ({ sources: s.sources.filter((src) => src.id !== id) }))
  },
}))
