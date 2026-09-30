# Дизайн-спека — Спринт 1: вход, сессия, каркас главного экрана

База: `design/DESIGN.md` (компоненты §4, токены `src/styles/tokens.css`). Здесь — только то, что нужно для задач 1–7.
Все размеры в px, все цвета — токены. Проверяем на 360 и 1440, обе темы.

## 0. Общее

### [DS:breakpoints]
| Диапазон | Раскладка |
|---|---|
| 320–899 | одна колонка: список ИЛИ чат, ширина 100% |
| 900–1279 | две колонки, сайдбар `--sidebar-w-narrow` 320 |
| ≥ 1280 | две колонки, сайдбар `--sidebar-w` 393 |
Минимальная поддерживаемая ширина 320. Горизонтального скролла нет нигде: `overflow-x: hidden` на `body` не используем, просто всё `max-width: 100%`, `min-width: 0` во flex-детях.

### Бренд
- Название: **MAX-чат**. Тайтл вкладки: `MAX-чат` (главный), `Вход — MAX-чат`, `Ошибка — MAX-чат`.
- Логотип (свой): квадрат 48×48 radius 14, фон `--accent`, внутри белая линейная иконка «речевой пузырь с двумя точками» 24px (stroke 2). Никаких форм логотипа MAX. Текстовый логотип рядом не нужен.
- Favicon — тот же квадрат 32×32.

### Новые компоненты (в дополнение к DESIGN.md §4)
**C1 Checkbox** — 20×20, radius 6, border 1.5px `--checkbox-border`, bg прозрачный; checked: bg `--accent`, галочка белая 14px; hover: border `--accent`; focus: outline 2px `--accent` offset 2. Лейбл `--font-body` `--text-primary` слева от чекбокса на расстоянии 12, кликабелен; подсказка под лейблом `--font-description` `--text-tertiary`, margin-top 2.

**C2 Disclosure («Дополнительно»)** — строка-кнопка h 40, `--font-action-small` `--text-link`, шеврон 16px справа от текста (gap 4), поворот 180° при раскрытии (`--t-base`). Раскрытая область: padding-top 8, содержимое — обычные поля. Атрибуты `aria-expanded`, `aria-controls`.

**C3 SecretField** — Input из DESIGN §4.2 + ghost-иконка 40×40 внутри справа (right 4), иконка eye / eye-off 20px `--icon-secondary`; `aria-pressed`, `aria-label` «Показать токен»/«Скрыть токен». Padding-right поля 48. Тип `password` ↔ `text`.

**C4 InlineAlert (ошибка сервера над кнопкой)** — bg `--alert-error-bg`, border-left 3px `--alert-error-border`, radius 12, padding 12 16, gap 12; иконка alert-circle 20 `--negative` сверху слева, текст `--font-detail` `--text-primary`, line-height 20. `role="alert"`. Появление: fade 120ms. Margin-bottom 16 до кнопки.

**C5 Spinner** — кольцо 20px stroke 2.5, `currentColor` 25% + сегмент 100%, вращение 800ms linear. Внутри Primary-кнопки — слева от текста, gap 8. Крупный вариант 32px для сплэша/статусов.

**C6 Banner** [DS:banner] — см. §6.

**C7 StatusScreen** (блокирующие экраны и «Что-то пошло не так») — вертикальный стек по центру, max-width 400, text-align center: иконка 64px в круге 96 (bg `--bg-tertiary`, иконка `--icon-secondary`; для ошибок иконка `--negative`, для ожидания — Spinner 32 `--accent` вместо иконки) → gap 24 → заголовок `--font-subheader` `--text-primary` → gap 8 → текст `--font-body` `--text-secondary` → gap 24 → кнопки (стек вертикальный, каждая на всю ширину, gap 8; первая Primary h 48, остальные Secondary/Ghost h 48). На desktop кнопок ≤ 2 можно в ряд 1:1 — но оставляем вертикальный стек везде, единообразнее.

## 1. S1 «Вход» [DS:S1]

