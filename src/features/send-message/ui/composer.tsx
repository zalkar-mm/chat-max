import type { RefObject } from 'react'

import { SendHorizontal } from 'lucide-react'

import { MAX_MESSAGE_LENGTH } from '@/entities/message/model/message-limits'

import { cn } from '@/shared/lib/cn'
import { Gate } from '@/shared/ui/gate'
import { IconButton } from '@/shared/ui/icon-button'
import { Textarea } from '@/shared/ui/textarea'

import type { ComposerModel } from '../model/use-composer'

type ComposerProps = {
  model: ComposerModel
  textareaRef: RefObject<HTMLTextAreaElement | null>
}

const LIMIT_ERROR_ID = 'composer-limit-error'

export function Composer({ model, textareaRef }: ComposerProps) {
  const { isOverLimit, isInstanceReady } = model
  const placeholder = isInstanceReady ? 'Сообщение' : 'Инстанс не подключён — отправка недоступна'
  const counter = `${model.length} / ${MAX_MESSAGE_LENGTH}`
  const counterCn = cn('typo-description', isOverLimit ? 'text-negative-strong' : 'text-tertiary')
  const describedBy = isOverLimit ? LIMIT_ERROR_ID : undefined
  const limitError = isOverLimit ? 'Максимум 4000 символов' : ''
  const isSendDisabled = !model.canSend
  const isTextareaDisabled = !isInstanceReady

  return (
    <div className="shrink-0 border-t border-divider-soft bg-primary px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:px-4">
      <div className="mx-auto max-w-(--chat-content-max-w)">
        <div className="mb-1 flex items-center justify-between gap-2 empty:hidden">
          <p id={LIMIT_ERROR_ID} role="alert" className="typo-description text-negative-strong">
            {limitError}
          </p>
          <Gate when={model.isCounterVisible}>
            <p className={counterCn}>{counter}</p>
          </Gate>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={model.text}
            placeholder={placeholder}
            aria-label="Сообщение"
            aria-describedby={describedBy}
            invalid={isOverLimit}
            disabled={isTextareaDisabled}
            // Длинный плейсхолдер неактивного поля на узком экране не влезает в строку — даём ему две.
            className="min-h-10 overflow-y-auto max-md:disabled:placeholder-shown:min-h-16"
            onChange={model.onChange}
            onKeyDown={model.onKeyDown}
          />
          <IconButton
            variant="accent"
            label="Отправить"
            disabled={isSendDisabled}
            onClick={model.onSend}
          >
            <SendHorizontal aria-hidden />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
