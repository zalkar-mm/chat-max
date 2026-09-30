import { InstanceState } from '../model/instance-state'

const KNOWN_STATES: ReadonlySet<string> = new Set(Object.values(InstanceState))

const isInstanceState = (value: string): value is InstanceState => KNOWN_STATES.has(value)

/** Незнакомый статус — считаем инстанс неподключённым: пускать в чат с ним нельзя. */
export function toInstanceState(raw: string): InstanceState {
  return isInstanceState(raw) ? raw : InstanceState.NotAuthorized
}
