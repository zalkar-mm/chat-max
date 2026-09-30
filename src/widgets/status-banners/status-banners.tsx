import { CheckCircle2, TriangleAlert, WifiOff } from 'lucide-react'

import {
  useIsSuspendedBannerVisible,
  useSessionStore,
} from '@/entities/session/model/session.store'

import { ConnectionStatus, useConnectionStatus } from '@/shared/lib/connection/connection.store'
import { Banner } from '@/shared/ui/banner'
import { Gate } from '@/shared/ui/gate'

const dismissSuspendedBanner = () => {
  useSessionStore.getState().dismissSuspendedBanner()
}

/**
 * Баннеры под шапкой: ошибка выше предупреждения, контент сдвигается, а не перекрывается.
 * Live-регионы смонтированы всегда: скринридер объявляет текст, появившийся внутри уже существующего региона.
 */
export function StatusBanners() {
  const connection = useConnectionStatus()
  const isSuspendedVisible = useIsSuspendedBannerVisible()
  const isOffline = connection === ConnectionStatus.Offline
  const isRestored = connection === ConnectionStatus.Restored

  return (
    <div className="shrink-0">
      <div role="alert">
        <Gate when={isOffline}>
          <Banner tone="error" icon={<WifiOff className="size-5" aria-hidden />}>
            Нет соединения. Переподключаемся…
          </Banner>
        </Gate>
      </div>
      <div role="status">
        <Gate when={isSuspendedVisible}>
          <Banner
            tone="warn"
            icon={<TriangleAlert className="size-5" aria-hidden />}
            onDismiss={dismissSuspendedBanner}
          >
            Аккаунт MAX временно ограничен: сообщения можно отправлять только контактам
          </Banner>
        </Gate>
        <Gate when={isRestored}>
          <Banner tone="ok" icon={<CheckCircle2 className="size-5" aria-hidden />}>
            Соединение восстановлено
          </Banner>
        </Gate>
      </div>
    </div>
  )
}
