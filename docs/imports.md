# Импорты

Смежные темы: [architecture.md](architecture.md).

## 1. Основные правила

1. **Никаких barrel-файлов** (`index.ts` с реэкспортами) — нигде в `src/`.
2. Импорт идёт **сверху вниз по слоям** ([architecture §2](architecture.md#2-слои)).
3. Между слайсами одного слоя — запрещён.
4. **Между слоями и слайсами — алиас `@/`, внутри своего слайса — относительный путь.**
5. Алиас на собственный слайс запрещён: `entities/message/*` не импортирует себя через `@/entities/message/...`.

Алиас один — `@/*` → `src/*` (`tsconfig.app.json` + `vite.config.ts`). Никаких `~app`, `~features`.

## 2. Направление

| Из         | Может импортировать                         |
| ---------- | ------------------------------------------- |
| `app`      | всё                                         |
| `pages`    | `widgets`, `features`, `entities`, `shared` |
| `widgets`  | `features`, `entities`, `shared`            |
| `features` | `entities`, `shared`                        |
| `entities` | `shared` + себя (относительно)              |
| `shared`   | только `shared` (относительно)              |

## 3. Импорт конкретного файла

```ts
// ❌
import { Button } from '@/shared/ui'
import { useSendMessage, MessageBubble } from '@/entities/message'

// ✅
import { Button } from '@/shared/ui/button'
import { MessageBubble } from '@/entities/message/ui/message-bubble'
```

## 4. Публичная поверхность слайса без barrel

Снаружи слайса импортируется только предназначенное: `ui/`, хуки из `api/`, доменные типы и
хуки чтения из `model/`. Приватное — только внутри слайса:

```ts
import { messageRepository } from '@/entities/message/api/message-repository' // ❌ repository приватный
import { messageKeys } from '@/entities/message/api/message-keys' // ❌ ключи приватные
import { messageSchema } from '@/entities/message/model/message.schema' // ❌ схема приватная
```

Нужен repository снаружи — значит, в вызывающем коде делается то, что должно быть в хуке слайса.
Оборачивай в хук. Барьер держит ESLint `no-restricted-imports` / boundaries [инфра].

## 5. Порядок групп

Правит `simple-import-sort` автоматически [инфра]; группы через пустую строку:

```ts
import { useState } from 'react' // 1. react

import { useMutation } from '@tanstack/react-query' // 2. внешние пакеты
import { z } from 'zod'

import { ROUTES } from '@/shared/consts/routes' // 3. слои: app → … → shared

import { mapNotification } from '../lib/map-notification' // 4. относительные ../ и ./
import { messageKeys } from './message-keys'

import './styles.css' // 5. side-effect
```

## 6. type-only

```ts
import type { Message } from '@/entities/message/model/message.types'
import { type SendMessageInput, useSendMessage } from '../api/use-send-message' // тип и значение из одного файла
```

`verbatimModuleSyntax` включён — TypeScript сам требует `import type`.

## Что запрещено

- ❌ `index.ts`-barrel в `src/` — ESLint [инфра].
- ❌ Импорт вверх, кросс-импорт слайсов, приватных файлов чужого слайса — ESLint [инфра].
- ❌ Алиас на собственный слайс, второй алиас кроме `@/` — ревью.
- ❌ Неотсортированные импорты — ESLint `simple-import-sort` [инфра].
