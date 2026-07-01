import { apiClient } from './client'

export type OrderStatus = 'NEW' | 'IN_WORK' | 'DELIVERING' | 'DELIVERED' | 'CANCELED'

export interface OrderItem {
  productId: string
  qty: number
  price?: number
}

export interface Order {
  id: string
  num: string
  clientName: string
  phone: string
  address: string
  comment: string
  sourceId?: string
  source?: { id: string; name: string }
  deadline?: string
  items: OrderItem[]
  totalAmount?: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export const ordersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<{ items: Order[]; total: number; page: number; limit: number }>('/orders', { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<Order>(`/orders/${id}`).then(r => r.data),

  create: (data: {
    clientName: string
    phone: string
    address?: string
    comment?: string
    sourceId?: string
    deadline?: string
    items: OrderItem[]
  }) =>
    apiClient.post<Order>('/orders', data).then(r => r.data),

  update: (id: string, data: Partial<{
    clientName: string
    phone: string
    address: string
    comment: string
    sourceId: string
    deadline: string
    items: OrderItem[]
    status: OrderStatus
  }>) =>
    apiClient.patch<Order>(`/orders/${id}`, data).then(r => r.data),

  setStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status }).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/orders/${id}`),
}
