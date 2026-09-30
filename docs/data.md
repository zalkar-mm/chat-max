# Данные — GREEN-API, запросы, состояние

Смежные темы: [architecture.md](architecture.md), [code-style.md](code-style.md), [testing.md](testing.md).
Источник требований — спринты в `design/` и `spints/`; здесь — как это устроено в коде.

## 1. Контракт GREEN-API

URL метода: `{apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}`.

| Метод                 | HTTP     | Где используется                     | Суть                                                            |
| --------------------- | -------- | ------------------------------------ | --------------------------------------------------------------- |
| `getStateInstance`    | `GET`    | вход, восстановление сессии, повторы | `{ stateInstance }` — статус инстанса                           |
| `checkAccount`        | `POST`   | создание чата                        | body `{ phoneNumber }` → есть ли аккаунт MAX и его `chatId`     |
| `sendMessage`         | `POST`   | отправка                             | body `{ chatId, message }` → `{ idMessage }`, текст ≤ 4000      |
| `receiveNotification` | `GET`    | получение (спринт 3)                 | long-poll `?receiveTimeout=N`; `null` или `{ receiptId, body }` |
| `deleteNotification`  | `DELETE` | получение (спринт 3)                 | `/{receiptId}` — подтвердить обработку                          |

Статусы инстанса: `authorized`, `suspended` (пускаем + баннер), `notAuthorized`, `starting`, `blocked`,
`pendingPassword` (блокирующие экраны). Неизвестное значение трактуем как `notAuthorized`.

- Отправка — **только по `chatId`** из `checkAccount`, не по номеру телефона.
- Точная форма ответов (`checkAccount`, уведомления MAX) фиксируется DTO-типами и zod-схемой
  в `entities/*/api/*-dto.ts`. Ответ сервера **валидируется** на входе: невалидный → `ApiError('unknown')`.
- `apiTokenInstance` — секрет: не логируем, не кладём в URL страницы, не показываем в текстах.

## 2. HTTP-клиент и ошибки

- Один axios-инстанс — `shared/api/green-api-client.ts`, `timeout: 15_000`. Второй `axios.create()` не заводим.
- Клиент не знает, где лежат креды: repository получает `credentials` аргументом.
  URL собирает `buildMethodUrl(credentials, method, suffix?)` из `shared/api/`.
- Любая ошибка транспорта приводится к `ApiError` (`shared/api/api-error.ts`) функцией `toApiError(error)`:

| `kind`          | Когда                                     |
| --------------- | ----------------------------------------- |
| `offline`       | `navigator.onLine === false` / нет ответа |
| `timeout`       | 15 с без ответа                           |
| `unauthorized`  | 401 / 403 без признака `suspended`        |
| `suspended`     | 403 с признаком ограничения аккаунта      |
| `badRequest`    | 400                                       |
| `quotaExceeded` | 466 — лимит тарифа                        |
| `checkLimit`    | 469 — лимит проверок номеров              |
| `rateLimited`   | 429                                       |
| `server`        | 5xx                                       |
| `aborted`       | запрос отменён — не ошибка для UI         |
| `unknown`       | всё остальное, невалидный ответ           |

- Текст для пользователя — **не в `ApiError`**. Каждая фича держит свою карту
  `Record<ApiErrorKind, string>` (тексты в спринтах разные для входа, создания чата и отправки).
- Сырой текст ответа сервера пользователю не показываем никогда.

## 3. Repository — только HTTP

```ts
// entities/session/api/session-repository.ts
export const sessionRepository = {
  getState: (credentials: Credentials, signal?: AbortSignal) =>
    greenApiClient
      .get<unknown>(buildMethodUrl(credentials, 'getStateInstance'), { signal })
      .then((r) => stateInstanceDtoSchema.parse(r.data)),
}
```

В repository **нельзя**: хуки React, тексты, маппинг DTO → модель, retry, доступ к сторам.
Модель — `model/*.types.ts`, маппер — `lib/`.

## 4. TanStack Query

- `QueryClient` — `app/providers/query-provider.tsx`: `queries: { retry: false, refetchOnWindowFocus: false }`,
  `mutations: { retry: 0 }`. Devtools — только в `import.meta.env.DEV`.
