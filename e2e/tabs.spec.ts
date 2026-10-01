import { expect, test } from '@playwright/test'

import { AUTHORIZED_ID, createChat, FAKE_TOKEN, feed, replyTo, sendMessage } from './helpers'

const STUB = 'Приложение открыто в другой вкладке'

test('две вкладки: работает последняя открытая, «Использовать здесь» переключает обратно', async ({
  context,
}) => {
  const first = await context.newPage()
  await first.goto('/')
  await first.getByLabel('idInstance').fill(AUTHORIZED_ID)
  await first.getByLabel('apiTokenInstance').fill(FAKE_TOKEN)
  // Вкладки делят сессию только через localStorage («Запомнить меня»).
  await first.getByText('Запомнить меня').click()
  await first.getByRole('button', { name: 'Войти' }).click()
  await createChat(first, '79991234567', '+7 999 123-45-67')

  const second = await context.newPage()
  await second.goto('/')
  await expect(second.getByRole('heading', { name: 'Чаты' })).toBeVisible()
  await expect(first.getByRole('heading', { name: STUB })).toBeVisible()
  await expect(first).toHaveTitle('MAX-чат — неактивна')
  // История, записанная первой вкладкой, — во второй.
  await expect(second.getByRole('button', { name: /\+7 999 123-45-67/ })).toBeVisible()

  await first.getByRole('button', { name: 'Использовать здесь' }).click()
  await expect(second.getByRole('heading', { name: STUB })).toBeVisible()
  await first.getByRole('button', { name: /\+7 999 123-45-67/ }).click()
  await sendMessage(first, 'Снова здесь')
  await expect(feed(first).getByText(replyTo('Снова здесь'))).toBeVisible()
})
