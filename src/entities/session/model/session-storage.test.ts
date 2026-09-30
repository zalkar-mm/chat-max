import { describe, expect, it } from 'vitest'

import { clearStoredSession, readStoredSession, saveStoredSession } from './session-storage'

const credentials = {
  idInstance: '3100000001',
  apiTokenInstance: 'token',
  apiUrl: 'https://3100.api.green-api.com',
}

describe('session-storage', () => {
  it('без «Запомнить меня» пишет в sessionStorage', () => {
    saveStoredSession({ credentials, remember: false })
    expect(sessionStorage.getItem('max-chat:session')).not.toBeNull()
    expect(localStorage.getItem('max-chat:session')).toBeNull()
    expect(readStoredSession()).toEqual({ credentials, remember: false })
  })

  it('с «Запомнить меня» пишет в localStorage и удаляет копию из sessionStorage', () => {
    saveStoredSession({ credentials, remember: false })
    saveStoredSession({ credentials, remember: true })
    expect(sessionStorage.getItem('max-chat:session')).toBeNull()
    expect(readStoredSession()).toEqual({ credentials, remember: true })
  })

  it('битые данные в хранилище игнорирует', () => {
    localStorage.setItem('max-chat:session', '{"idInstance":1}')
    sessionStorage.setItem('max-chat:session', 'not json')
    expect(readStoredSession()).toBeNull()
  })

  it('очищает оба хранилища', () => {
    saveStoredSession({ credentials, remember: true })
    sessionStorage.setItem('max-chat:session', JSON.stringify(credentials))
    clearStoredSession()
    expect(readStoredSession()).toBeNull()
  })
})
