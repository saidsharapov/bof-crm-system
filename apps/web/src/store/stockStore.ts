/**
 * stockStore — thin wrapper kept for backwards compatibility.
 * All data now comes from the real API via warehouseApi.
 */
import { create } from 'zustand'
import { warehouseApi, type WarehouseMovement } from '../api/warehouse'

export type MovementType = 'IN' | 'OUT'

export interface Movement {
  id: string
  productId: string
  type: MovementType
  qty: number
  comment: string
  actor: string
  createdAt: string
}

interface StockState {
  movements: Movement[]
  stockMap: Record<string, number>
  loading: boolean
  fetchStock: () => Promise<void>
  fetchMovements: (productId?: string) => Promise<void>
  getStock: (productId: string) => number
  getHistory: (productId: string) => Movement[]
  addMovement: (
    productId: string,
    type: MovementType,
    qty: number,
    comment: string,
    actor: string,
  ) => Promise<void>
}

function mapMovement(m: WarehouseMovement): Movement {
  return {
    id: m.id,
    productId: m.productId,
    type: m.type as MovementType,
    qty: m.qty,
    comment: m.comment ?? '',
    actor: m.actorName ?? m.actor ?? '',
    createdAt: m.createdAt,
  }
}

export const useStockStore = create<StockState>()((set, get) => ({
  movements: [],
  stockMap: {},
  loading: false,

  fetchStock: async () => {
    set({ loading: true })
    try {
      const res = await warehouseApi.getStock({ limit: 500 })
      const stockMap: Record<string, number> = {}
      for (const item of res.items) {
        stockMap[item.id] = item.stock
      }
      set({ stockMap })
    } finally {
      set({ loading: false })
    }
  },

  fetchMovements: async (productId?: string) => {
    const res = await warehouseApi.getMovements({ productId, limit: 500 })
    const movements = res.items.map(mapMovement)
    set({ movements })
  },

  getStock: (productId) => get().stockMap[productId] ?? 0,

  getHistory: (productId) =>
    get().movements
      .filter((m) => m.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  addMovement: async (productId, type, qty, comment, _actor) => {
    const created = await warehouseApi.addMovement({ productId, type, qty, comment })
    const mv = mapMovement(created)
    set((s) => ({
      movements: [mv, ...s.movements],
      stockMap: {
        ...s.stockMap,
        [productId]: (s.stockMap[productId] ?? 0) + (type === 'IN' ? qty : -qty),
      },
    }))
  },
}))
