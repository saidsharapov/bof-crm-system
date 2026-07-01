import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from './authStore'

export interface AppUser {
  id: string
  login: string
  name: string
  role: UserRole
  password: string
  createdAt: string
  active: boolean
}

interface UserManagementState {
  users: AppUser[]
  addUser: (u: Omit<AppUser, 'id' | 'createdAt'>) => AppUser
  updateUser: (id: string, patch: Partial<Omit<AppUser, 'id' | 'createdAt'>>) => void
  removeUser: (id: string) => void
  changePassword: (id: string, newPassword: string) => void
  verifyPassword: (login: string, password: string) => AppUser | null
}

function uid() { return `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

const INITIAL_USERS: AppUser[] = [
  {
    id:       'u_admin',
    login:    'admin',
    name:     'Алексей Морозов',
    role:     'ADMIN',
    password: 'admin123',
    createdAt: new Date('2024-01-01').toISOString(),
    active:   true,
  },
  {
    id:       'u_manager',
    login:    'manager',
    name:     'Дарья Соколова',
    role:     'MANAGER',
    password: 'manager123',
    createdAt: new Date('2024-01-15').toISOString(),
    active:   true,
  },
  {
    id:       'u_sklad',
    login:    'sklad',
    name:     'Игорь Беляев',
    role:     'WAREHOUSE',
    password: 'sklad123',
    createdAt: new Date('2024-02-01').toISOString(),
    active:   true,
  },
]

export const useUserManagementStore = create<UserManagementState>()(
  persist(
    (set, get) => ({
      users: INITIAL_USERS,

      addUser: (u) => {
        const user: AppUser = { ...u, id: uid(), createdAt: new Date().toISOString() }
        set((s) => ({ users: [...s.users, user] }))
        return user
      },

      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),

      removeUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      changePassword: (id, newPassword) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, password: newPassword } : u)) })),

      verifyPassword: (login, password) => {
        const u = get().users.find((u) => u.login.toLowerCase() === login.toLowerCase())
        return u && u.password === password ? u : null
      },
    }),
    { name: 'bof-users' },
  ),
)
