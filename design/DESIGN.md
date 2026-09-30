# Дизайн-система «MAX-like chat» (тестовое GREEN-API)

Источник: реальные CSS-токены web.max.ru, тема `simple`, схемы light/dark, масштаб `medium`.
Токены в коде: `src/styles/tokens.css`. Всё ниже — правила их применения. Целевая ширина 1280+, обе темы.

## 1. Принципы
- Копируем внешний вид MAX, не изобретаем. Минимум функций (ТЗ п.4): логин → список чатов → диалог → текст.
- Один акцент `--accent #007aff`. Никаких других цветных элементов кроме статусов (positive/negative).
- Иконки: линейные, 24px, `--icon-primary/secondary`, stroke 1.75–2px. Набор: search, plus, send, arrow-left, more (⋯), sun/moon, logout, check, double-check, clock, alert.
- Все интерактивные элементы ≥ 40×40 px хит-зона. Фокус: outline 2px `--accent`, offset 2px.

## 2. Типографика (Roboto / system)
| Роль | Токен | Где |
|---|---|---|
| Hero 28/32 600 | `--font-hero` | заголовок экрана логина |
| Header 24/28 600 | `--font-header` | пустое состояние |
| Title 17/24 600 | `--font-title` | имя контакта в шапке чата, заголовок модалки |
| Body 15/20 400 | `--font-body` | текст сообщений, инпуты, имя в ячейке чата |
| Body strong 15/20 500 | `--font-body-strong` | имя в ячейке при непрочитанном |
| Detail 14/16 400 | `--font-detail` | превью последнего сообщения |
| Description 12/14 400 | `--font-description` | время в списке чатов, hint под инпутом |
| Bubble label 12/16 400 | `--font-bubble-label` | время внутри пузыря |
| Action large 17/20 500 | `--font-action-large` | primary-кнопка |

## 3. Сетка / лейаут
```
┌──────────────┬───────────────────────────────────┐
│ ChatList     │ Conversation                      │
│ 393px        │ flex 1 (min 540)                  │
│ bg-primary   │ bg-chat                           │
│ border-right │                                   │
│ 1px divider  │  Header 56 → Messages → Writebar  │
└──────────────┴───────────────────────────────────┘
```
- Фон окна `--bg-surface`; панели `--bg-primary`; область сообщений `--bg-chat`.
- Список чатов: ширина 393, min 260, max 592 (можно фиксировать 393 — ТЗ не требует ресайз).
- Зона сообщений центрируется, max-width 791px, паддинги 16px по бокам.
- < 900px: одна панель (список ИЛИ диалог), кнопка «назад» в шапке. Не обязательно, но дёшево.

## 4. Компоненты

### 4.1 Button
- Primary: h 48 (large) / 40 (medium), radius 12, bg `--accent`, text `--text-inverse`, `--font-action-large`; hover `--accent-hover`, pressed `--accent-pressed`, disabled `--button-primary-disabled` + text 60%.
- Secondary: bg `--button-secondary`, text `--text-primary`.
- Ghost/Icon: 40×40, radius 12, прозрачная; hover `--ghost-hover`, pressed `--ghost-pressed`, иконка `--icon-secondary` → hover `--icon-primary`.
- Loading: спиннер 20px вместо текста, ширина не прыгает.

### 4.2 Input / TextField
- h 48, radius 12, bg `--input-bg`, без бордера; padding 0 16; `--font-body`; placeholder `--text-tertiary`.
- Focus: box-shadow 0 0 0 2px `--accent` (inset не нужно). Error: shadow `--negative`, hint под полем 12/14 `--negative`, gap 6.
- Label над полем: 12/16 `--text-secondary`, gap 6.

### 4.3 Avatar
- Круг, инициал(ы) 1–2 символа, белый текст 500. Градиент по хэшу номера из пар MAX:
  sky `#08d7f3→#5398ff`, violet `#bf97ff→#526eff`, coral `#ff48b6→#ff8a35`, green `#14e1d5→#03c722`, orange `#ffc93d→#ff832a` (угол 135°).
- Размеры: 48 в списке, 36 в шапке, 96 в пустом состоянии/модалке.

### 4.4 ChatCell (элемент списка)
- h 72, padding 12 16, gap 12, radius 16 внутри списка с внутренним паддингом 8 → «карточный» ховер как в MAX.
- Слева аватар 48. Справа колонка: строка 1 — имя (`--font-body`, при unread — strong) + время справа (`--font-description`, `--text-tertiary`); строка 2 — превью (`--font-detail`, `--text-secondary`, 1 строка, ellipsis) + бейдж unread справа (min 20×20, radius pill, bg `--counter-bg`, text 12/16 500 `--counter-text`, padding 0 6).
- Состояния: hover `--cell-hover`, pressed `--cell-pressed`, selected `--cell-selected` (имя остаётся `--text-primary`).

