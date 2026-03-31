import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { IUser, AuthState } from '@/types/auth'

const storedToken = localStorage.getItem('accessToken')

const initialState: AuthState = {
  user: null,
  accessToken: storedToken,
  isAuthenticated: !!storedToken,
  isHydrated: !storedToken, // no token → nothing to hydrate → already done
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Full login — sets user + token (called after successful /auth/login)
    setAuth(state, action: PayloadAction<{ user: IUser; accessToken: string }>) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      state.isHydrated = true
      localStorage.setItem('accessToken', action.payload.accessToken)
    },
    // Hydration only — sets user without touching the token
    setUser(state, action: PayloadAction<IUser>) {
      state.user = action.payload
      state.isAuthenticated = true
    },
    // Token refresh — updates token only (called by Axios interceptor)
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
      localStorage.setItem('accessToken', action.payload)
    },
    // Marks initial hydration check as complete
    setHydrated(state) {
      state.isHydrated = true
    },
    // Logout / session expired
    clearAuth(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.isHydrated = true
      localStorage.removeItem('accessToken')
    },
  },
})

export const { setAuth, setUser, setAccessToken, setHydrated, clearAuth } = authSlice.actions
export default authSlice.reducer
