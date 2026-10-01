# Дизайн-спека — Спринт 4: mobile, фокус, a11y, вторая вкладка, motion, скелетоны

База: `design/DESIGN.md`, `design/SPRINT-1.md`, `design/SPRINT-2.md`, `sprints/sprint-3/DESIGN-SPRINT-3.md`, токены `src/styles/tokens.css` (дополнены блоком Sprint 4). Задачи 5–7 UI не имеют. Проверка: 320 / 360 / 390 / 768 / 1024 / 1440 / 1920, iOS Safari + Android Chrome, обе темы, 200 % зум.

## 1. Mobile [DS:mobile]

### Высота и клавиатура
- Корневой контейнер приложения: `height: 100dvh` (fallback `100vh` через `@supports`), `overflow: hidden`. Скроллятся только MessageList и список чатов, не `body`. Это убирает «прыжки» адресной строки Safari.
- Экран чата — `flex-column`: Header (fixed-height 56) → MessageList (`flex:1; min-height:0`) → Composer. При открытии клавиатуры `dvh` уменьшается → composer остаётся над клавиатурой, шапка на месте, лента ужимается и остаётся прижатой к низу (`scrollTop = scrollHeight` после `resize`, если пользователь был внизу).
- iOS: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; `maximum-scale` **не** ставим (a11y). Чтобы не было зума при фокусе — все поля ввода `font-size ≥ 16px` на mobile: Input/Textarea/Composer на `<900` используют 16/20 вместо 15/20 (токен `--font-body-mobile-input: 400 16px/20px`). Визуальная разница незаметна.
- Safe-area: Composer `padding-bottom: calc(8px + env(safe-area-inset-bottom))`; Header `padding-top: env(safe-area-inset-top)` с ростом высоты; S3 fullscreen-панель и S1 — те же паддинги. Горизонтальные `env(safe-area-inset-left/right)` — для альбомной ориентации на iPhone.

### Альбомная ориентация (телефон, высота ≈ 320–400)
- Header 48 вместо 56 (`@media (max-height: 480px) and (orientation: landscape)`), аватар 32, Composer textarea max-h 3 строки (80) вместо 6, S1 логин — контент сверху, паддинг 16, логотип 40, hero → subheader 20/24.
- Список чатов: ячейка 64 вместо 72 (аватар 40).

### Узкие экраны 320
- Все горизонтальные паддинги 16 → 12 на `≤360`; ChatCell padding 10 12; Composer 8 8; S3 поля на всю ширину.
- Шапка сайдбара на 320: текст «Чаты + idInstance» `min-width:0` ellipsis; три иконки 40 остаются (120 px).
- Пузырь `max-width: 85%` → на 320 это ~245 px, мета обтекает; 4000-символьное сообщение — просто длинный пузырь, `overflow-wrap:anywhere`.

### Касания
- Хит-зона всех интерактивных элементов на `<900` ≥ `--touch-min` 44×44: ghost-иконки визуально 40 → `min-width/height: 44` с `margin: -2px`; `×` в баннере 32 → 44 через padding; кнопки-ссылки «Повторить» под пузырём — `padding: 10px 0` (hit 44 при тексте 14/20… 20+20 = 40 → padding 12) ; текстовые кнопки в баннере h 32 → `min-height: 44` на mobile, баннер растёт.
- `touch-action: manipulation` на интерактивных элементах (убирает задержку и zoom по double-tap). Hover-состояния только под `@media (hover: hover)`, чтобы не «залипали» после тапа.
- Активное состояние тапа: pressed-цвета из DS срабатывают через `:active`.

### Навигация «Назад»
- Открытие чата на mobile → `history.pushState`; «Назад» браузера/жест → список. С экрана списка «Назад» — обычный выход со страницы (допустимо по задаче). Модалка S3 на mobile — тоже `pushState`, «Назад» закрывает её.

