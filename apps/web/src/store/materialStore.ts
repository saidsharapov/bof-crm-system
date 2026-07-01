import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MaterialUnit = 'кг' | 'м' | 'шт' | 'рулон' | 'катушка'

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
  getStock: (materialId: string) => number
  getHistory: (materialId: string) => MaterialMovement[]
  addMaterial: (m: Omit<Material, 'id' | 'createdAt'>) => Material
  updateMaterial: (id: string, patch: Partial<Omit<Material, 'id' | 'createdAt'>>) => void
  removeMaterial: (id: string) => void
  addMovement: (
    materialId: string,
    type: 'IN' | 'OUT',
    qty: number,
    comment: string,
    actor: string,
  ) => void
}

function uid() { return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
const now = (d = 0) => new Date(Date.now() - d * 86400000).toISOString()

const INIT_MATERIALS: Material[] = [
  { id: 'mat_1', name: 'Ткань хлопок',    unit: 'кг',  description: 'Хлопок 180 г/м²',        createdAt: now(10) },
  { id: 'mat_2', name: 'Ткань лён',       unit: 'кг',  description: 'Лён летний',              createdAt: now(10) },
  { id: 'mat_3', name: 'Нитки белые',     unit: 'катушка', description: '5000 м, №40',        createdAt: now(9)  },
  { id: 'mat_4', name: 'Нитки чёрные',    unit: 'катушка', description: '5000 м, №40',        createdAt: now(9)  },
  { id: 'mat_5', name: 'Пуговицы',        unit: 'шт',  description: 'Д=12 мм, пластик',       createdAt: now(8)  },
  { id: 'mat_6', name: 'Молнии металл',   unit: 'шт',  description: '30 см, золото',           createdAt: now(7)  },
  { id: 'mat_7', name: 'Резинка широкая', unit: 'м',   description: '3 см ширина',             createdAt: now(7)  },
]

const INIT_MOVEMENTS: MaterialMovement[] = [
  { id: 'mm_01', materialId: 'mat_1', type: 'IN',  qty: 200, comment: 'Начальный склад',           actor: 'И.Беляев', createdAt: now(10) },
  { id: 'mm_02', materialId: 'mat_1', type: 'OUT', qty: 50,  comment: 'Производство партия #001',   actor: 'Цех',      createdAt: now(6)  },
  { id: 'mm_03', materialId: 'mat_1', type: 'IN',  qty: 50,  comment: 'Приход от поставщика',       actor: 'И.Беляев', createdAt: now(2)  },
  { id: 'mm_04', materialId: 'mat_2', type: 'IN',  qty: 80,  comment: 'Начальный склад',            actor: 'И.Беляев', createdAt: now(10) },
  { id: 'mm_05', materialId: 'mat_2', type: 'OUT', qty: 30,  comment: 'Производство партия #002',   actor: 'Цех',      createdAt: now(5)  },
  { id: 'mm_06', materialId: 'mat_3', type: 'IN',  qty: 20,  comment: 'Начальный склад',            actor: 'И.Беляев', createdAt: now(9)  },
  { id: 'mm_07', materialId: 'mat_3', type: 'OUT', qty: 3,   comment: 'Производство партия #001',   actor: 'Цех',      createdAt: now(6)  },
  { id: 'mm_08', materialId: 'mat_4', type: 'IN',  qty: 15,  comment: 'Начальный склад',            actor: 'И.Беляев', createdAt: now(9)  },
  { id: 'mm_09', materialId: 'mat_4', type: 'OUT', qty: 5,   comment: 'Производство партия #002',   actor: 'Цех',      createdAt: now(5)  },
  { id: 'mm_10', materialId: 'mat_5', type: 'IN',  qty: 500, comment: 'Начальный склад',            actor: 'И.Беляев', createdAt: now(8)  },
  { id: 'mm_11', materialId: 'mat_5', type: 'OUT', qty: 120, comment: 'Производство партия #001',   actor: 'Цех',      createdAt: now(6)  },
  { id: 'mm_12', materialId: 'mat_6', type: 'IN',  qty: 100, comment: 'Начальный склад',            actor: 'И.Беляев', createdAt: now(7)  },
  { id: 'mm_13', materialId: 'mat_7', type: 'IN',  qty: 50,  comment: 'Начальный склад',            actor: 'И.Беляев', createdAt: now(7)  },
]

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: INIT_MATERIALS,
      movements: INIT_MOVEMENTS,

      getStock: (id) =>
        get().movements
          .filter((m) => m.materialId === id)
          .reduce((s, m) => s + (m.type === 'IN' ? m.qty : -m.qty), 0),

      getHistory: (id) =>
        [...get().movements]
          .filter((m) => m.materialId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      addMaterial: (m) => {
        const mat: Material = { ...m, id: uid(), createdAt: new Date().toISOString() }
        set((s) => ({ materials: [mat, ...s.materials] }))
        return mat
      },

      updateMaterial: (id, patch) =>
        set((s) => ({ materials: s.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      removeMaterial: (id) =>
        set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),

      addMovement: (materialId, type, qty, comment, actor) => {
        const mv: MaterialMovement = {
          id: uid(), materialId, type, qty, comment, actor,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ movements: [mv, ...s.movements] }))
      },
    }),
    { name: 'bof-materials' },
  ),
)
