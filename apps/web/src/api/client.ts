import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  timeout: 15000,
})

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }
      original._retry = true
      isRefreshing = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/refresh`,
          { refresh_token: refreshToken }
        )
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token, data.user)
        processQueue(null, data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return apiClient(original)
      } catch (e) {
        processQueue(e, null)
        useAuthStore.getState().logout()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
