import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { IUser, AuthState } from '@/types/auth'

const storedToken = localStorage.getItem('accessToken')

const initialState: AuthState = {
  user: null,
  accessToken: storedToken,
  isAuthenticated: !!storedToken,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: IUser; accessToken: string }>) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      localStorage.setItem('accessToken', action.payload.accessToken)
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
      localStorage.setItem('accessToken', action.payload)
    },
    clearAuth(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      localStorage.removeItem('accessToken')
    },
  },
})

export const { setAuth, setAccessToken, clearAuth } = authSlice.actions
export default authSlice.reducer
