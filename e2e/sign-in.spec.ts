import { expect, test } from '@playwright/test'

import { fillSignIn } from './helpers'

test('неверные учётные данные → текст ошибки 401, поля не очищаются', async ({ page }) => {
  await page.goto('/')
  await fillSignIn(page, '1100000001', 'wrong')

  await expect(page.getByRole('alert')).toHaveText('Неверный idInstance или apiTokenInstance')
  await expect(page.getByLabel('idInstance')).toHaveValue('1100000001')
  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeHidden()
})

test('notAuthorized → «Проверить снова» → authorized: вход без перезагрузки', async ({ page }) => {
  await page.goto('/')
  // Окончание 08: первая проверка notAuthorized, следующие — authorized (src/mocks/README.md).
  await fillSignIn(page, '1100000008')

  await expect(page.getByRole('heading', { name: 'Инстанс не подключён к MAX' })).toBeVisible()
  await page.getByRole('button', { name: 'Проверить снова' }).click()

  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible()
})
