import type { ReactNode } from 'react'

import { AppWindow } from 'lucide-react'

import { AuthLayout } from '@/shared/ui/auth-layout'
import { Button } from '@/shared/ui/button'
import { Logo } from '@/shared/ui/logo'
import { StatusScreen } from '@/shared/ui/status-screen'

type OtherTabScreenProps = {
  onUseHere: () => void
  /** Ждём, пока другая вкладка уступит сессию. */
  isSwitching: boolean
  /** Кнопка «Выйти» — из соседней фичи, поэтому приходит готовой. */
  signOutAction: ReactNode
}

/** Появляется мгновенно: это не ошибка, а переключение вкладки. */
export function OtherTabScreen({ onUseHere, isSwitching, signOutAction }: OtherTabScreenProps) {
  const useHereLabel = isSwitching ? 'Переключаем…' : 'Использовать здесь'

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
        >
          <Button className="w-full" loading={isSwitching} onClick={onUseHere}>
            {useHereLabel}
          </Button>
          {signOutAction}
        </StatusScreen>
      </div>
    </AuthLayout>
  )
}
