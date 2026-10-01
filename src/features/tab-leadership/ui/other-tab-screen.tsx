import type { ReactNode } from 'react'

import { AppWindow } from 'lucide-react'

import { AuthLayout } from '@/shared/ui/auth-layout'
import { Button } from '@/shared/ui/button'
import { Logo } from '@/shared/ui/logo'
import { StatusScreen } from '@/shared/ui/status-screen'

type OtherTabScreenProps = {
  onUseHere: () => void
  /** Кнопка «Выйти» — из соседней фичи, поэтому приходит готовой. */
  signOutAction: ReactNode
}

/** Появляется мгновенно: это не ошибка, а переключение вкладки. */
export function OtherTabScreen({ onUseHere, signOutAction }: OtherTabScreenProps) {
  return (
    <AuthLayout>
      <title>MAX-чат — неактивна</title>
      <div className="flex flex-col items-center gap-8">
        <Logo />
        <StatusScreen
          visual={<AppWindow className="size-16" aria-hidden />}
          title="Приложение открыто в другой вкладке"
          description="Сообщения получает только одна вкладка. Нажмите, чтобы продолжить здесь"
          focusTitle
          announceTitle
        >
          <Button className="w-full" onClick={onUseHere}>
            Использовать здесь
          </Button>
          {signOutAction}
        </StatusScreen>
      </div>
    </AuthLayout>
  )
}
