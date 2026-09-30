# Code Style

Смежные темы: [architecture.md](architecture.md), [ui.md](ui.md).

Форматирование — Prettier (`semi: false`, одинарные кавычки, `printWidth: 100`, trailing commas).
О форматировании не спорим: `npm run format`.

## 1. Нейминг

| Что                    | Как                                         | Пример                                   |
| ---------------------- | ------------------------------------------- | ---------------------------------------- |
| Файлы и папки          | kebab-case                                  | `message-bubble.tsx`, `send-message/`    |
| Компоненты             | PascalCase, **именованный** экспорт         | `export function MessageBubble`          |
| Хуки                   | файл `use-x.ts`, экспорт `useX`             | `use-send-message.ts` → `useSendMessage` |
| Стор Zustand           | `<name>.store.ts`, экспорт `use<Name>Store` | `session.store.ts` → `useSessionStore`   |
| Страница               | `<name>.page.tsx`                           | `chat.page.tsx`                          |
| Типы                   | PascalCase, без `I`/`T`                     | `Message`, `MessageBubbleProps`          |
| Пропсы                 | именованный тип `XProps`                    | `type MessageBubbleProps`                |
| Справочники `as const` | PascalCase-объект или SCREAMING_SNAKE       | `MessageStatus`, `ROUTES`                |
| Булевы                 | `is/has/can/should`                         | `isOutgoing`                             |
| Проп-обработчик        | `on[Action]`                                | `onSend`                                 |
| Локальный обработчик   | `handle[Action]`                            | `handleSend`                             |

- Экспорт по умолчанию не используем. Исключение — то, что требует инструмент (`vite.config.ts`).
- `index.tsx` как имя компонента не используем. shadcn-файлы — как сгенерил CLI (`button.tsx`).

## 2. SOLID на практике

- **SRP.** Компонент либо отображает, либо оркестрирует данные, либо обрабатывает форму.
- **OCP.** Ветвление по справочнику (статус, направление, тип уведомления) — `Record<Key, Value>`,
  не `if`/`switch`-цепочка. Новое значение ломает компиляцию там, где карта неполна.
- **ISP.** Компоненту нужен статус — он принимает `status`, а не всё сообщение.
- **DIP.** `UI → хук → repository → http-клиент`. Транспорт не знает про роутер и сторы.

## 3. TypeScript

- `strict`, `noUncheckedIndexedAccess` — не ослаблять.
- **Вместо `any`** — `unknown` и сужение (type guard / zod).
- **Вместо `as`** — type guard, discriminated union, `satisfies`. Разрешено: `as const`.
  Любой другой `as` — только с `// eslint-disable-next-line` и причиной рядом.
- **Вместо `!`** — явная проверка и понятная ошибка.
- **Вместо `enum`** — объект `as const`:
  ```ts
  export const MessageDirection = { Incoming: 'incoming', Outgoing: 'outgoing' } as const
  export type MessageDirection = (typeof MessageDirection)[keyof typeof MessageDirection]
  ```
- **Невозможные состояния непредставимы.** Статус — discriminated union по `kind`/`status`,
  а не набор опциональных полей.
- Исчерпывающий `switch` по union — только где ветке нужно сужение типа; `default` → `assertNever`.
- `type`, а не `interface`.
- `T | null` и обязательное поле — если читатель обязан проверить. `?:` — для действительно необязательного.
- ID — всегда `string` (`idMessage`, `chatId`, `receiptId` — строка, даже если выглядит как число;
  `receiptId` приходит числом — приводим в маппере).

## 4. React

- Компоненты — функции. **Хук после раннего `return` запрещён.**
- `useEffect` — только синхронизация с внешней системой (подписка, таймер, опрос) и **всегда с очисткой**.
- Загрузка данных в `useEffect` компонента запрещена — только через хуки/сервисы `entities`.
- Производное значение считается при рендере, а не кладётся в `useState` через эффект.
- Сброс состояния при смене сущности — `key`, а не эффект.
- `key` — стабильный id, никогда индекс.
- React Context — только для статики и провайдеров библиотек. Состояние — Zustand.
- StrictMode не отключается.

### Мемоизация

`memo`/`useMemo`/`useCallback` профилактически не ставим. Только при замеренной проблеме
(профилировщик) или когда проп уходит в `memo`-ребёнка.

## 5. JSX без JS

В разметке — только чтение переменных и полей. Всё остальное считается в теле компонента.

- ❌ **Тернарки и `&&` в JSX** — ни одного условного выражения в разметке (`&&` роняет `0` и `""`).
  Варианты: ранний `return`, `Record`-карта состояний, `<Gate when>` из `shared/ui/gate` [инфра].
  ```tsx
  if (isLoading) return <Spinner />
  if (!messages.length) return <EmptyChat />
  return <MessageList messages={messages} />
  ```
  ```tsx
  <Gate when={isOutgoing}>
    <CheckIcon />
  </Gate>
  ```
- ❌ **Вычисления в атрибутах.** Шаблонные строки, вызовы, сравнения, `cn(...)` — в константу:
  ```tsx
  const bubbleCn = cn('rounded-lg px-3 py-2', isOutgoing && 'bg-primary text-primary-foreground')
  return <div className={bubbleCn}>{text}</div>
  ```
- ❌ **Инлайн-функции и вызовы в обработчиках `onX`** (`onClick={() => onOpen(id)}`, `onClick={make(id)}`) —
  объявляем `handleX` в теле.
  Обработчик без своей логики не оборачиваем: `onClick={onClick}`.
  Обработчик с аргументом внутри `.map` — повод вынести подкомпонент.

## 6. Магические значения

- Роуты — `ROUTES` ([architecture §5](architecture.md#5-роутинг)). Ключи запросов — только фабрики.
- Цвета, отступы, размеры — только токены Tailwind-темы ([ui §1](ui.md#1-tailwind-v4)).
- Интервалы, лимиты (`receiveTimeout`, длина сообщения 4000) — именованные константы.

## 7. Ошибки

- Ошибки домена — типизированные значения (`ApiError` с `kind`/`status`), не `throw new Error('строка')`.
- `catch (error)` — `error: unknown`, сужаем перед использованием.
- `AbortError` — не ошибка: не показываем пользователю.
- `console.log` запрещён; `console.error` — только для реальных ошибок.

## 8. Комментарии

Код без комментариев «что делает» — имя должно это говорить. Комментарий — только «почему»
(неочевидное ограничение API, обход бага) и директивы инструментов.

## Что запрещено

- ❌ `any`, `as` (кроме `as const`), `!`, `@ts-ignore`, `enum` — ESLint.
- ❌ Тернарка и `&&` в JSX, вложенные тернарки, инлайн-функция/вызов в `onX` — ESLint (`no-restricted-syntax`, `no-nested-ternary`).
- ❌ Неисчерпывающий `switch` по union — ESLint (`switch-exhaustiveness-check`).
- ❌ Хук после раннего `return`, `setState` в эффекте — ESLint (`react-hooks`).
- ❌ Загрузка в `useEffect`, эффект без очистки — ревью.
- ❌ `console.log`, default export, `key={index}`, `alert/confirm/prompt` — ESLint.
- ❌ Профилактическая мемоизация, справочник `switch`-цепочкой — ревью.
- Soft (флаг ревью): файл > 300 строк, > 3 `useEffect` в компоненте, > 8 пропсов, дублирование логики.
