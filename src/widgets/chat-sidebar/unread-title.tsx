import { useTotalUnread } from '@/entities/chat/model/chat.store'

import { useDocumentVisible } from '@/shared/lib/use-document-visible'

const APP_TITLE = 'MAX-чат'

/** Заголовок вкладки: пока она скрыта, показывает общее число непрочитанных — `(3) MAX-чат`. */
export function UnreadTitle() {
  const total = useTotalUnread()
  const isVisible = useDocumentVisible()
  const title = !isVisible && total > 0 ? `(${total}) ${APP_TITLE}` : APP_TITLE

  return <title>{title}</title>
}
