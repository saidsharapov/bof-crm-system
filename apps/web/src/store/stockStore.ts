import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  /** Source of truth: balance per productId */
  getStock: (productId: string) => number
  /** All movements for a product, newest first */
  getHistory: (productId: string) => Movement[]
  addMovement: (
    productId: string,
    type: MovementType,
    qty: number,
    comment: string,
    actor: string,
  ) => void
}

function uid() {
  return `mv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

const now = (offsetDays = 0) =>
  new Date(Date.now() - offsetDays * 86400000).toISOString()

const INITIAL: Movement[] = [
  // p_init_1 — Футболка M Белый
  { id: 'mv_i01', productId: 'p_init_1', type: 'IN',  qty: 100, comment: 'Начальный приход',          actor: 'И.Беляев',   createdAt: now(6) },
  { id: 'mv_i02', productId: 'p_init_1', type: 'OUT', qty: 15,  comment: 'Отгрузка заказ #0040',      actor: 'Д.Соколова', createdAt: now(4) },
  { id: 'mv_i03', productId: 'p_init_1', type: 'OUT', qty: 5,   comment: 'Отгрузка заказ #0043',      actor: 'Д.Соколова', createdAt: now(1) },
  // p_init_2 — Футболка L Чёрный
  { id: 'mv_i04', productId: 'p_init_2', type: 'IN',  qty: 80,  comment: 'Начальный приход',          actor: 'И.Беляев',   createdAt: now(6) },
  { id: 'mv_i05', productId: 'p_init_2', type: 'OUT', qty: 30,  comment: 'Отгрузка заказ #0041',      actor: 'Д.Соколова', createdAt: now(3) },
  { id: 'mv_i06', productId: 'p_init_2', type: 'IN',  qty: 50,  comment: 'Доп. приход от цеха',       actor: 'Цех',        createdAt: now(2) },
  // p_init_3 — Худи XL Серый
  { id: 'mv_i07', productId: 'p_init_3', type: 'IN',  qty: 40,  comment: 'Начальный приход',          actor: 'И.Беляев',   createdAt: now(5) },
  { id: 'mv_i08', productId: 'p_init_3', type: 'OUT', qty: 12,  comment: 'Отгрузка заказ #0042',      actor: 'Д.Соколова', createdAt: now(2) },
  // p_init_4 — Поло M Тёмно-синий
  { id: 'mv_i09', productId: 'p_init_4', type: 'IN',  qty: 60,  comment: 'Начальный приход',          actor: 'И.Беляев',   createdAt: now(3) },
  { id: 'mv_i10', productId: 'p_init_4', type: 'OUT', qty: 60,  comment: 'Отгрузка заказ #0044 (весь)', actor: 'Д.Соколова', createdAt: now(1) },
  // p_init_5 — Футболка S Красный
  { id: 'mv_i11', productId: 'p_init_5', type: 'IN',  qty: 20,  comment: 'Начальный приход',          actor: 'Цех',        createdAt: now(2) },
  // p_init_6 — Худи M Чёрный
  { id: 'mv_i12', productId: 'p_init_6', type: 'IN',  qty: 35,  comment: 'Начальный приход',          actor: 'И.Беляев',   createdAt: now(1) },
  { id: 'mv_i13', productId: 'p_init_6', type: 'OUT', qty: 5,   comment: 'Отгрузка заказ #0046',      actor: 'Д.Соколова', createdAt: now(0) },
]

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      movements: INITIAL,

      getStock: (productId) =>
        get().movements
          .filter((m) => m.productId === productId)
          .reduce((sum, m) => sum + (m.type === 'IN' ? m.qty : -m.qty), 0),

      getHistory: (productId) =>
        [...get().movements]
          .filter((m) => m.productId === productId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      addMovement: (productId, type, qty, comment, actor) => {
        const mv: Movement = {
          id: uid(),
          productId,
          type,
          qty,
          comment,
          actor,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ movements: [mv, ...s.movements] }))
      },
    }),
    { name: 'bof-stock' },
  ),
)
