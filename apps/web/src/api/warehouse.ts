import { apiClient } from './client'

export interface StockItem {
  id: string
  name: string
  article: string
  size: string
  color: string
  colorHex: string
  description: string
  photoUrl?: string
  photo?: string
  createdAt: string
  stock: number
}

export interface WarehouseMovement {
  id: string
  productId: string
  type: string   // IN | OUT | RESERVE | PRODUCE | SHIP | RETURN
  qty: number
  comment: string
  actorName?: string
  actor?: string  // alias for compatibility
  createdAt: string
  product?: {
    id: string
    name: string
    article: string
    size: string
    color: string
    colorHex: string
  }
}

export const warehouseApi = {
  getStock: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ items: StockItem[]; total: number; page: number; limit: number }>('/warehouse/stock', { params }).then(r => r.data),

  getMovements: (params?: { productId?: string; type?: string; page?: number; limit?: number }) =>
    apiClient.get<{ items: WarehouseMovement[]; total: number; page: number; limit: number }>('/warehouse/movements', { params }).then(r => r.data),

  addMovement: (data: { productId: string; type: 'IN' | 'OUT'; qty: number; comment?: string }) =>
    apiClient.post<WarehouseMovement>('/warehouse/movements', data).then(r => r.data),
}
