export type ChatId = string

export type Chat = {
  id: ChatId
  /** Только цифры: `79991234567`. null — номер неизвестен (чат пришёл входящим без номера). */
  phone: string | null
  /** Имя собеседника из MAX (контакт, профиль). null — известен только номер. */
  name: string | null
  /** Название для показа: имя → номер `+7 999 123-45-67` → идентификатор. */
  title: string
  unreadCount: number
  createdAt: number
  lastActivityAt: number
}