- Проверка кредов при входе, `checkAccount`, `sendMessage` — `useMutation` (действие пользователя, не кэш).
- Хук возвращает результат `useMutation`/`useQuery` как есть, без переупаковки.
- Если появляется `useQuery` — ключ только через фабрику `<entity>Keys`, `staleTime` задан осознанно.

## 5. Фоновые процессы — сервисы без React

Автоперепроверка `starting` (10 с × 30), очередь отправки, опрос уведомлений (спринт 3) — **не хуки и не `useEffect`-циклы**,
а модули `model/` с явным `start/stop`:

- Один экземпляр на процесс; повторный `start` без `stop` — no-op (StrictMode монтирует дважды).
- `AbortController` на процесс: `stop()`, выход из сессии и размонтирование обрывают запрос в полёте.
- Таймеры и зависимости (repository, `now`, `sleep`) передаются фабрике — сервис тестируется на фейковых таймерах.
- React подписывается на результат через стор; запускает/останавливает — эффект с очисткой или обработчик.

## 6. Zustand — клиентское состояние

| Стор                                      | Что хранит                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `entities/session/model/session.store.ts` | `credentials`, `remember`, `instanceState`, скрыт ли баннер `suspended` |
| `entities/chat/model/chat.store.ts`       | чаты `ids` + `byId`, `phone → chatId`, черновики по `chatId`            |
| `entities/message/model/message.store.ts` | сообщения: `idsByChat` + `byId`, статус и ошибка отправки               |
| `shared/lib/theme/theme.store.ts`         | тема `light` / `dark`                                                   |

- Форма — нормализованная (`ids` + `byId`), обновления иммутабельные.
- Компоненты читают селекторами с узким результатом (примитив или стабильная ссылка), не весь стор.
- Действия стора — синхронные переходы. Асинхронность — в сервисах/хуках `model/`.
- Выход из сессии: остановить все сервисы → очистить все доменные сторы → `queryClient.clear()` → удалить креды.

### Учётные данные и «Запомнить меня»

- Сохраняется один объект `{ idInstance, apiTokenInstance, apiUrl }` — **только** при статусе `authorized`/`suspended`.
- «Запомнить меня» выключен → `sessionStorage` (до закрытия вкладки), включён → `localStorage`.
  Хранилище выбирает `persist` Zustand через свой `StateStorage`, при смене режима вторая копия удаляется.
- При старте креды не принимаются на веру: сплэш → `getStateInstance` → по статусу. Неверные креды — удаляем,
  нет сети — **не** удаляем.
- Бэкенда нет, httpOnly-cookie невозможны: ключ пользователя живёт в его браузере — это осознанный компромисс.
- Чаты и сообщения до спринта 3 не персистятся.
- Тема — `localStorage` (`max-chat:theme`), дефолт — `prefers-color-scheme`. Выставляется inline-скриптом в
  `index.html` до рендера, чтобы не мигала.

## 7. Моки

- MSW (`src/mocks/`) — единственный способ мокать GREEN-API: в тестах (`msw/node`) и в dev (`VITE_API_MOCKS=true`).
- В dev-моках сценарий выбирается `idInstance` (таблица в `src/mocks/README.md`): так на демо показываются
  все ошибочные статусы без реального инстанса.
- В prod-сборку моки не попадают (динамический импорт под `import.meta.env.DEV`).

## Что запрещено

- ❌ Методы GREEN-API сверх перечисленных без обновления этого файла.
- ❌ Прямой вызов axios из `features`/`widgets`/`pages` — ESLint; второй axios-инстанс — ревью.
- ❌ Ответ сервера без валидации схемой, сырой текст ответа в UI — ревью.
- ❌ Тексты ошибок в `ApiError` или repository — ревью.
- ❌ Фоновый процесс в `useEffect`-цикле, без `stop` и `AbortController` — тест, ревью.
- ❌ `apiTokenInstance` в логах, URL страницы, текстах — тест, ревью.
- ❌ Сохранение кредов до успешной проверки статуса — тест.