### 4.5 Conversation Header
- h 56, bg `--bg-primary`, border-bottom 1px `--divider-soft`, padding 0 16, gap 12.
- Аватар 36 + имя `--font-title` + под ним номер/статус `--font-description` `--text-tertiary`. Справа ghost-иконки (тема, ⋯).

### 4.6 Message Bubble
- max-width 480, min-width 72, padding 8 12 (текст) / низ 6; radius 16; `--font-body` для текста, `white-space: pre-wrap`, `overflow-wrap: anywhere`.
- Incoming: слева, bg `--bubble-in-bg`, text `--bubble-in-text`. Outgoing: справа, bg `--bubble-out-gradient` (fallback `--bubble-out-bg`), text `--bubble-out-text`.
- Стек подряд от одного автора: gap 2px, угол со стороны автора между сообщениями скругляется 6px (`--r-bubble-stack`); первое/последнее в стеке — 16. Между разными авторами gap 8, между группами по дате — 16.
- Мета внутри пузыря, inline-flex справа снизу: время `--font-bubble-label` цвет `--bubble-*-time`, у исходящих + статус-иконка 16px `--bubble-out-status`: clock = отправка, check = отправлено, double-check = доставлено/прочитано (если статус не отслеживаем — только check). Ошибка: иконка alert `--negative` слева от пузыря + tooltip «Не отправлено. Повторить».
- Разделитель даты: pill по центру, bg `--bg-tertiary` (в dark `#ffffff17`), text 12/16 500 `--text-secondary`, padding 4 12.

### 4.7 Writebar (ввод сообщения)
- Контейнер: bg `--bg-primary`, border-top 1px `--divider-soft`, padding 8 16, min-h 56, align-items flex-end.
- Textarea: bg `--input-bg`, radius 12, padding 10 14, `--font-body`, auto-grow до 6 строк, placeholder «Сообщение». Enter — отправить, Shift+Enter — перенос.
- Кнопка Send: 40×40 круг справа, bg `--accent`, иконка белая 20px; при пустом вводе — disabled (`--button-primary-disabled`) или скрыта — выбираем disabled (стабильнее). Gap между полем и кнопкой 8.

### 4.8 Modal (новый чат)
- Overlay `--overlay`; окно w 400, radius 20, bg `--modal`, padding 24, shadow 0 12px 40px rgba(0,0,0,.24).
- Заголовок `--font-title`, gap 16, поле телефона, снизу кнопки: Secondary «Отмена» + Primary «Создать», h 48, gap 8, растянуты 1:1.
- Esc/клик по оверлею закрывают. Фокус на поле при открытии.

### 4.9 Empty state (правая панель без выбранного чата)
- Центр: иконка 96 в круге `--bg-tertiary`, заголовок `--font-header`, подтекст `--font-body` `--text-secondary`, ниже Primary «Новый чат». Max-width 320, text-align center.

### 4.10 Toast / ошибки API
- Снизу по центру, bg `--modal` (dark) / `#17181c` (light — инверсный как в MAX counter-default), text `--text-inverse`/`#fff`, radius 12, padding 12 16, 12/16 → 14/20, авто-скрытие 4с. Для 401/403 — редирект на логин с toast «Неверные учётные данные».

## 5. Экраны
1. **Login** — центр экрана, карточка w 400 без рамки (как экран QR в MAX: чистый фон `--bg-surface`, контент по центру). Логотип-плашка 64, hero «Вход в GREEN-API», подтекст, два поля (idInstance, apiTokenInstance — с toggle-глазом), Primary «Войти» на всю ширину, ссылка «Где взять данные?» → green-api.com. Ошибка авторизации — hint под полями.
2. **Main** — двухпанельный лейаут (§3). Шапка списка: h 56, заголовок «Чаты» `--font-title`… справа ghost «+» (новый чат), тема, выход. Под шапкой — поиск (input h 40, radius 12, иконка search слева) — опционально, можно оставить на спринт 3.
3. **New chat** — модалка §4.8. Валидация: только цифры, 10–15 символов, нормализуем в `<digits>@c.us`.
4. **Conversation** — шапка + лента + writebar. При открытии — скролл вниз; при новых входящих, если пользователь не внизу — плавающая круглая кнопка «↓» 40 с бейджем.

## 6. Темы
- Переключение: `data-theme` на `<html>`, дефолт по `prefers-color-scheme`, сохраняем в localStorage. Иконка sun/moon в шапке списка.
- Ничего не хардкодим — только токены. Тени в dark заменяем на более тёмный фон + stroke `--stroke-tertiary`.

## 7. Доступность
- Контраст текста ≥ 4.5:1 (проверено: `#060708` на `#fff`, `#fff` на `#0070eb` = 4.6:1). Второстепенный текст ≥ 3:1.
- Все иконки-кнопки с `aria-label`. Лента сообщений `role="log" aria-live="polite"`. Модалка — focus-trap, `aria-modal`.
- `prefers-reduced-motion` → отключить transition.