### Каркас
- Фон страницы `--bg-surface`. Контент — карточка без рамки/тени (как экран QR в MAX), ширина `--auth-card-w` 400, по центру по обеим осям, `padding: 40px 0` (desktop) / `24px 16px` (mobile).
- На mobile 360: карточка = 100% − 32 (гуттер 16 с каждой стороны). Вертикально: контент прижат к верху с отступом 48 (не по центру — иначе прыгает при появлении клавиатуры).
- В правом верхнем углу экрана — ghost-иконка темы sun/moon 40×40 (offset 16/16). Единственный элемент вне карточки.

### Состав (сверху вниз, gap 24 между блоками, 16 между полями)
1. Логотип 48 по центру → gap 16 → заголовок `--font-hero` `--text-primary` «Вход» → gap 8 → подзаголовок `--font-body` `--text-secondary` «Войдите с данными инстанса GREEN-API». Всё по центру.
2. Поле idInstance: лейбл «idInstance» (`--font-label` 12/16 `--text-secondary`, gap 6) → Input h 48 → подсказка «Номер инстанса из личного кабинета GREEN-API» (`--font-description` `--text-tertiary`, gap 6). `inputmode="numeric"`, `autocomplete="off"`.
3. Поле apiTokenInstance: C3 SecretField, лейбл «apiTokenInstance», без подсказки. `autocomplete="off" spellcheck="false"`.
4. C2 Disclosure «Дополнительно» → внутри: поле «API URL», подсказка «Адрес сервера инстанса. Обычно менять не нужно».
5. C1 Checkbox «Запомнить меня», подсказка «Не включайте на чужом компьютере».
6. [место для C4 InlineAlert]
7. Primary «Войти», h 48, width 100%.
8. Ссылка «Где взять idInstance и токен?» — `--font-action-small` `--text-link`, по центру, margin-top 16, иконка external-link 14 справа (gap 4), `target=_blank rel=noopener`.

Порядок Tab: idInstance → токен → «глаз» → «Дополнительно» → (API URL если раскрыт) → чекбокс → «Войти» → ссылка → тема.

### Состояния полей (DESIGN §4.2 + уточнения)
| Состояние | Визуал |
|---|---|
| default | bg `--input-bg`, текст `--text-primary`, placeholder не используем (лейбл есть) |
| focus | box-shadow 0 0 0 2px `--accent` |
| filled | как default |
| error | box-shadow 0 0 0 2px `--negative`; подсказка заменяется текстом ошибки `--font-description` `--negative`; `aria-invalid`, `aria-describedby` → id ошибки. Ошибка появляется после blur (если поле трогали) или при submit |
| disabled (во время проверки) | opacity .6, `cursor: not-allowed`, курсор в поле не ставится |
Тексты ошибок — из задачи 1 дословно.

### Состояния кнопки «Войти»
- disabled (пусто хотя бы одно обязательное поле): bg `--button-primary-disabled`, текст `--text-inverse` 70%, cursor default.
- loading: bg `--accent`, C5 Spinner 20 белый + «Проверяем…», `aria-busy`, ширина не меняется (min-width равна ширине default).
- Enter в любом поле → submit.

### Ошибка сервера над кнопкой
C4 InlineAlert, тексты из таблицы задачи 2 (неверные креды / 429 / 5xx / офлайн / таймаут). Поля остаются заполнены. Скрывается при следующем изменении любого поля.

### Сообщение «Сессия недействительна» (задача 3)
Тот же C4, но нейтральный вариант: bg `--bg-tertiary`, без border-left, иконка info `--icon-secondary`, текст «Сессия недействительна, войдите снова». Показывается сразу при открытии, поля пустые.

### Экраны-состояния для макета S1
S1-a default (desktop, mobile) · S1-b focus idInstance · S1-c filled + токен показан · S1-d ошибки обоих полей · S1-e «Дополнительно» раскрыт · S1-f loading · S1-g InlineAlert «Неверный idInstance или apiTokenInstance» · S1-h «Сессия недействительна».

## 2. S1 Блокирующие статусы [DS:S1-states]

Тот же фон и карточка 400, что и S1, но вместо формы — C7 StatusScreen. Логотип 48 сверху сохраняется (gap 32 до иконки статуса). Иконка темы на месте.

