import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach token to every request ──────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('bof-auth')
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { token?: string } }
      const token = parsed?.state?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // ignore
  }
  return config
})

// ── Types ───────────────────────────────────────────────────────────────────
export interface LoginPayload {
  login: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: {
    id: string
    login: string
    role: 'ADMIN' | 'WAREHOUSE' | 'MANAGER'
    name: string
  }
}

// ── Auth endpoints ──────────────────────────────────────────────────────────
export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  // ── MOCK (remove when backend is ready) ──────────────────────────────────
  if (import.meta.env.VITE_MOCK_AUTH === 'true' || !import.meta.env.VITE_API_URL) {
    return mockLogin(payload)
  }
  // ────────────────────────────────────────────────────────────────────────
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
  return data
}

// ── Mock implementation ─────────────────────────────────────────────────────
const MOCK_USERS: Record<string, { password: string; role: 'ADMIN' | 'WAREHOUSE' | 'MANAGER'; name: string }> = {
  admin:   { password: 'admin123',   role: 'ADMIN',     name: 'Алексей Морозов'   },
  manager: { password: 'manager123', role: 'MANAGER',   name: 'Дарья Соколова'    },
  sklad:   { password: 'sklad123',   role: 'WAREHOUSE', name: 'Игорь Беляев'      },
}

async function mockLogin(payload: LoginPayload): Promise<LoginResponse> {
  await new Promise((r) => setTimeout(r, 900))

  const user = MOCK_USERS[payload.login.toLowerCase()]
  if (!user || user.password !== payload.password) {
    const err = new Error('Неверный логин или пароль') as Error & { response?: { status: number } }
    err.response = { status: 401 }
    throw err
  }

  return {
    access_token: `mock_token_${Date.now()}`,
    user: {
      id:    `user_${payload.login}`,
      login: payload.login,
      role:  user.role,
      name:  user.name,
    },
  }
}
