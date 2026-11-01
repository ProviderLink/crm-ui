import type { AuthState, IUser } from '@/types/auth';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Access token lives in memory only — never persisted to localStorage.
// Session continuity relies on the HttpOnly refresh token cookie.
const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false, // always check session on startup via AuthInitializer
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sets user + token (after /auth/login, and after the startup refresh)
    setAuth(
      state,
      action: PayloadAction<{ user: IUser; accessToken: string }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isHydrated = true;
    },
    // Token refresh — updates token only (called by Axios interceptor)
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    // Marks initial hydration check as complete
    setHydrated(state) {
      state.isHydrated = true;
    },
    // Logout / session expired
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isHydrated = true;
    },
  },
});

export const { setAuth, setAccessToken, setHydrated, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;
