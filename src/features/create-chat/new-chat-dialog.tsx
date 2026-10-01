import { lazy, Suspense } from 'react'

import { Dialog } from '@/shared/ui/dialog'
import { Gate } from '@/shared/ui/gate'

import { closeNewChatDialog, useNewChatDialogStore } from './model/new-chat-dialog.store'
import { useDialogHistory } from './model/use-dialog-history'

const NewChatDialogBody = lazy(async () => {
  const { NewChatDialogBody: Body } = await import('./new-chat-dialog-body')
  return { default: Body }
})

const handleOpenChange = (isOpen: boolean) => {
  if (!isOpen) closeNewChatDialog()
}

/** Форма «Новый чат»: на desktop — модалка, на mobile — полноэкранная панель. */
export function NewChatDialog() {
  const isOpen = useNewChatDialogStore((state) => state.isOpen)
  useDialogHistory(isOpen)

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
