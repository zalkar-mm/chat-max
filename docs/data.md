# Данные — GREEN-API, запросы, состояние

Смежные темы: [architecture.md](architecture.md), [code-style.md](code-style.md), [testing.md](testing.md).

ТЗ ограничивает API тремя методами: **SendMessage**, **ReceiveNotification**, **DeleteNotification**.
Истории чатов с сервера нет — переписка копится на клиенте с момента входа.

## 1. Контракт GREEN-API

Базовый URL запроса: `{apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}`.

| Метод                 | HTTP     | Суть                                                                                     |
| --------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `sendMessage`         | `POST`   | body `{ chatId, message }` → `{ idMessage }`. Текст до 4000 символов                     |
| `receiveNotification` | `GET`    | `?receiveTimeout=N` — long-poll; `null`, если очередь пуста, иначе `{ receiptId, body }` |
| `deleteNotification`  | `DELETE` | `/{receiptId}` — подтвердить обработку и снять из очереди                                |

- `chatId` личного чата по номеру — `<цифры>@c.us` (`79991234567@c.us`). Сборка и нормализация номера —
  одна чистая функция в `entities/chat/lib/`, покрыта тестом.
- Очередь — FIFO, уведомление живёт 24 часа. **Пока не вызван `deleteNotification`, следующее не придёт.**
- В инстансе должен быть пустой `webhookUrl` и включены входящие уведомления — это настройка
  в кабинете GREEN-API, в README проекта для проверяющего.
- Точные имена `typeWebhook`/`typeMessage` и форма `body` для MAX сверяются с документацией
  при реализации и фиксируются DTO-типами в `entities/message/api/message-dto.ts`.

## 2. HTTP-клиент

- Один axios-инстанс — `shared/api/green-api-client.ts`. Второй `axios.create()` не заводим.
- Клиент не знает, где лежат учётные данные: repository получает `credentials` аргументом
  (`{ apiUrl, idInstance, apiTokenInstance }`). URL собирает одна функция `buildMethodUrl(credentials, method)`.
- Ошибки транспорта приводятся к `ApiError` (`shared/api/api-error.ts`): `kind: 'network' | 'unauthorized' | 'server' | 'aborted'`.
  401/403 от GREEN-API — `unauthorized` (неверный id/token).
- `apiTokenInstance` — секрет: не логируем, не кладём в URL страницы, не показываем в ошибках.

## 3. Repository — только HTTP

```ts
// entities/message/api/message-repository.ts
export const messageRepository = {
  send: (credentials: Credentials, input: SendMessageDto) =>
    greenApiClient
      .post<SendMessageResponseDto>(buildMethodUrl(credentials, 'sendMessage'), input)
      .then((r) => r.data),
  receive: (credentials: Credentials, signal: AbortSignal) => /* GET receiveNotification */,
  remove: (credentials: Credentials, receiptId: number) => /* DELETE deleteNotification */,
}
```

В repository **нельзя**: хуки React, `notify`, маппинг DTO → модель, retry, доступ к сторам.
DTO — как по сети (`idMessage`, `receiptId`, `typeWebhook`). Модель — в `model/*.types.ts`, маппер — в `lib/`.

## 4. Отправка — `useMutation`

- `entities/message/api/use-send-message.ts` — `useMutation` над `messageRepository.send`.
- Поток: добавить сообщение в стор со статусом `pending` → запрос → `sent` (с `idMessage`) или `failed`.
- Ошибка → `notify.apiError(error)` в `onError` на уровне `features/send-message/model`.
- `mutations.retry: 0` — повтор отправки только действием пользователя.

## 5. Получение — сервис опроса

Опрос — **не `useQuery`**: это бесконечный цикл с подтверждением, а не кэшируемые данные.

- Сервис без React: `entities/message/model/notification-poller.ts`, `start(credentials)` / `stop()`.
- Цикл: `receive` → если `null`, следующая итерация → иначе обработать → **всегда** `remove(receiptId)`,
  в том числе для неизвестных и нетекстовых уведомлений (иначе очередь встанет).
- Обработка: маппер уведомления → `Message | null`; текстовое — в стор, остальное — игнор.
- Дедуп по `idMessage`: своё отправленное сообщение может вернуться уведомлением.
- Один экземпляр цикла: повторный `start` без `stop` — no-op (StrictMode монтирует дважды).
- `AbortController` на цикл: `stop()` и выход из сессии обрывают запрос в полёте; `AbortError` — не ошибка.
- Сетевая ошибка — пауза с backoff (константы), не тугой цикл. `unauthorized` — остановка и выход из сессии.
- Запуск/остановка — явно, из `app/` по флагу сессии (эффект с очисткой), а не при импорте модуля.

## 6. TanStack Query

- `QueryClient` — `app/providers/query-provider.tsx`: `queries: { retry: 1, refetchOnWindowFocus: false }`,
  `mutations: { retry: 0 }`. Devtools — только в `import.meta.env.DEV`.
- Если появляется `useQuery` — ключ только через фабрику `<entity>Keys`, `staleTime` задан осознанно.
- Хук возвращает результат `useQuery`/`useMutation` как есть, без переупаковки в `{ data, loading }`.

## 7. Zustand — клиентское состояние

| Стор                                      | Что хранит                                                          |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `entities/session/model/session.store.ts` | `credentials: Credentials \| null`, производное `isAuthenticated`   |
| `entities/chat/model/chat.store.ts`       | чаты: `ids` + `byId` (id, номер, время последней активности)        |
| `entities/message/model/message.store.ts` | сообщения по чату: `byChatId: Record<ChatId, MessageId[]>` + `byId` |

- Форма — нормализованная (`ids` + `byId`), обновления иммутабельные.
- Компоненты читают через селекторы с узким результатом: `useMessageStore((s) => s.byId[id])`, не весь стор.
- Действия стора — синхронные чистые переходы. Асинхронность — в сервисах/хуках, не в сторе.
- Серверный кэш в Zustand не дублируем; URL-состояние (открытый чат) — в роуте, не в сторе.
- Выход: `stop()` опроса → очистка всех сторов → `queryClient.clear()` → переход на `ROUTES.SIGN_IN`.

**Открытый вопрос:** хранить ли `credentials` между перезагрузками (`sessionStorage`) или только в памяти.
Это продуктовое решение и компромисс с безопасностью секрета — решается по ТЗ, до этого — только память.

## Что запрещено

- ❌ Методы GREEN-API сверх ТЗ без согласования.
- ❌ Прямой вызов axios из `features`/`widgets`/`pages`; второй axios-инстанс — ESLint [инфра] / ревью.
- ❌ Забыть `deleteNotification` для любого полученного уведомления — тест.
- ❌ Второй параллельный цикл опроса, цикл без `AbortController` и без остановки — тест, ревью.
- ❌ `apiTokenInstance` в логах, URL страницы, текстах ошибок — ревью.
- ❌ Асинхронность в действиях стора, серверные данные в Zustand без причины — ревью.
- ❌ Строковый queryKey мимо фабрики — ревью.
