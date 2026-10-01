/**
 * Web Locks в памяти (в jsdom их нет): общий для всех «вкладок» теста, как в одном браузере.
 * Поддержано то, чем пользуется приложение: `request(name, callback)` и `query()`.
 */
export class FakeLockManager {
  private held = new Set<string>()
  private waiting = new Map<string, (() => void)[]>()

  async request(name: string, callback: () => Promise<void>) {
    while (this.held.has(name)) {
      await new Promise<void>((resolve) => {
        this.waiting.set(name, [...(this.waiting.get(name) ?? []), resolve])
      })
    }
    this.held.add(name)
    try {
      await callback()
    } finally {
      this.held.delete(name)
      const [next, ...rest] = this.waiting.get(name) ?? []
      this.waiting.set(name, rest)
      next?.()
    }
  }

  query() {
    return Promise.resolve({ held: [...this.held].map((name) => ({ name })), pending: [] })
  }

  reset() {
    this.held.clear()
    this.waiting.clear()
  }
}
