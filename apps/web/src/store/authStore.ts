import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

export type UserRole = 'ADMIN' | 'WAREHOUSE' | 'MANAGER'

export interface User {
  id: string
  login: string
  role: UserRole
  name: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  setTokens: (access: string, refresh: string, user: User) => void
  login: (login: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),

      setTokens: (access, refresh, user) =>
        set({ token: access, refreshToken: refresh, user }),

      login: async (login, password) => {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/login`,
          { login, password }
        )
        set({ token: data.access_token, refreshToken: data.refresh_token, user: data.user })
      },

      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'bof-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)
