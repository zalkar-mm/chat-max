import { expect, test } from '@playwright/test'

import { createChat, feed, replyTo, sendMessage, signIn } from './helpers'

test('офлайн → онлайн: события, пришедшие без сети, догружаются после переподключения', async ({
  page,
  context,
}) => {
  await signIn(page)
  await createChat(page, '79991234567', '+7 999 123-45-67')
  await sendMessage(page, 'Ты тут?')
  // Ответ «Анны» приходит в очередь через ~1,6 с после отправки — сеть пропадает раньше.
  await expect(feed(page).getByText(', отправлено')).toBeVisible()
  await context.setOffline(true)

  await expect(page.getByText('Нет соединения. Переподключаемся…')).toBeVisible()
  // Ждём, пока собеседник «ответит» и «прочитает»: без сети в ленту это попасть не должно.
  await page.waitForTimeout(3_500)
  await expect(feed(page).getByText(replyTo('Ты тут?'))).toBeHidden()

  await context.setOffline(false)
  await expect(page.getByText('Соединение восстановлено')).toBeVisible()
  await expect(feed(page).getByText(replyTo('Ты тут?'))).toBeVisible()
  await expect(feed(page).getByText(', прочитано')).toBeVisible()
})

test('повторная доставка уведомления → в ленте одно сообщение', async ({ page }) => {
  await signIn(page)
  await createChat(page, '79991234567', '+7 999 123-45-67')
  // #dup: мок кладёт один и тот же ответ в очередь дважды (src/mocks/README.md).
  await sendMessage(page, 'Привет #dup')

  // «Прочитано» приходит после обоих дублей — к этому моменту оба обработаны.
  await expect(feed(page).getByText(', прочитано')).toBeVisible()
  await expect(feed(page).getByText(replyTo('Привет #dup'))).toHaveCount(1)
})
