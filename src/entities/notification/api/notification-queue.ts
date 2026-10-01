import type { Credentials } from '@/shared/api/credentials'

import type { RawNotification } from '../model/notification.types'

import { notificationRepository } from './notification-repository'

/** Следующее событие очереди или null, если за время long-poll событий не было. */
export function receiveNotification(
  credentials: Credentials,
  signal: AbortSignal,
): Promise<RawNotification | null> {
  return notificationRepository.receive(credentials, signal)
}

/** Подтвердить обработку. false — событие уже было удалено. */
export function deleteNotification(
  credentials: Credentials,
  receiptId: number,
  signal: AbortSignal,
) {
  return notificationRepository.remove(credentials, receiptId, signal)
}
