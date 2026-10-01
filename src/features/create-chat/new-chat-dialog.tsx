import { lazy, Suspense, useEffect } from 'react'

import { Dialog } from '@/shared/ui/dialog'
import { Gate } from '@/shared/ui/gate'

import { closeNewChatDialog, useNewChatDialogStore } from './model/new-chat-dialog.store'
import { useDialogHistory } from './model/use-dialog-history'

const loadBody = () => import('./new-chat-dialog-body')

const NewChatDialogBody = lazy(async () => {
  const { NewChatDialogBody: Body } = await loadBody()
  return { default: Body }
})

const handleOpenChange = (isOpen: boolean) => {
  if (!isOpen) closeNewChatDialog()
}

/** Форма «Новый чат»: на desktop — модалка, на mobile — полноэкранная панель. */
export function NewChatDialog() {
  const isOpen = useNewChatDialogStore((state) => state.isOpen)
  useDialogHistory(isOpen)

  // Чанк формы — не в начальной загрузке, но подгружается сразу после неё: открытие без задержки.
  useEffect(() => {
    void loadBody()
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Gate when={isOpen}>
        <Suspense>
          <NewChatDialogBody />
        </Suspense>
      </Gate>
    </Dialog>
  )
}
