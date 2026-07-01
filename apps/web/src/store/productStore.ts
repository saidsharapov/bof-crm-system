import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Product {
  id: string
  name: string
  article: string
  size: string
  color: string
  colorHex: string
  description: string
  photo: string        // '' | data:image/... | https://...
  createdAt: string
}

interface ProductState {
  products: Product[]
  add: (p: Omit<Product, 'id' | 'createdAt'>) => Product
  update: (id: string, p: Partial<Omit<Product, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

function uid() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

const INITIAL: Product[] = [
  {
    id: 'p_init_1',
    name: 'Футболка базовая',
    article: 'FBZ-M-WHT',
    size: 'M',
    color: 'Белый',
    colorHex: '#FFFFFF',
    description: 'Классическая футболка из 100% хлопка. Плотность 180 г/м².',
    photo: '',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'p_init_2',
    name: 'Футболка базовая',
    article: 'FBZ-L-BLK',
    size: 'L',
    color: 'Чёрный',
    colorHex: '#1a1a1a',
    description: 'Классическая футболка из 100% хлопка. Плотность 180 г/м².',
    photo: '',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'p_init_3',
    name: 'Худи оверсайз',
    article: 'HOV-XL-GRY',
    size: 'XL',
    color: 'Серый',
    colorHex: '#9ca3af',
    description: 'Худи оверсайз из флиса. Кенгуру-карман, капюшон.',
    photo: '',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'p_init_4',
    name: 'Поло корпоративное',
    article: 'POL-M-NVY',
    size: 'M',
    color: 'Тёмно-синий',
    colorHex: '#1e3a5f',
    description: 'Поло пике 220 г/м², воротник-стойка, 3 пуговицы.',
    photo: '',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'p_init_5',
    name: 'Футболка принт',
    article: 'FPR-S-RED',
    size: 'S',
    color: 'Красный',
    colorHex: '#ef4444',
    description: 'Футболка с принтом под нанесение. Хлопок 160 г/м².',
    photo: '',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'p_init_6',
    name: 'Худи оверсайз',
    article: 'HOV-M-BLK',
    size: 'M',
    color: 'Чёрный',
    colorHex: '#1a1a1a',
    description: 'Худи оверсайз из флиса. Кенгуру-карман, капюшон.',
    photo: '',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: INITIAL,

      add: (p) => {
        const product: Product = { ...p, id: uid(), createdAt: new Date().toISOString() }
        set((s) => ({ products: [product, ...s.products] }))
        return product
      },

      update: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      remove: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
    }),
    { name: 'bof-products' },
  ),
)
