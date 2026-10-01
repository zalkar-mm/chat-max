export const AVATAR_TONES = ['sky', 'violet', 'coral', 'green', 'orange'] as const
export type AvatarTone = (typeof AVATAR_TONES)[number]

/** djb2: у одного chatId всегда один цвет, между чатами цвета распределены. */
function hashString(value: string): number {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0
  }
  return hash
}

export function getAvatarTone(chatId: string): AvatarTone {
  return AVATAR_TONES[hashString(chatId) % AVATAR_TONES.length] ?? 'sky'
}
