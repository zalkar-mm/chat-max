// Тема выставляется до первого рендера, иначе при тёмной теме мелькает светлая.
// Отдельный файл, а не inline-скрипт: CSP разрешает скрипты только с нашего домена.
// Ключ и значения совпадают с src/shared/lib/theme/theme.ts.
;(function () {
  var theme = 'light'
  try {
    var saved = localStorage.getItem('max-chat:theme')
    if (saved === 'light' || saved === 'dark') theme = saved
    else if (matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark'
  } catch (_) {}
  document.documentElement.dataset.theme = theme
})()
