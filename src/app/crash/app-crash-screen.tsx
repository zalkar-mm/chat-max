import { useRouteError } from 'react-router'

import { OctagonAlert } from 'lucide-react'

import { SignOutButton } from '@/features/sign-out/sign-out-button'

import { Button } from '@/shared/ui/button'
import { Disclosure } from '@/shared/ui/disclosure'
import { Gate } from '@/shared/ui/gate'
import { StatusScreen } from '@/shared/ui/status-screen'

const reloadPage = () => {
  window.location.reload()
}

const describeError = (error: unknown) => {
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`
  return String(error)
}

/** Любая ошибка рендера — аккуратный экран вместо белого. Сессия не теряется. */
export function AppCrashScreen() {
  const error = useRouteError()
  const details = describeError(error)

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <title>Ошибка — MAX-чат</title>
      <StatusScreen
        visual={<OctagonAlert className="size-16" aria-hidden />}
        tone="negative"
        title="Что-то пошло не так"
        description="Попробуйте перезагрузить страницу. Если ошибка повторяется — выйдите и войдите снова"
      >
        <Button className="w-full" onClick={reloadPage}>
          Перезагрузить
        </Button>
        <SignOutButton appearance="button" />
        <Gate when={import.meta.env.DEV}>
          <Disclosure label="Подробности">
            <pre className="max-h-60 overflow-auto rounded-m bg-tertiary p-3 text-left typo-description whitespace-pre-wrap text-secondary">
              {details}
            </pre>
          </Disclosure>
        </Gate>
      </StatusScreen>
    </div>
  )
}
