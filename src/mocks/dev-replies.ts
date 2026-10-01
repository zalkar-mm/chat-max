import {
  incomingMessageBody,
  outgoingMessageBody,
  pushNotification,
  stateBody,
  statusBody,
} from './notification-queue'

/**
 * Dev-сценарий собеседника: после отправки — эхо, «доставлено», ответ и «прочитано».
 * Метка в тексте меняет сценарий (таблица в src/mocks/README.md). В тестах не используется.
 */
const later = (ms: number, action: () => void) => {
  setTimeout(action, ms)
}

let counter = 0
const nextId = (prefix: string) => {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

export function simulateRecipient(
  idInstance: string,
  chatId: string,
  idMessage: string,
  text: string,
) {
  pushNotification(
    idInstance,
    outgoingMessageBody('outgoingAPIMessageReceived', { chatId, idMessage, text }),
  )

  if (text.includes('#undelivered')) {
    later(800, () => {
      pushNotification(idInstance, statusBody(idMessage, 'failed'))
    })
    return
  }
  later(800, () => {
    pushNotification(idInstance, statusBody(idMessage, 'delivered'))
  })

  // Тело собирается в момент «ответа»: отметка времени собеседника позже нашей отправки, как в жизни.
  const reply = (makeBody: () => Record<string, unknown>) => {
    later(1600, () => {
      pushNotification(idInstance, makeBody())
    })
  }
  if (text.includes('#photo')) {
    reply(() =>
      incomingMessageBody({
        chatId,
        idMessage: nextId('in'),
        typeMessage: 'imageMessage',
        senderName: 'Анна',
      }),
    )
  } else if (text.includes('#new')) {
    reply(() =>
      incomingMessageBody({
        chatId: '20000001',
        idMessage: nextId('in'),
        text: 'Привет! Я новый собеседник',
        senderName: 'Борис',
        senderPhoneNumber: 79990001122,
      }),
    )
  } else if (text.includes('#group')) {
    reply(() =>
      incomingMessageBody({
        chatId: '-100500',
        idMessage: nextId('in'),
        text: 'в группе',
        chatType: 'group',
      }),
    )
  } else if (text.includes('#broken')) {
    reply(() => ({ typeWebhook: 'incomingMessageReceived', senderData: 'битые данные' }))
  } else if (text.includes('#logout')) {
    reply(() => stateBody('notAuthorized'))
  } else if (text.includes('#quota')) {
    reply(() => ({ typeWebhook: 'quotaExceeded', quotaData: { method: 'correspondents' } }))
  } else {
    const idMessage = nextId('in')
    const makeAnswer = () =>
      incomingMessageBody({ chatId, idMessage, text: `Ответ на «${text}»`, senderName: 'Анна' })
    reply(makeAnswer)
    // Повторная доставка того же события — тот же idMessage.
    if (text.includes('#dup')) reply(makeAnswer)
  }
  later(2600, () => {
    pushNotification(idInstance, statusBody(idMessage, 'read'))
  })
}
