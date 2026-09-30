import type { Credentials } from '@/shared/api/credentials'

import { toInstanceState } from '../lib/to-instance-state'
import type { InstanceState } from '../model/instance-state'

import { sessionRepository } from './session-repository'

/** Проверка кредов и статуса инстанса одним запросом `getStateInstance`. Бросает `ApiError`. */
export async function checkInstanceState(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<InstanceState> {
  const raw = await sessionRepository.getState(credentials, signal)
  return toInstanceState(raw)
}
