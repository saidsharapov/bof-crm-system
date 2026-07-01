import { apiClient } from './client'

export interface Product {
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
}

export const productsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; size?: string; color?: string }) =>
    apiClient.get<{ items: Product[]; total: number; page: number; limit: number }>('/products', { params }).then(r => r.data),

  create: (data: { name: string; article: string; size: string; color: string; colorHex: string; description?: string; photoUrl?: string }) =>
    apiClient.post<Product>('/products', data).then(r => r.data),

  update: (id: string, data: Partial<{ name: string; article: string; size: string; color: string; colorHex: string; description: string; photoUrl: string }>) =>
    apiClient.patch<Product>(`/products/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/products/${id}`),
}
