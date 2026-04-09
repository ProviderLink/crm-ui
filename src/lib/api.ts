import { config } from '@/lib/config'
import { store } from '@/store'
import { clearAuth, setAccessToken } from '@/store/slices/authSlice'
import axios, { type InternalAxiosRequestConfig } from 'axios'

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

type FailedQueueEntry = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
})

// Attach access token to every request
api.interceptors.request.use(requestConfig => {
  const token = store.getState().auth.accessToken
  if (token) {
    requestConfig.headers.set('Authorization', `Bearer ${token}`)
  }
  return requestConfig
})

// Handle 401 — attempt token refresh then replay
let isRefreshing = false
let failedQueue: FailedQueueEntry[] = []

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token as string)
  })
  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const originalRequest = error.config as RetryableConfig | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    // If the refresh request itself fails, clear auth and redirect immediately
    if (originalRequest.url?.includes('/auth/refresh')) {
      store.dispatch(clearAuth())
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(token => {
          originalRequest.headers.set('Authorization', `Bearer ${token}`)
          return api(originalRequest)
        })
        .catch((err: unknown) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh')
      store.dispatch(setAccessToken(data.accessToken))
      processQueue(null, data.accessToken)
      originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`)
      return api(originalRequest)
    } catch (refreshError: unknown) {
      processQueue(refreshError, null)
      store.dispatch(clearAuth())
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
