import { expect, test } from '@playwright/test'

import { AUTHORIZED_ID, chatList, createChat, feed, replyTo, sendMessage, signIn } from './helpers'

test('F5 сохраняет сессию и историю переписки', async ({ page }) => {
  await signIn(page)
  await createChat(page, '79991234567', '+7 999 123-45-67')
  await sendMessage(page, 'До перезагрузки')
  await expect(feed(page).getByText(replyTo('До перезагрузки'))).toBeVisible()
  await expect(feed(page).getByText(', прочитано')).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible()
  await chatList(page).getByRole('button', { name: /Анна/ }).click()
  await expect(feed(page).getByText('До перезагрузки', { exact: true })).toBeVisible()
  await expect(feed(page).getByText(replyTo('До перезагрузки'))).toBeVisible()
  await expect(feed(page).getByText(', прочитано')).toBeVisible()
})

test('выход очищает всё: после повторного входа история пуста', async ({ page }) => {
  await signIn(page)
  await createChat(page, '79991234567', '+7 999 123-45-67')
  await sendMessage(page, 'Секретная переписка')

  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
  await expect(page.getByLabel('idInstance')).toHaveValue('')
  // В хранилищах браузера не осталось ни кредов, ни истории.
  const stored = await page.evaluate(() => ({
    local: Object.keys(localStorage).filter((key) => key.startsWith('max-chat:session')),
    session: Object.keys(sessionStorage).length,
  }))
  expect(stored).toEqual({ local: [], session: 0 })

  await signIn(page, AUTHORIZED_ID)
  await expect(page.getByText('Здесь появятся ваши чаты')).toBeVisible()
  await expect(chatList(page).getByRole('button', { name: /Секретная|\+7 999/ })).toHaveCount(0)
})
