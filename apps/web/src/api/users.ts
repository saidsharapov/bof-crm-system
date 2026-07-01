import { apiClient } from './client'
import type { UserRole } from '../store/authStore'

export interface AppUser {
  id: string
  login: string
  name: string
  role: UserRole
  createdAt: string
  active?: boolean
}

export const usersApi = {
  list: () =>
    apiClient.get<AppUser[]>('/users').then(r => r.data),

  create: (data: { login: string; name: string; password: string; role: string }) =>
    apiClient.post<AppUser>('/users', data).then(r => r.data),

  update: (id: string, data: Partial<{ login: string; name: string; role: string; active: boolean; password: string }>) =>
    apiClient.patch<AppUser>(`/users/${id}`, data).then(r => r.data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),

  changePassword: (current: string, next: string) =>
    apiClient.post('/auth/change-password', { current, next }).then(r => r.data),
}
