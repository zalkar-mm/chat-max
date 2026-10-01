import { expect, type Page } from '@playwright/test'

/**
 * Хелперы e2e на моке API (`VITE_API_MOCKS=true`). Сценарии моков — src/mocks/README.md:
 * окончание idInstance выбирает статус инстанса, метка в тексте — ответ собеседника.
 */

/** Окончание `01` — инстанс `authorized`. Токен — заведомо фейковый. */
export const AUTHORIZED_ID = '1100000001'
export const FAKE_TOKEN = 'token'

export const feed = (page: Page) => page.getByRole('log', { name: 'Сообщения' })
export const chatList = (page: Page) => page.getByRole('navigation', { name: 'Чаты' })

export async function fillSignIn(page: Page, idInstance: string, token = FAKE_TOKEN) {
  await page.getByLabel('idInstance').fill(idInstance)
  await page.getByLabel('apiTokenInstance').fill(token)
  await page.getByRole('button', { name: 'Войти' }).click()
}

export async function signIn(page: Page, idInstance = AUTHORIZED_ID) {
  await page.goto('/')
  await fillSignIn(page, idInstance)
  await expect(page.getByRole('heading', { name: 'Чаты' })).toBeVisible()
}

/** «Новый чат» по номеру; мок checkAccount находит любой номер, кроме оканчивающихся на 0000/4xx0/5000. */
export async function createChat(page: Page, phone: string, title: string) {
  await page.getByRole('button', { name: 'Новый чат' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Новый чат' })
  await dialog.getByLabel('Номер телефона').fill(phone)
  await dialog.getByRole('button', { name: 'Создать чат' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('region', { name: title })).toBeVisible()
}

export async function sendMessage(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'Сообщение' }).fill(text)
  await page.keyboard.press('Enter')
  await expect(feed(page).getByText(text, { exact: true })).toBeVisible()
}

/** Текст dev-ответа собеседника «Анны» на отправленное сообщение (src/mocks/dev-replies.ts). */
export const replyTo = (text: string) => `Ответ на «${text}»`
