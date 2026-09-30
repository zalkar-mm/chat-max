import { WifiOff } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { StatusScreen } from '@/shared/ui/status-screen'

type RestoreFailedScreenProps = {
  isRetrying: boolean
  onRetry: () => void
}

export function RestoreFailedScreen({ isRetrying, onRetry }: RestoreFailedScreenProps) {
  const retryText = isRetrying ? 'Проверяем…' : 'Повторить'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <StatusScreen
        visual={<WifiOff className="size-16" aria-hidden />}
        title="Нет соединения"
        description="Проверьте интернет и попробуйте снова"
      >
        <Button className="w-full" loading={isRetrying} onClick={onRetry}>
          {retryText}
        </Button>
      </StatusScreen>
    </div>
  )
}
