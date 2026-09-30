# Дизайн-спека — Спринт 2: новый чат, список чатов, экран чата, отправка

База: `design/DESIGN.md` (§4.3 Avatar, §4.4 ChatCell, §4.5 Header, §4.6 Bubble, §4.7 Writebar, §4.8 Modal), `design/SPRINT-1.md` (C1–C7, брейкпоинты, баннеры), токены `src/styles/tokens.css`. Здесь — уточнения и то, чего там не было. 360 и 1440, обе темы.

## 1. S3 «Новый чат» [DS:S3]

### Контейнер
- **Desktop (≥900):** Modal по DESIGN §4.8 — w 400, radius 20, bg `--modal`, padding 24, overlay `--overlay`. Центр экрана. Открытие: overlay fade 150ms + окно scale .96→1 + fade 200ms.
- **Mobile (<900):** полноэкранная панель поверх списка, bg `--bg-primary`, `100dvh`. Шапка h 56 (как у сайдбара): ghost «×» слева 40×40 (`aria-label` «Закрыть»), заголовок «Новый чат» `--font-title`. Контент padding 16. Появление: slide-up 200ms.
- `role="dialog" aria-modal="true" aria-labelledby=<заголовок>`; focus-trap; Esc → закрыть (если не loading); фокус после закрытия → на кнопку-инициатор.

### Состав (desktop, сверху вниз)
1. Строка: заголовок «Новый чат» `--font-title` слева, ghost «×» 40×40 справа (margin −8 сверху/справа, чтобы визуально на краю паддинга). gap 16 вниз.
2. Поле «Номер телефона»: лейбл `--font-label` `--text-secondary` → Input h 48 (DESIGN §4.2), `type="tel" inputmode="tel" autocomplete="off"`, placeholder `+7 999 123-45-67` `--text-tertiary` → подсказка «Россия (+7) или Беларусь (+375)» `--font-description` `--text-tertiary`. Автофокус.
3. gap 24 → кнопки в ряд 1:1, gap 8: Secondary «Отмена» h 48, Primary «Создать чат» h 48.
   - Primary disabled при пустом поле; loading: Spinner 20 + «Ищем в MAX…», ширина фиксирована; поле disabled, «Отмена» и «×» disabled (Esc не работает).
4. На mobile: то же без строки 1 (заголовок в шапке), кнопки прижаты к низу панели (`margin-top:auto`, padding-bottom `max(16px, env(safe-area-inset-bottom))`), только Primary на всю ширину — «Отмена» не нужна, есть «×».

### Ошибки [DS:S3-errors]
Все ошибки — под полем, вместо подсказки: `--font-description` `--text-negative-strong`, поле в error-состоянии (shadow `--negative`), `aria-invalid` + `aria-describedby`, `role="alert"` на тексте. Текст живёт до следующего изменения поля. Форма не закрывается, номер остаётся.

| Случай | Текст |
|---|---|
| пусто (submit) | Введите номер телефона |
| формат / 400 | Номер должен быть российским (+7, 11 цифр) или белорусским (+375, 12 цифр) |
| нет аккаунта | Этот номер не зарегистрирован в MAX |
| инстанс не готов | Инстанс не подключён к MAX. Проверьте его в личном кабинете |
| 469 | Слишком много проверок номеров. Попробуйте через 2 часа |
| 466 | Лимит бесплатного тарифа исчерпан. Смените тариф в личном кабинете GREEN-API |
| офлайн | Нет соединения с интернетом |
| 5xx | Сервис GREEN-API недоступен. Попробуйте позже |

Длинные тексты (466, инстанс) переносятся на 2–3 строки — высота модалки растёт, кнопки не прыгают по ширине.
Для 466 и «инстанс не готов» в тексте слово «личном кабинете» — ссылка `--text-link` на console.green-api.com (`target=_blank`). Дёшево, полезно.

### Успех
Модалка закрывается (fade 150ms), новый чат появляется первым в списке с анимацией высоты 0→72 + fade 200ms, сразу selected, справа открыт S4 (mobile — push экрана чата slide-left 200ms).

### Экраны-состояния для макета S3
S3-a default desktop · S3-b mobile fullscreen · S3-c focus + набранный номер · S3-d loading · S3-e ошибка формата · S3-f «не зарегистрирован в MAX» · S3-g 466 (3 строки текста).