| Статус | Иконка (в круге 96) | Заголовок | Текст | Кнопки (сверху вниз) |
|---|---|---|---|---|
| notAuthorized | qr-code, `--icon-secondary` | Инстанс не подключён к MAX | Отсканируйте QR-код в личном кабинете GREEN-API: MAX → Профиль → Устройства → Войти по QR-коду | Primary «Открыть личный кабинет» (external) · Secondary «Проверить снова» · Ghost «Изменить данные» |
| starting | C5 Spinner 32 `--accent` | Инстанс запускается | Обычно это занимает до 5 минут. Проверяем автоматически… | Ghost «Отмена» |
| starting → timeout (после 30 попыток) | clock, `--negative` | Инстанс долго не запускается | Перезапустите его в личном кабинете GREEN-API | Primary «Открыть личный кабинет» · Secondary «Проверить снова» · Ghost «Изменить данные» |
| blocked | ban, `--negative` | Аккаунт MAX заблокирован | Этот инстанс нельзя использовать для отправки сообщений | Secondary «Изменить данные» |
| pendingPassword | lock, `--icon-secondary` | Нужен пароль двухфакторной защиты | Завершите подключение инстанса в личном кабинете GREEN-API | Primary «Открыть личный кабинет» · Secondary «Проверить снова» |

- «Проверить снова» в loading: спиннер + «Проверяем…», остальные кнопки disabled.
- «Изменить данные» → S1 с сохранёнными значениями, фокус в idInstance.
- Под текстом у `starting` — строка `--font-description` `--text-tertiary` «Попытка 3 из 30» (обновляется), gap 8. Дёшево и снимает вопрос «а оно живое?».
- Переход между статусом и формой: crossfade 200ms.

## 3. Сплэш и «Нет соединения» при старте [DS:splash]

**Сплэш:** фон `--bg-surface`, по центру логотип 48, под ним (gap 24) C5 Spinner 24 `--icon-tertiary`. Ничего больше. Показ с задержкой 300ms (до неё — просто пустой `--bg-surface`), исчезновение — fade 150ms. Без текста — чтобы нечему было мигать.

**Нет соединения при старте:** C7 StatusScreen на фоне `--bg-surface`, иконка wifi-off `--icon-secondary`, заголовок «Нет соединения», текст «Проверьте интернет и попробуйте снова», Primary «Повторить» (loading-состояние как у «Войти»). Ghost «Выйти» не показываем — данные не удаляем по требованию задачи 3.

## 4. S2 «Главный экран — пусто» [DS:S2]

### Раскладка
```
desktop ≥900                          mobile <900
┌─────────┬──────────────────────┐    ┌──────────────┐
│ Sidebar │ Main                 │    │ Sidebar 100% │
│ 393/320 │ bg-chat              │    │              │
│ bg-prim │                      │    │              │
└─────────┴──────────────────────┘    └──────────────┘
```
Корень: `display:grid; grid-template-columns: var(--sidebar-w) 1fr; height: 100dvh`. Фон `--bg-surface`. Между колонками border-right 1px `--divider-soft` у сайдбара. Баннеры (§6) — строкой над гридом, на всю ширину, сдвигают его.

### Sidebar [DS:S2-sidebar]
- **Шапка** [DS:S2-header]: h 56, padding 0 8 0 16, bg `--bg-primary`, border-bottom 1px `--divider-soft`, flex, align center.
  - Слева: аватар-инициал 36 (первая цифра idInstance… нет — лучше иконка «server» в круге 36 bg `--bg-tertiary`, `--icon-secondary`; когда появится номер телефона — обычный Avatar с инициалом) → gap 12 → колонка: заголовок «Чаты» `--font-title`; под ним `idInstance` `--font-description` `--text-tertiary` (позже — номер), ellipsis.
  - Справа группа ghost-иконок 40×40, gap 0: «Новый чат» (pencil / edit-square, `aria-label` «Новый чат»), тема (sun/moon), «Выйти» (log-out, `aria-label` «Выйти»). На mobile — то же, всё помещается (360 − 16 − 36 − 12 − 120 − 8 = 168 на текст).
  - Без подтверждения выхода. Hover/pressed/focus по DESIGN §4.1 Ghost.
- **Область списка**: padding 8, `overflow-y: auto`. Пустое состояние (ST-01): по центру области (flex column, justify center, height 100%), max-width 280: иконка chat-bubbles 48 `--icon-tertiary` → gap 16 → «Здесь появятся ваши чаты» `--font-body-strong` `--text-primary` → gap 4 → «Начните переписку по номеру телефона» `--font-detail` `--text-secondary` → gap 16 → Primary medium h 40 «Начать новый чат». Всё по центру.

