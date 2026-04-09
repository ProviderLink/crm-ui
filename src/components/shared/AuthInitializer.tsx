import { useAppDispatch, useAppSelector } from '@/hooks/store'
import { getMe } from '@/services/auth.service'
import { clearAuth, setHydrated, setUser } from '@/store/slices/authSlice'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Runs once on mount. If a stored access token exists, fetches /auth/me
 * to rehydrate the user object. Blocks the app from rendering until done.
 */
export function AuthInitializer({ children }: Props) {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(s => s.auth.accessToken)
  const isHydrated = useAppSelector(s => s.auth.isHydrated)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (!accessToken) {
      dispatch(setHydrated())
      return
    }

    getMe()
      .then(user => {
        dispatch(setUser(user))
        dispatch(setHydrated())
      })
      .catch(() => {
        dispatch(clearAuth()) // clearAuth also sets isHydrated = true
      })
  }, []) // intentionally empty — one-time mount check

  if (!isHydrated) return null

  return <>{children}</>
}
