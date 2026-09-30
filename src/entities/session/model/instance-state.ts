export const InstanceState = {
  Authorized: 'authorized',
  Suspended: 'suspended',
  NotAuthorized: 'notAuthorized',
  Starting: 'starting',
  Blocked: 'blocked',
  PendingPassword: 'pendingPassword',
} as const
export type InstanceState = (typeof InstanceState)[keyof typeof InstanceState]

/** Статусы, при которых в приложение не пускаем: сообщения всё равно не уйдут. */
export type BlockingInstanceState = Exclude<
  InstanceState,
  typeof InstanceState.Authorized | typeof InstanceState.Suspended
>

export const isUsableInstanceState = (
  state: InstanceState,
): state is typeof InstanceState.Authorized | typeof InstanceState.Suspended =>
  state === InstanceState.Authorized || state === InstanceState.Suspended
