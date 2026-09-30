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

/** Баннеры под шапкой: ошибка выше предупреждения, контент сдвигается, а не перекрывается. */
export function StatusBanners() {
  const connection = useConnectionStatus()
  const isSuspendedVisible = useIsSuspendedBannerVisible()

  return (
    <div className="shrink-0">
      <Gate when={connection === ConnectionStatus.Offline}>
        <Banner tone="error" icon={<WifiOff className="size-5" aria-hidden />}>
          Нет соединения. Переподключаемся…
        </Banner>
      </Gate>
      <Gate when={isSuspendedVisible}>
        <Banner
          tone="warn"
          icon={<TriangleAlert className="size-5" aria-hidden />}
          onDismiss={dismissSuspendedBanner}
        >
          Аккаунт MAX временно ограничен: сообщения можно отправлять только контактам
        </Banner>
      </Gate>
      <Gate when={connection === ConnectionStatus.Restored}>
        <Banner tone="ok" icon={<CheckCircle2 className="size-5" aria-hidden />}>
          Соединение восстановлено
        </Banner>
      </Gate>
    </div>
  )
}
