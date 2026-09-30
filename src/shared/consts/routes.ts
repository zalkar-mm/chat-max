export const ROUTES = {
  SIGN_IN: '/sign-in',
  CHATS: '/',
  CHAT: (chatId: string) => `/chat/${encodeURIComponent(chatId)}`,
  CHAT_PATTERN: '/chat/:chatId',
} as const