### S3 на mobile при клавиатуре
Fullscreen-панель `height:100dvh`, контент `overflow-y:auto`, кнопка «Создать чат» — `position: sticky; bottom: 0` внутри скроллящегося контента с фоном `--bg-primary` и `padding-bottom: calc(16px + env(safe-area-inset-bottom))`. Клавиатура уменьшает dvh → кнопка видна над ней.

## 2. Фокус [DS:focus]

Единый стиль, **только** `:focus-visible` (мышь/тап кольца не показывают):
- Двойное кольцо `box-shadow: var(--focus-ring)` = 2px фон `--bg-primary` + 2px `--accent`. Внутренний «зазор» делает кольцо читаемым и на синем пузыре/кнопке, и на тёмном фоне, и на цветном аватаре. На элементах с `border-radius` кольцо следует скруглению автоматически.
- Исключения: элементы, обрезаемые контейнером (ChatCell внутри `overflow:auto` списка, строки в модалке) → `--focus-ring-inset` (внутреннее 2px кольцо), чтобы не срезалось.
- Инпуты: focus-кольцо 2px `--accent` без зазора (уже есть в DS) — оставляем, оно заметно на `--input-bg`.
- Primary-кнопка (синяя) с `--focus-ring`: белый зазор + синее кольцо — отличимо от самой кнопки.
- Пузырь сообщения фокусируемый? Нет — элементы ленты не в tab-порядке (только «Повторить» и FAB). Лента как регион получает `tabindex=-1` для skip-link.
- Фокус при открытии модалки → первое поле; при закрытии → инициатор (уже в S2). На mobile после «Назад» фокус → ChatCell открытого ранее чата.
- Контраст кольца `#007aff` к `--bg-surface #edeef2` = 3.7:1 ✓ (≥3:1 для non-text), к `--bg-primary #17181c` dark = 4.4:1 ✓.

### Skip-link «Перейти к сообщениям»
Первый элемент в DOM главного экрана. Визуально скрыт (`position:absolute; left:-9999px`), при `:focus` — `position:fixed; top:8px; left:8px; z-index: 1000`, bg `--skip-link-bg`, text `--skip-link-fg`, `--font-action-small`, padding 8 12, radius 8, shadow `--scroll-fab-shadow`. Цель: `#messages` (MessageList, `tabindex=-1`) если чат открыт, иначе `#chat-list`. На mobile — то же.

## 3. a11y-разметка [DS:a11y]
- `<html lang="ru">`.
- Сайдбар: `<nav aria-label="Чаты">`; список `<ul role="list">` → `<li><button aria-label="Анна, Привет!, 14:05, 2 непрочитанных, прочитано">` (имя, превью, время, непрочитанные, статус своего — через запятую; пустые части пропускаются). Активный — `aria-current="true"`.
- Правая панель: `<main>`; Header `<header>`; MessageList `<section role="log" aria-live="polite" aria-relevant="additions" aria-label="Сообщения с Анна">`; каждый пузырь `<article aria-label="Вы, 14:05, доставлено: текст">` / `«Анна, 14:06: текст»`. Разделитель дня `role="separator" aria-label="Сегодня"`.
- Composer: `<form>`; textarea `aria-label="Сообщение"`, `aria-describedby` → счётчик лимита (когда виден); Send `aria-label="Отправить"`.
- Баннеры: контейнер `aria-live` уже задан по типу; кнопки внутри — обычные `<button>`/`<a>`.
- FAB: `aria-label` из спринта 3.
- Иконки — `aria-hidden="true"`, `focusable="false"`.
- Ошибки полей: `role="alert"` на тексте, `aria-invalid` + `aria-describedby` на поле (есть с S1).
- Тема: кнопка `aria-pressed` не нужна — `aria-label` «Включить тёмную тему»/«Включить светлую тему».

