# MAX-чат — GREEN-API

Тестовое задание: веб-интерфейс для отправки и получения текстовых сообщений в MAX
через [GREEN-API](https://green-api.com/max). Прототип интерфейса — [web.max.ru](https://web.max.ru/).

## Запуск

Нужен Node.js 22+.

```bash
npm install
npm run dev                          # реальный GREEN-API
VITE_API_MOCKS=true npm run dev      # моки: все статусы и ошибки без инстанса
```

Вход — `idInstance` и `apiTokenInstance` из [личного кабинета](https://console.green-api.com).
Адрес API по умолчанию — `https://3100.api.green-api.com`; если у инстанса другой, его можно
указать в блоке «Дополнительно». Сценарии моков — [src/mocks/README.md](src/mocks/README.md).

## Что готово

**Спринт 1 — вход и каркас**

- Вход с проверкой `getStateInstance`, понятные экраны для `notAuthorized`, `starting`
  (автоперепроверка 10 с × 30), `blocked`, `pendingPassword`, ошибки 401/429/5xx/офлайн/таймаут.
- «Запомнить меня»: `sessionStorage` или `localStorage`; при старте сохранённые данные проверяются
  заново (сплэш без мигания формы).
- Выход с полной очисткой, главный экран в раскладке web.max.ru (две колонки / одна на мобильном).
- Баннеры «Нет соединения», «Аккаунт ограничен», «Соединение восстановлено».
- Экран «Что-то пошло не так» вместо белого экрана. Светлая и тёмная тема.

## Скрипты

| Команда            | Что делает                              |
| ------------------ | --------------------------------------- |
| `npm run dev`      | dev-сервер                              |
| `npm run build`    | проверка типов и production-сборка      |
| `npm run preview`  | локальный просмотр сборки               |
| `npm run check`    | typecheck + lint + format:check + тесты |
| `npm test`         | тесты (Vitest + Testing Library + MSW)  |
| `npm run lint:fix` | ESLint с автоисправлением               |

## Стек и правила

React 19, TypeScript (strict), Vite, Tailwind CSS v4 поверх токенов дизайна, Radix UI, TanStack Query,
Zustand, React Router, react-hook-form + zod, Vitest, MSW. Архитектура — Feature-Sliced Design.

Правила разработки — [`docs/`](docs/README.md), дизайн — [`design/`](design/DESIGN.md).
