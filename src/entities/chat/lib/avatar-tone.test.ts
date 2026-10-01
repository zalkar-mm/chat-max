import { describe, expect, it } from 'vitest'

import { AVATAR_TONES, getAvatarTone } from './avatar-tone'

describe('getAvatarTone', () => {
  it('для одного chatId всегда возвращает один цвет', () => {
    const chatId = '79991234567@c.us'
    expect(getAvatarTone(chatId)).toBe(getAvatarTone(chatId))
    expect(AVATAR_TONES).toContain(getAvatarTone(chatId))
  })

  it('распределяет разные чаты по всем цветам', () => {
    const tones = new Set(
      Array.from({ length: 50 }, (_, index) => getAvatarTone(`1${String(index).padStart(8, '0')}`)),
    )
    expect(tones.size).toBe(AVATAR_TONES.length)
  })
})