### Контраст — финальная проверка палитры (light / dark)
| Пара | Light | Dark | Вердикт |
|---|---|---|---|
| `--text-primary` на `--bg-primary` | 19.3 | 17.4 | ✓ |
| `--text-secondary` (ad) на `--bg-primary` | 12.6 | 13.1 | ✓ |
| `--text-tertiary` (85) на `--bg-primary` | 7.9 | 9.0 | ✓ |
| placeholder `--text-tertiary` на `--input-bg` | 6.9 | 7.4 | ✓ |
| время в incoming `#06070885` на `#f2f2f2` | 7.1 | — | ✓ |
| время в incoming dark `#ffffffa3` на `#202022` | — | 7.8 | ✓ |
| время в outgoing `#ffffffa3` на `#0070eb` / `#2258cc` | 3.1 | 3.9 | **✗ для 12px** → меняем `--bubble-out-time` на `#ffffffd6` (84 %): 4.6 / 5.3 ✓ |
| `--text-negative-strong` на `--bg-chat` | 5.1 | 5.4 | ✓ |
| текст на Primary disabled `#fff`@70 % на `#007aff7a`-над-белым | ≈3.2 | — | ✓ для крупного/иконок; текст кнопки 17px 500 = «крупный» по WCAG ✓ |
| `--text-link` на `--bg-primary` | 4.6 | 4.9 | ✓ |
| время при unread `--text-link` 12px | 4.6 | 4.9 | ✓ |
| warn-баннер текст `#060708` на `#ffcc0033`-над-белым | 15+ | — | ✓ |
| FAB badge `#fff` на `#007aff` | 4.6 | 4.6 | ✓ |
Единственное изменение DS: `--bubble-out-time` и `--bubble-out-status` → `#ffffffd6` в обеих темах; «прочитано» остаётся `#fff` 100 % + stroke 2.5 (различимость сохраняется, разница d6→ff).

### Зум 200 %
Сетка на `--sidebar-w` 393 при 200 % = эффективная ширина 720 CSS px → срабатывает одноколоночный режим (<900). Это корректно: на 200 % desktop ведёт себя как планшет. Ничего не фиксируем в `px` по высоте кроме Header/ячеек — они растут с текстом? Нет, высоты фиксированы, но текст 15/20 при 200 % зуме масштабируется вместе с px — всё пропорционально, обрезаний нет.

## 4. Экран «Открыто в другой вкладке» [DS:other-tab]
Полноэкранный, фон `--bg-surface`, C7 StatusScreen (SPRINT-1): логотип 48 сверху, иконка `app-window` (Lucide) или `copy` `--icon-secondary` в круге 96, заголовок `--font-subheader` «Приложение открыто в другой вкладке», текст `--font-body` `--text-secondary` «Сообщения получает только одна вкладка. Нажмите, чтобы продолжить здесь», Primary «Использовать здесь» h 48 (loading: Spinner + «Переключаем…»), под ней Ghost «Выйти». Mobile — тот же экран, контент сверху с отступом 48.
Появление — мгновенно, без анимации (это не ошибка, а переключение). Заголовок вкладки: `MAX-чат — неактивна`. `aria-live="assertive"` на заголовке при появлении.

## 5. Motion [DS:motion]
Все длительности — через `--dur-*`, кривые `--ease-out`/`--ease-in`; при `prefers-reduced-motion` токены = 0 и глобальный сброс (см. tokens.css). Длительности ≤ 240 ms.

| Что | Анимация | Длит. |
|---|---|---|
| Новое сообщение (своё/входящее) | `opacity 0→1` + `translateY 6→0`; без scale | base 200 |
| Прокрутка к новому | `scroll-behavior: smooth` только если пользователь внизу; reduced → `auto` | — |
| Модалка S3 desktop | overlay fade 150; окно `scale .96→1` + fade | fast/base |
| S3 mobile fullscreen | `translateY 100%→0` | base |
| Переход список→чат mobile | чат `translateX 100%→0` поверх списка; обратно — симметрично | base |
| Баннер | `grid-template-rows 0fr→1fr` + fade (не `height:auto`) | base |
| FAB | fade + `translateY 8→0` | fast |
| Unread badge появление | `scale .6→1` | fast |
| Статус clock→check | crossfade | fast |
| Hover/pressed цвета | `background-color` | fast |
| ChatCell перестановка наверх | без анимации | — |
| Спиннеры | показ с задержкой 300 ms (CSS `animation-delay` на opacity или JS-таймер); кнопка `min-width` = ширина default | — |
Не анимируем: `height`, `width`, `box-shadow` на больших элементах — только `opacity`/`transform`/цвета и `grid-template-rows` для баннера.

