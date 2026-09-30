import { Button } from '@/shared/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription } from '@/shared/ui/dialog'

import { setNewChatDialogOpen, useNewChatDialogStore } from './model/new-chat-dialog.store'

/** Заглушка до спринта 2: место под форму «Новый чат» уже заложено. */
export function NewChatDialog() {
  const isOpen = useNewChatDialogStore((state) => state.isOpen)

  return (
    <Dialog open={isOpen} onOpenChange={setNewChatDialogOpen}>
      <DialogContent title="Новый чат">
        <DialogDescription>Появится в следующей версии</DialogDescription>
        <DialogClose asChild>
          <Button variant="secondary" className="mt-6 w-full">
            Закрыть
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
