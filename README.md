# MAX Chat — GREEN-API

Тестовое задание: веб-интерфейс для отправки и получения текстовых сообщений в мессенджере MAX
через [GREEN-API](https://green-api.com/max). Прототип UI взят с [web.max.ru](https://web.max.ru/).

- Отправка: [SendMessage](https://green-api.com/v3/docs/api/sending/SendMessage/)
- Получение: [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/)
  (ReceiveNotification / DeleteNotification)

## Стек

React 19, TypeScript (strict), Vite, Vitest + Testing Library, oxlint, Prettier.

## Запуск

Нужен Node.js 22+.

```bash
npm install
npm run dev
```

## Скрипты

| Команда             | Что делает                              |
| ------------------- | --------------------------------------- |
| `npm run dev`       | dev-сервер                              |
| `npm run build`     | проверка типов и production-сборка      |
| `npm run preview`   | локальный просмотр сборки               |
| `npm run typecheck` | `tsc -b`                                |
| `npm run lint`      | oxlint                                  |
| `npm run format`    | Prettier                                |
| `npm test`          | тесты (Vitest)                          |
| `npm run check`     | typecheck + lint + format:check + тесты |

## Правила разработки

Архитектура, код-стайл, работа с GREEN-API, UI, тесты и процесс — в [`docs/`](docs/README.md).