## 6. Скелетоны [DS:skeleton]
Нужны только там, где загрузка может быть > 300 ms: восстановление истории при старте (чтение хранилища + проверка инстанса) и открытие чата с большой историей. Если быстрее — ничего не показываем (та же задержка 300 ms, что у спиннеров).
- Блок: bg `--skeleton-base`, radius `--skeleton-radius` 8 (аватар — круг), «shine» — бегущий градиент `--skeleton-shine` 1.4 s linear infinite; при reduced-motion — статичный `--skeleton-base`.
- **Список чатов:** 6 ячеек h 72: круг 48 + строка 16×60 % + строка 12×40 % (отступы как в ChatCell). `aria-busy="true"` на списке, `aria-label` «Загружаем чаты».
- **Лента:** 5 пузырей чередуя in/out: прямоугольники radius 16, ширины 40 % / 60 % / 30 % / 55 % / 45 %, h 36/56, выравнивание как у пузырей. Composer при этом доступен? Нет — disabled до загрузки (чтобы не отправить в неинициализированный чат).
- **Сплэш** (S1) остаётся как есть — скелетон под ним не нужен.
- Смена скелетон→контент: crossfade `--dur-fast`, без «прыжка» высоты (скелетон списка по высоте ≈ 6×72).

## 7. Пустые и крайние случаи (задача 4)
- 1 чат: список без разделителей, как и 50 — список просто скроллится; шапка сайдбара sticky (уже).
- Сообщение из одного эмодзи: без увеличения размера (минимализм, у MAX крупные эмодзи, но мы не делаем) — обычный пузырь, `min-width 72` даёт аккуратную форму.
- 4000 символов: пузырь `max-width` 480, высота любая; мета внизу справа.
- Favicon: `favicon.svg` — квадрат 32 radius 9, `--accent #007aff`, белый пузырь-глиф; для dark-таба тот же (синий читаем на обоих). Тайтлы — по S1/S3 спекам.
- Тексты: `docs/copy.md` — вычитываю на «ё» (пишем **с ё** везде: «ещё», «её», «идёт», «отключён», «подключён»), без точек в заголовках и на кнопках, точки в многострочных текстах баннеров/статусов только между предложениями, в конце — нет.

## 8. Состояния для макета
- Mobile: чат с открытой клавиатурой (iOS, Android), альбомная (чат + S1), 320 (S2 список, S4), S3 с клавиатурой и sticky-кнопкой.
- Фокус: ghost-иконка, Primary, Secondary, Input, ChatCell (inset), FAB, «×» баннера, «Повторить», skip-link видимый.
- «Открыто в другой вкладке»: desktop, mobile, loading.
- Скелетоны: список, лента.
- Motion-таблица как референс, без макетов.

## 9. Чек-лист
- [ ] Поля 16px на mobile → iOS без зума (проверить реальным iPhone).
- [ ] `--bubble-out-time` обновлён на `#ffffffd6` в tokens.css (обе темы).
- [ ] Все hit-зоны ≥ 44 на `<900` (пройти DevTools → «Accessibility → touch targets» в Lighthouse).
- [ ] `prefers-reduced-motion` → ни одной анимации, скролл `auto`, скелетон статичный.
- [ ] Фокус-кольцо видно на: белом, `--bg-surface`, синей кнопке, синем пузыре, аватаре-градиенте, dark-фоне.
- [ ] axe 0 critical/serious на S1, статусы, S2, S3, S4, сбой, другая вкладка.
