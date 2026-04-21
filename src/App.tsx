import { AuthInitializer } from '@/components/shared/AuthInitializer'
import { Toaster } from '@/components/ui/sonner'
import { AppRouter } from '@/router'

export default function App() {
  return (
    <AuthInitializer>
      <AppRouter />
      <Toaster position="bottom-right" richColors />
    </AuthInitializer>
  )
}