## 2. Элемент списка чатов [DS:chat-list-item]

Уточняет DESIGN §4.4. Контейнер списка: padding 8, gap 0 между элементами (ховер-карточки касаются, как в MAX).

### Геометрия (h 72)
```
┌ 16 ─┬────48────┬ 12 ┬──────────────── flex 1 ────────────────┬ 16 ┐
│     │  Avatar  │    │ Title 15/20 ………………………………   14:05 desc │     │
│     │    48    │    │ Preview 14/16 ……………………………      [2]   │     │
└─────┴──────────┴────┴─────────────────────────────────────────┴─────┘
```
- Элемент: `role="button"` или `<button>`, radius 16, padding 12 16, flex, gap 12, align center, `cursor: pointer`, `text-align: left`, width 100%.
- Правая колонка: `min-width: 0`, две строки, gap 4.
  - Строка 1: Title `--font-body` `--text-primary`, `flex:1`, ellipsis; справа Time `--font-description` `--text-tertiary`, `flex-shrink:0`, margin-left 8. Если есть непрочитанные — Title `--font-body-strong`, Time `--text-link`.
  - Строка 2: Preview `--font-detail` `--text-secondary`, `flex:1`, ellipsis, 1 строка; префикс «Вы: » тем же цветом (не выделяем — как в MAX). Пусто → «Нет сообщений» `--text-tertiary`. Справа — слот 20px под Unread/Status, `flex-shrink:0`, margin-left 8.
- Слот справа в строке 2 (взаимоисключающе, приоритет сверху вниз):
  1. Unread badge: min 20×20, radius pill, bg `--counter-bg`, текст 12/16 500 `--counter-text`, padding 0 6; 100+ → «99+». (Логика — спринт 3, но верстаем сейчас.)
  2. Status последнего своего сообщения: иконка 16 — clock `--icon-tertiary` (отправляется), check `--icon-tertiary` (отправлено), alert-circle `--bubble-status-error` (не отправлено). Ставим перед превью? Нет — справа в слоте, чтобы превью не прыгало.
  3. пусто.
- Avatar 48 (DESIGN §4.3): цвет по хэшу `chatId` (5 градиентов), внутри — иконка user 24 белая (имени нет; когда со спринта 3 появится имя — инициал).

### Состояния
| Состояние | Визуал |
|---|---|
| default | bg прозрачный |
| hover | bg `--cell-hover` (`--t-fast`) |
| pressed | bg `--cell-pressed` |
| selected (активный чат) | bg `--cell-selected`; на mobile selected не показываем (список не виден одновременно с чатом) |
| focus-visible | outline 2px `--accent` offset −2 (внутрь, чтобы не обрезалось контейнером) |
| длинный Title | ellipsis, время не сжимается |
| длинное Preview | ellipsis в одну строку, бейдж не сжимается |

Клавиатура: Tab между элементами (`tabindex=0`), Enter/Space — открыть. Стрелки ↑↓ — по желанию (roving tabindex), не обязательно.

Список — отдельный `overflow-y:auto` под шапкой сайдбара, шапка не скроллится. Перестановка чата наверх — без анимации (FLIP не делаем, минимализм), просто перерисовка.

## 3. S4 Экран чата [DS:S4]

### Раскладка правой панели
`display:flex; flex-direction:column; height:100%`: Header 56 → MessageList `flex:1; overflow-y:auto` → Composer (auto). Фон панели `--bg-chat`. На mobile — отдельный экран 100dvh, замещает список (push/pop slide 200ms), список сохраняет позицию скролла.

### Header (уточняет DESIGN §4.5)
- h 56, bg `--bg-primary`, border-bottom 1px `--divider-soft`, padding 0 16 (mobile: 0 8 0 4), gap 12.
- Mobile: ghost «Назад» 40×40 arrow-left (`aria-label` «Назад к списку») первым.
- Avatar 36 (тот же цвет, что в списке) → колонка `min-width:0`: Title `--font-title` ellipsis (номер `+7 999 123-45-67`); вторая строка `--font-description` `--text-tertiary` — только когда Title = имя (спринт 3); сейчас одна строка, вертикально по центру.
- Справа ничего (минимализм). Слот 40 оставлен пустым.

