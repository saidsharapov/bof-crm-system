import { apiClient } from './client'

export interface ProductionRecord {
  id: string
  notes?: string
  materials: { materialId: string; qty: number }[]
  products: { productId: string; qty: number }[]
  createdAt: string
}

export const productionApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ items: ProductionRecord[]; total: number; page: number; limit: number }>('/production', { params }).then(r => r.data),

  create: (data: {
    notes?: string
    materials: { materialId: string; qty: number }[]
    products: { productId: string; qty: number }[]
  }) =>
    apiClient.post<ProductionRecord>('/production', data).then(r => r.data),
}
