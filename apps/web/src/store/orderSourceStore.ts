import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OrderSource {
  id: string
  name: string
  archived: boolean
  createdAt: string
}

interface OrderSourceState {
  sources: OrderSource[]
  addSource:     (name: string) => void
  updateSource:  (id: string, name: string) => void
  archiveSource: (id: string) => void
  restoreSource: (id: string) => void
  removeSource:  (id: string) => void
}

function uid() { return `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
const ts = new Date(0).toISOString()

const DEFAULT_SOURCES: OrderSource[] = [
  { id: 'src_bof',   name: 'BOF',          archived: false, createdAt: ts },
  { id: 'src_ftb',   name: 'Futbolka.uz',  archived: false, createdAt: ts },
  { id: 'src_site',  name: 'Сайт',         archived: false, createdAt: ts },
  { id: 'src_ref',   name: 'Рекомендация', archived: false, createdAt: ts },
  { id: 'src_other', name: 'Другое',       archived: false, createdAt: ts },
]

export const useOrderSourceStore = create<OrderSourceState>()(
  persist(
    (set) => ({
      sources: DEFAULT_SOURCES,

      addSource: (name) =>
        set((s) => ({
          sources: [...s.sources, { id: uid(), name: name.trim(), archived: false, createdAt: new Date().toISOString() }],
        })),

      updateSource: (id, name) =>
        set((s) => ({
          sources: s.sources.map((src) => src.id === id ? { ...src, name: name.trim() } : src),
        })),

      archiveSource: (id) =>
        set((s) => ({
          sources: s.sources.map((src) => src.id === id ? { ...src, archived: true } : src),
        })),

      restoreSource: (id) =>
        set((s) => ({
          sources: s.sources.map((src) => src.id === id ? { ...src, archived: false } : src),
        })),

      removeSource: (id) =>
        set((s) => ({ sources: s.sources.filter((src) => src.id !== id) })),
    }),
    { name: 'bof-order-sources' },
  ),
)
