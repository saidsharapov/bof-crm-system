/**
 * productStore — thin wrapper kept for backwards compatibility.
 * All data now comes from the real API via productsApi.
 * Pages that import this store should be migrated to call productsApi directly.
 */
import { create } from 'zustand'
import { productsApi } from '../api/products'

export interface Product {
  id: string
  name: string
  article: string
  size: string
  color: string
  colorHex: string
  description: string
  photo: string        // maps from photoUrl
  createdAt: string
}

interface ProductState {
  products: Product[]
  loading: boolean
  fetch: () => Promise<void>
  add: (p: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>
  update: (id: string, p: Partial<Omit<Product, 'id' | 'createdAt'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

function mapProduct(p: { id: string; name: string; article: string; size: string; color: string; colorHex: string; description: string; photoUrl?: string; photo?: string; createdAt: string }): Product {
  return { ...p, photo: p.photoUrl ?? p.photo ?? '' }
}

export const useProductStore = create<ProductState>()((set) => ({
  products: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const res = await productsApi.list({ limit: 500 })
      set({ products: res.items.map(mapProduct) })
    } finally {
      set({ loading: false })
    }
  },

  add: async (p) => {
    const created = await productsApi.create({
      name: p.name,
      article: p.article,
      size: p.size,
      color: p.color,
      colorHex: p.colorHex,
      description: p.description,
      photoUrl: p.photo || undefined,
    })
    const product = mapProduct(created)
    set((s) => ({ products: [product, ...s.products] }))
    return product
  },

  update: async (id, patch) => {
    const updated = await productsApi.update(id, {
      ...patch,
      photoUrl: patch.photo || undefined,
    })
    const product = mapProduct(updated)
    set((s) => ({ products: s.products.map((p) => (p.id === id ? product : p)) }))
  },

  remove: async (id) => {
    await productsApi.delete(id)
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }))
  },
}))
