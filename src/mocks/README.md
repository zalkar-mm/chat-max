# Моки GREEN-API (MSW)

Dev-режим с моками: `VITE_API_MOCKS=true npm run dev`. Любой токен, кроме `wrong`, считается верным.
Сценарий выбирают **последние две цифры `idInstance`**:

| Окончание | `getStateInstance`                         |
| --------- | ------------------------------------------ |
| `01`      | `authorized` (и всё, что не в таблице)     |
| `02`      | `suspended` — баннер «Аккаунт ограничен»   |
| `03`      | `notAuthorized`                            |
| `04`      | `starting` → через 3 проверки `authorized` |
| `05`      | `blocked`                                  |
| `06`      | `pendingPassword`                          |
| `07`      | `starting` навсегда — таймаут автопроверки |
| `29`      | HTTP 429                                   |
| `50`      | HTTP 500                                   |
| `99`      | ответ через 20 с — таймаут клиента (15 с)  |

Токен `wrong` → HTTP 401 «Неверный idInstance или apiTokenInstance». Офлайн — вкладка Network в DevTools.
