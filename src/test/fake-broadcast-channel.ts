/**
 * BroadcastChannel в памяти: «вкладки» — разные экземпляры канала в одном тесте.
 * Настоящий из Node доставляет сообщения между воркерами Vitest, и параллельные файлы мешали бы друг другу.
 * Как в браузере: получатели определяются в момент отправки, отправитель своё сообщение не получает,
 * доставка — асинхронная.
 */
export class FakeBroadcastChannel extends EventTarget {
  private static channels = new Set<FakeBroadcastChannel>()

  readonly name: string
  onmessage: ((event: MessageEvent) => void) | null = null
  private isClosed = false

  constructor(name: string) {
    super()
    this.name = name
    FakeBroadcastChannel.channels.add(this)
  }

  postMessage(data: unknown) {
    if (this.isClosed) throw new DOMException('Канал закрыт', 'InvalidStateError')
    const targets = [...FakeBroadcastChannel.channels].filter(
      (channel) => channel !== this && channel.name === this.name,
    )
    for (const target of targets) {
      const payload = structuredClone(data)
      queueMicrotask(() => {
        target.deliver(payload)
      })
    }
  }

  close() {
    this.isClosed = true
    FakeBroadcastChannel.channels.delete(this)
  }

  private deliver(data: unknown) {
    if (this.isClosed) return
    const event = new MessageEvent('message', { data })
    this.onmessage?.(event)
    this.dispatchEvent(event)
  }

  static reset() {
    FakeBroadcastChannel.channels.clear()
  }
}
