import { SignInFlow } from '@/features/sign-in/sign-in-flow'
import { ThemeToggle } from '@/features/toggle-theme/theme-toggle'

import { AuthLayout } from '@/shared/ui/auth-layout'

export function SignInPage() {
  return (
    <AuthLayout corner={<ThemeToggle />}>
      <title>Вход — MAX-чат</title>
      <SignInFlow />
    </AuthLayout>
  )
}
