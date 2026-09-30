import { Dialog, DialogContent } from '@/shared/ui/dialog'
import { Gate } from '@/shared/ui/gate'

import {
  closeNewChatDialog,
  takeReturnFocusTarget,
  useNewChatDialogStore,
} from './model/new-chat-dialog.store'
import { useCreateChatForm } from './model/use-create-chat-form'
import { CreateChatForm } from './ui/create-chat-form'

const handleOpenChange = (isOpen: boolean) => {
  if (!isOpen) closeNewChatDialog()
}

const handleCloseAutoFocus = (event: Event) => {
  const target = takeReturnFocusTarget()
  if (!target) return
  event.preventDefault()
  target.focus()
}

function NewChatDialogBody() {
  const model = useCreateChatForm()
  const preventWhileChecking = (event: Event) => {
    if (model.isChecking) event.preventDefault()
  }

  return (
    <DialogContent
      title="Новый чат"
      isCloseDisabled={model.isChecking}
      onEscapeKeyDown={preventWhileChecking}
      onInteractOutside={preventWhileChecking}
      onCloseAutoFocus={handleCloseAutoFocus}
      onOpenAutoFocus={model.onOpenAutoFocus}
    >
      <CreateChatForm model={model} onCancel={closeNewChatDialog} />
    </DialogContent>
  )
}

/** Форма «Новый чат»: на desktop — модалка, на mobile — полноэкранная панель. */
export function NewChatDialog() {
  const isOpen = useNewChatDialogStore((state) => state.isOpen)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Gate when={isOpen}>
        <NewChatDialogBody />
      </Gate>
    </Dialog>
  )
}
