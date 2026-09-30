import { SquarePen } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { IconButton } from '@/shared/ui/icon-button'

import { openNewChatDialog } from './model/new-chat-dialog.store'

export function NewChatIconButton() {
  return (
    <IconButton label="Новый чат" onClick={openNewChatDialog}>
      <SquarePen aria-hidden />
    </IconButton>
  )
}

export function StartNewChatButton() {
  return (
    <Button size="medium" onClick={openNewChatDialog}>
      Начать новый чат
    </Button>
  )
}
