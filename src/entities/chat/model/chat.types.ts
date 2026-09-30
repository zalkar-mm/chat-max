export type ChatId = string

export type Chat = {
  id: ChatId
  /** Только цифры: `79991234567`. */
  phone: string
  /** Номер для показа: `+7 999 123-45-67`. */
  title: string
  createdAt: number
  lastActivityAt: number
}