### MessageList
- Внутренний контейнер: `max-width: 791px; margin: 0 auto; padding: 16px 16px 8px` (mobile: 12 12 8). `role="log" aria-live="polite" aria-relevant="additions"`.
- Порядок по времени. Отступы: между сообщениями одного автора подряд `--bubble-gap-stack` 2; между разными авторами 8; вокруг разделителя дня 16.
- При открытии — `scrollTop = scrollHeight` до первого кадра (без анимации). После своей отправки — плавный скролл вниз (`smooth`, при `reduced-motion` — мгновенно).

**Разделитель дня:** по центру, pill: bg `--date-pill-bg`, text `--font-label` 12/16 500 `--date-pill-fg`, padding 4 12, radius pill. Тексты: «Сегодня», «Вчера», «27 сентября», «27 сентября 2025». `position: sticky; top: 8px` — прилипает при скролле, как в MAX. z-index над пузырями.

**Пустой чат (ST-03):** MessageList центрирует по обеим осям pill того же стиля, что разделитель дня, но текст `--font-detail` `--text-secondary` «Напишите первое сообщение». Одна плашка, без иконок.

### Bubble [DS:bubble] (уточняет DESIGN §4.6)
- Ряд: `display:flex`, incoming `justify-content:flex-start`, outgoing `flex-end`. Пузырь `max-width: min(480px, 85%)` (mobile: 85% ширины ленты), `min-width: 72`.
- Пузырь: padding 8 12 6 12; radius 16; incoming bg `--bubble-in-bg`, outgoing bg `--bubble-out-gradient`. Без границ/теней.
- **Хвостик:** только у последнего сообщения в группе, со стороны автора, нижний угол → radius `--bubble-tail` 6 (а не рисованный хвост — в MAX именно так). У остальных в группе тот же угол 16. Итого: одиночное сообщение = 16/16/16/6 (нижний внешний угол 6).
- Текст: `--font-body` 15/20, цвет `--bubble-in-text` / `--bubble-out-text`, `white-space: pre-wrap; overflow-wrap: anywhere; word-break: normal`. Рендер как текст (React по умолчанию экранирует) — HTML/`<script>` отображаются буквально. Ссылки — не кликабельные, обычный текст.
- **Мета** (время + статус): inline-блок, `float:right` внутри текста с `margin: 4px 0 0 8px` — так текст обтекает, короткое сообщение в одну строку, длинное — мета уходит в правый нижний угол без пустой строки. Время `--font-bubble-label` 12/16 цвет `--bubble-*-time`; у outgoing после времени иконка статуса 16, gap 4, цвет `--bubble-out-status`. `aria-label` на мете: «14:05, отправлено».
- Длинная строка без пробелов (200 символов) → `overflow-wrap:anywhere` ломает её, пузырь ≤ max-width, скролла нет.
- Многострочное: переносы сохраняются, мета в конце последней строки или на новой, если не влезает.

### Статусы сообщения [DS:message-status]
| Статус | Иконка 16 | Цвет | Под пузырём |
|---|---|---|---|
| отправляется | clock | `--bubble-out-status` (60% — `opacity:.7`) | — |
| отправлено | check | `--bubble-out-status` | — |
| не отправлено | alert-circle | белая на градиенте? нет — **в мете иконку не меняем на красную** (плохо читается на синем); вместо этого: иконка alert-circle 20 `--bubble-status-error` **слева от пузыря** (в ряду, gap 8, align flex-end) + строка под пузырём | строка `--font-description` `--text-negative-strong`, выровнена по правому краю пузыря, margin-top 4: текст ошибки + кнопка-ссылка «Повторить» (`--font-description` 500, подчёркивание, тот же цвет, hit-area 32 по высоте через padding) |

Тексты под пузырём — из задачи 6 дословно; для 466 без «Повторить». Пузырь с ошибкой: bg — тот же градиент, но `opacity: .85`. При «Повторить» → строка исчезает, статус clock, opacity 1; сообщение остаётся на своём месте в ленте (не переносится вниз).
Очередь: несколько подряд со статусом clock — просто несколько часиков, никакой дополнительной индикации.

Переход иконок clock→check: crossfade 150ms.

### Кнопка «вниз» (задел под спринт 3)
Круг 40, bg `--scroll-fab-bg`, shadow `--scroll-fab-shadow`, иконка arrow-down 20 `--icon-primary`, `position:absolute; right:16; bottom: composer-h + 16`. В этом спринте не показываем; верстаем, если дёшево.

