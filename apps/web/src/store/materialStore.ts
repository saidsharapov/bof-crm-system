/**
 * materialStore — thin wrapper kept for backwards compatibility.
 * All data now comes from the real API via materialsApi.
 */
import { create } from 'zustand'
import { materialsApi, type MaterialMovement as ApiMovement } from '../api/materials'

export type MaterialUnit = string

export interface Material {
  id: string
  name: string
  unit: MaterialUnit
  description: string
  createdAt: string
}

export interface MaterialMovement {
  id: string
  materialId: string
  type: 'IN' | 'OUT'
  qty: number
  comment: string
  actor: string
  createdAt: string
}

interface MaterialState {
  materials: Material[]
  movements: MaterialMovement[]
  stockMap: Record<string, number>
  loading: boolean
  fetch: () => Promise<void>
  getStock: (materialId: string) => number
  getHistory: (materialId: string) => MaterialMovement[]
  addMaterial: (m: Omit<Material, 'id' | 'createdAt'>) => Promise<Material>
  updateMaterial: (id: string, patch: Partial<Omit<Material, 'id' | 'createdAt'>>) => Promise<void>
  removeMaterial: (id: string) => Promise<void>
  addMovement: (
    materialId: string,
    type: 'IN' | 'OUT',
    qty: number,
    comment: string,
    actor: string,
  ) => Promise<void>
}

function mapMov(m: ApiMovement): MaterialMovement {
  return {
    id: m.id,
    materialId: m.materialId,
    type: m.type,
    qty: m.qty,
    comment: m.comment ?? '',
    actor: m.actor ?? '',
    createdAt: m.createdAt,
  }
}

export const useMaterialStore = create<MaterialState>()((set, get) => ({
  materials: [],
  movements: [],
  stockMap: {},
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const res = await materialsApi.list({ limit: 500 })
      const materials = res.items
      // fetch stock for each material
      const stockEntries = await Promise.all(
        materials.map(async (m) => {
          const qty = await materialsApi.getStock(m.id).catch(() => 0)
          return [m.id, qty] as [string, number]
        })
      )
      const stockMap: Record<string, number> = Object.fromEntries(stockEntries)
      set({ materials, stockMap })
    } finally {
      set({ loading: false })
    }
  },

  getStock: (materialId) => get().stockMap[materialId] ?? 0,

  getHistory: (materialId) =>
    get().movements
      .filter((m) => m.materialId === materialId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  addMaterial: async (m) => {
    const created = await materialsApi.create({ name: m.name, unit: m.unit, description: m.description })
    set((s) => ({ materials: [created, ...s.materials] }))
    return created
  },

  updateMaterial: async (id, patch) => {
    const updated = await materialsApi.update(id, patch)
    set((s) => ({ materials: s.materials.map((m) => (m.id === id ? updated : m)) }))
  },

  removeMaterial: async (id) => {
    await materialsApi.delete(id)
    set((s) => ({ materials: s.materials.filter((m) => m.id !== id) }))
  },

  addMovement: async (materialId, type, qty, comment, _actor) => {
    const created = await materialsApi.addMovement(materialId, { type, qty, comment })
    const mv = mapMov(created)
    set((s) => ({
      movements: [mv, ...s.movements],
      stockMap: {
        ...s.stockMap,
        [materialId]: (s.stockMap[materialId] ?? 0) + (type === 'IN' ? qty : -qty),
      },
    }))
  },
}))
