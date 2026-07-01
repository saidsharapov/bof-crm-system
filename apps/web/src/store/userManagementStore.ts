/**
 * userManagementStore — thin wrapper kept for backwards compatibility.
 * All data now comes from the real API via usersApi.
 */
import { create } from 'zustand'
import { usersApi, type AppUser as ApiUser } from '../api/users'
import type { UserRole } from './authStore'

export interface AppUser {
  id: string
  login: string
  name: string
  role: UserRole
  password?: string
  createdAt: string
  active: boolean
}

interface UserManagementState {
  users: AppUser[]
  loading: boolean
  fetch: () => Promise<void>
  addUser: (u: Omit<AppUser, 'id' | 'createdAt'>) => Promise<AppUser>
  updateUser: (id: string, patch: Partial<Omit<AppUser, 'id' | 'createdAt'>>) => Promise<void>
  removeUser: (id: string) => Promise<void>
  changePassword: (id: string, newPassword: string) => Promise<void>
  verifyPassword: (login: string, password: string) => null
}

function mapUser(u: ApiUser): AppUser {
  return {
    id: u.id,
    login: u.login,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    active: u.active ?? true,
  }
}

export const useUserManagementStore = create<UserManagementState>()((set, _get) => ({
  users: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const users = await usersApi.list()
      set({ users: users.map(mapUser) })
    } finally {
      set({ loading: false })
    }
  },

  addUser: async (u) => {
    const created = await usersApi.create({
      login: u.login,
      name: u.name,
      password: u.password ?? '',
      role: u.role,
    })
    const user = mapUser(created)
    set((s) => ({ users: [...s.users, user] }))
    return user
  },

  updateUser: async (id, patch) => {
    const updated = await usersApi.update(id, {
      name: patch.name,
      login: patch.login,
      role: patch.role,
      active: patch.active,
      ...(patch.password ? { password: patch.password } : {}),
    })
    const user = mapUser(updated)
    set((s) => ({ users: s.users.map((u) => (u.id === id ? user : u)) }))
  },

  removeUser: async (id) => {
    await usersApi.delete(id)
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }))
  },

  changePassword: async (_id, _newPassword) => {
    // Password change via /auth/change-password is handled directly in SettingsPage
    // This method is kept for interface compatibility but no-ops here
  },

  // No longer needed with real API - always returns null
  verifyPassword: (_login, _password) => null,
}))