## 4. Composer [DS:composer] (уточняет DESIGN §4.7)

### Геометрия
- Контейнер: bg `--bg-primary`, border-top 1px `--divider-soft`, padding 8 16 (mobile: 8 8, + `env(safe-area-inset-bottom)`), внутренний блок `max-width 791; margin 0 auto`, `display:flex; align-items:flex-end; gap 8`.
- Textarea: `flex:1`, bg `--input-bg`, radius 12, padding 10 14, `--font-body` 15/20, `--text-primary`, placeholder «Сообщение» `--text-tertiary`, `resize:none`, min-h 40 (1 строка), max-h `--composer-textarea-max-h` 140 (6 строк) → далее `overflow-y:auto`. Автовысота по содержимому. `aria-label` «Сообщение». Focus: shadow 2px `--accent`.
- Кнопка Send: 40×40 круг, bg `--accent`, иконка send 20 белая (стрелка-«самолётик» Lucide `send-horizontal`), `aria-label` «Отправить». Hover `--accent-hover`, pressed `--accent-pressed`, disabled `--button-primary-disabled` (иконка 70%). Всегда видима, прижата к нижнему краю textarea.
- Enter → отправить; Shift+Enter → перенос; `isComposing` (IME) → Enter игнорируем.
- После отправки: textarea очищается, высота сбрасывается на 40, фокус остаётся (desktop). На mobile фокус тоже остаётся (клавиатура уже открыта).

### Счётчик лимита
- Появляется при length ≥ 3800: строка над textarea? Нет — **справа-снизу под контейнером кнопки не поместится**; кладём **над composer'ом внутри его паддинга**: строка h 16, `text-align:right`, `--font-description` `--text-tertiary`, формат `3850 / 4000`, margin-bottom 4. Контейнер растёт на 20.
- > 4000: счётчик `--text-negative-strong` + текст слева в той же строке «Максимум 4000 символов» (`--font-description` `--text-negative-strong`, `role="alert"`); Send disabled; Enter не отправляет; textarea shadow `--negative`.
- Считаем по `Array.from(text).length` (эмодзи = 1 символ), но правило API — по своему; расхождение допустимо.

### Неактивное состояние (инстанс не готов)
Textarea disabled: bg `--input-bg`, текст placeholder «Инстанс не подключён — отправка недоступна» `--text-tertiary`, `cursor:not-allowed`; Send disabled. Введённый текст сохраняется (не стираем). Опционально `title` с тем же текстом.

### Черновики
Хранятся в памяти по `chatId`; при переключении чата textarea заполняется черновиком без анимации, высота пересчитывается.

### Экраны-состояния для макета Composer
пустое · с текстом 1 строка · 6 строк + внутренний скролл · счётчик 3850/4000 · 4001 (красный + текст) · disabled (инстанс).

## 5. Mobile S4 (360)
- Header с «Назад», Title ellipsis.
- Лента padding 12; пузырь max 85%.
- Composer padding 8, safe-area снизу; на фокусе textarea браузер сам скроллит — ничего не фиксируем.
- Переход список↔чат: slide 200ms, `reduced-motion` → без.

## 6. Иконки спринта (Lucide-имена)
user, clock, check, alert-circle, arrow-left, arrow-down, send-horizontal, x, plus (не нужен), phone (не нужен). Итого новых: user, arrow-left, arrow-down, send-horizontal.

## 7. Чек-лист сдачи
- [ ] S3 desktop/mobile ×7 состояний; ChatCell ×7; S4 пустой/группа/многострочное/200-символьная строка/разделитель; Composer ×6; статусы ×3 + «Повторить»; всё в light/dark.
- [ ] Контраст: время в incoming `#06070885` на `#f2f2f2` = 5.9:1 ✓; время в outgoing `#ffffffa3` на `#0070eb` ≈ 3.9:1 — для 12px формально ниже 4.5, но это де-факто стандарт мессенджеров и совпадает с MAX; принимаем, не трогаем.
- [ ] Текст ошибки под пузырём `--text-negative-strong` на `--bg-chat`: light 5.1:1 ✓, dark 5.4:1 ✓.
- [ ] Мета не наезжает на текст в 1-строчном и многострочном сообщении (float-схема), проверено на 72px-минимуме.
- [ ] `<b>x</b>` в пузыре — буквами.