### Main (правая панель), чат не выбран (ST-02)
Фон `--bg-chat`. По центру: pill bg `--bg-tertiary`, padding 8 16, radius pill, текст «Выберите чат или начните новый» `--font-detail` `--text-secondary`. Ровно как в MAX/Telegram — одна плашка, без иллюстраций. На mobile панель не рендерится.

### Заглушка «Новый чат» (до спринта 2)
Modal по DESIGN §4.8, заголовок «Новый чат», текст `--font-body` `--text-secondary` «Появится в следующей версии», одна кнопка Secondary «Закрыть». Чтобы место под модалку было заложено уже сейчас.

### Экраны-состояния для макета S2
S2-a desktop 1440 пустой · S2-b mobile 360 пустой · S2-c фокус на «Новый чат» в шапке (outline) · S2-d с баннером warn · S2-e с двумя баннерами.

## 5. Выход [DS:S2-header]
Ghost-иконка log-out в шапке сайдбара (см. §4). Клик → мгновенно S1 (без анимации, поля пустые, фокус в idInstance). Ничего больше в UI не нужно.

## 6. Баннер [DS:banner]

- Полоса на всю ширину над гридом главного экрана, min-h `--banner-h` 40, padding 8 16, flex, align center, gap 12. Текст `--font-detail` `--text-primary`(= `--banner-*-fg`), иконка 20 слева, `×` (ghost 32×32, `aria-label` «Скрыть») справа только у закрываемых. Текст может переноситься на 2 строки на mobile — высота растёт.
- Разделение от контента: border-bottom 1px `--divider-soft`.
- Несколько баннеров — стек сверху вниз в порядке: error → warn → ok.

| Тип | bg | иконка | Текст | Закрытие | a11y |
|---|---|---|---|---|---|
| error | `--banner-error-bg` | wifi-off `--banner-error-icon` | Нет соединения. Переподключаемся… | авто, при возврате сети | `role="alert"` (assertive) |
| warn | `--banner-warn-bg` | alert-triangle `--banner-warn-icon` | Аккаунт MAX временно ограничен: сообщения можно отправлять только контактам | «×» до следующего входа, или при статусе `authorized` | `role="status"` (polite) |
| ok | `--banner-ok-bg` | check-circle `--banner-ok-icon` | Соединение восстановлено | авто через 3 с | `role="status"` |

Анимация: появление — высота 0→auto + fade 200ms; скрытие — то же обратно. `prefers-reduced-motion` → без анимации.

## 7. Экран «Что-то пошло не так» [DS:error-screen]
Полноэкранный, фон `--bg-surface`, C7 StatusScreen: иконка alert-octagon `--negative`, заголовок «Что-то пошло не так», текст «Попробуйте перезагрузить страницу. Если ошибка повторяется — выйдите и войдите снова», Primary «Перезагрузить», Secondary «Выйти». В dev-режиме под кнопками — C2 Disclosure «Подробности» с `<pre>` `--font-description` в блоке `--bg-tertiary` radius 12 padding 12, `max-height: 240`, scroll. В prod блока нет.

## 8. Иконки спринта (24px, stroke 2, линейные — Lucide-совместимые имена)
eye, eye-off, chevron-down, external-link, alert-circle, alert-triangle, alert-octagon, info, check, check-circle, qr-code, clock, ban, lock, wifi-off, sun, moon, log-out, edit (square-pen), message-circle, server, x.

## 9. Чек-лист сдачи дизайна спринта
- [ ] Все экраны из §1–7 в light и dark, 360 и 1440.
- [ ] Контраст текста ошибок: `--negative #ff303c` на `--bg-surface #edeef2` = 3.6:1 → для текста 12px недостаточно (нужно 4.5). Решение: текст ошибки под полем рисуем цветом `#d6262f` в light (добавить как `--text-negative-strong`), в dark оставляем `#ff6679`. Иконки/обводка — `--negative`.
- [ ] Токена нет в DOM вне поля (title/alt/data-атрибуты), нет в URL.
- [ ] Порядок Tab и `aria-*` по §1, §4, §6.
