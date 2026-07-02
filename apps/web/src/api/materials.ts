import { apiClient } from './client'

export interface Material {
  id: string
  name: string
  unit: string
  description: string
  createdAt: string
}

export interface MaterialMovement {
  id: string
  materialId: string
  type: string  // IN | OUT
  qty: number
  comment: string
  actorName?: string
  actor?: string  // alias for compatibility
  createdAt: string
}

export const materialsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ items: Material[]; total: number; page: number; limit: number }>('/materials', { params }).then(r => r.data),

  getStock: (id: string) =>
    apiClient.get<{ qty: number }>(`/materials/${id}/stock`).then(r => r.data.qty),

  getHistory: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<{ items: MaterialMovement[]; total: number; page: number; limit: number }>(`/materials/${id}/movements`, { params }).then(r => r.data),

  create: (data: { name: string; unit: string; description?: string }) =>
    apiClient.post<Material>('/materials', data).then(r => r.data),

  update: (id: string, data: { name?: string; unit?: string; description?: string }) =>
    apiClient.patch<Material>(`/materials/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/materials/${id}`),

  addMovement: (id: string, data: { type: 'IN' | 'OUT'; qty: number; comment?: string }) =>
    apiClient.post<MaterialMovement>(`/materials/${id}/movements`, data).then(r => r.data),
}
