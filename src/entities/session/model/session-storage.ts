import { z } from 'zod'

import type { Credentials } from '@/shared/api/credentials'

const STORAGE_KEY = 'max-chat:session'

const storedCredentialsSchema = z.object({
  idInstance: z.string().min(1),
  apiTokenInstance: z.string().min(1),
  apiUrl: z.string().min(1),
})

export type StoredSession = {
  credentials: Credentials
  remember: boolean
}

function read(storage: Storage): Credentials | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed = storedCredentialsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function remove(storage: Storage) {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Хранилище недоступно — удалять нечего.
  }
}

/** «Запомнить меня» включён — localStorage (между запусками), выключен — sessionStorage (до закрытия вкладки). */
export function readStoredSession(): StoredSession | null {
  const remembered = read(localStorage)
  if (remembered) return { credentials: remembered, remember: true }

  const current = read(sessionStorage)
  if (current) return { credentials: current, remember: false }

  return null
}

export function saveStoredSession({ credentials, remember }: StoredSession) {
  const target = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  remove(other)
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(credentials))
  } catch {
    // Хранилище недоступно (приватный режим) — сессия живёт до перезагрузки.
  }
}

export function clearStoredSession() {
  remove(localStorage)
  remove(sessionStorage)
}
