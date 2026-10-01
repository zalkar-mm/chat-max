import { expect, test } from '@playwright/test'

import { chatList, createChat, feed, replyTo, sendMessage, signIn } from './helpers'

test('E-01…E-05: вход → новый чат → отправка → ответ в том же чате со статусами → смена чата', async ({
  page,
}) => {
  // E-01: вход
  await signIn(page)

  // E-02: новый чат по номеру в «живом» написании
  await createChat(page, '8 999 123 45 67', '+7 999 123-45-67')

  // E-03: отправка — сообщение сразу в ленте, статус идёт вверх до «прочитано»
  await sendMessage(page, 'Привет')
  await expect(feed(page).getByText(', прочитано')).toBeVisible()

  // E-05: ответ собеседника в том же чате; имя из уведомления заменяет номер в шапке
  await expect(feed(page).getByText(replyTo('Привет'))).toBeVisible()
  await expect(page.getByRole('region', { name: 'Анна' })).toBeVisible()
  await expect(chatList(page).getByRole('button')).toHaveCount(1)

  // Смена чатов: второй чат пустой, возврат в первый — история на месте.
  // Мок выдаёт chatId по последним 8 цифрам, поэтому у второго номера другой хвост.
  await createChat(page, '+375 29 765-43-21', '+375 29 765-43-21')
  await expect(page.getByText('Напишите первое сообщение')).toBeVisible()
  await chatList(page).getByRole('button', { name: /Анна/ }).click()
  await expect(page.getByRole('region', { name: 'Анна' })).toBeVisible()
  await expect(feed(page).getByText(replyTo('Привет'))).toBeVisible()
  await expect(feed(page).getByText('Привет', { exact: true })).toBeVisible()
})
