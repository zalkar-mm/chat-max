import { DialogContent } from '@/shared/ui/dialog'

import { closeNewChatDialog, takeReturnFocusTarget } from './model/new-chat-dialog.store'
import { useCreateChatForm } from './model/use-create-chat-form'
import { CreateChatForm } from './ui/create-chat-form'

// Фокусом после закрытия управляем сами: на инициатор после отмены, в открытый чат — после создания.
const handleCloseAutoFocus = (event: Event) => {
  event.preventDefault()
  takeReturnFocusTarget()?.focus()
}

/** Содержимое формы — отдельный чанк: react-hook-form и поля не нужны до первого открытия. */
export function NewChatDialogBody() {
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
