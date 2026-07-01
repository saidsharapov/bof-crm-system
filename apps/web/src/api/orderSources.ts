import { apiClient } from './client'

export interface OrderSource {
  id: string
  name: string
  archived: boolean
  createdAt: string
}

export const orderSourcesApi = {
  list: (all = false) =>
    apiClient.get<OrderSource[]>('/order-sources', { params: { all } }).then(r => r.data),

  create: (name: string) =>
    apiClient.post<OrderSource>('/order-sources', { name }).then(r => r.data),

  update: (id: string, data: { name?: string; archived?: boolean }) =>
    apiClient.patch<OrderSource>(`/order-sources/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/order-sources/${id}`),
}
