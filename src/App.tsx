import { AuthInitializer } from '@/components/shared/AuthInitializer'
import { AppRouter } from '@/router'

export default function App() {
  return (
    <AuthInitializer>
      <AppRouter />
    </AuthInitializer>
  )
}
