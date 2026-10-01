#!/usr/bin/env node
/**
 * Поиск строк, похожих на настоящий apiTokenInstance GREEN-API, в файлах репозитория.
 *
 * Токен GREEN-API — длинная строка из строчных hex-символов (50 знаков). Ищем hex-последовательности
 * от 48 символов: SHA-1 коммитов (40) не задевает, base64-хэши lockfile не совпадают по алфавиту.
 * idInstance (10 цифр) не ищем: он не секрет без токена и путается с метками времени.
 *
 * Запуск: `npm run check:secrets` — все файлы git (отслеживаемые и новые, кроме .gitignore);
 * `node scripts/check-secrets.mjs <файлы…>` — только переданные (так зовёт lint-staged).
 * Ложное срабатывание — пометка `check-secrets: allow` в той же строке. Найденное значение
 * в вывод не попадает целиком, чтобы не утечь в логи CI.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const TOKEN_PATTERN = /(?<![0-9a-f])[0-9a-f]{48,}(?![0-9a-f])/g
const ALLOW_MARKER = 'check-secrets: allow'
// Бинарные и сгенерированные файлы: токена в них быть не может, а читать их дорого.
const SKIPPED = /\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|mp4|zip|pdf)$/i

function listFiles(args) {
  if (args.length > 0) return args
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      encoding: 'utf8',
    },
  )
  return output.split('\0').filter(Boolean)
}

function readText(file) {
  try {
    const buffer = readFileSync(file)
    return buffer.includes(0) ? null : buffer.toString('utf8')
  } catch {
    // Файл удалён в рабочей копии, но ещё в индексе — проверять нечего.
    return null
  }
}

const mask = (value) => `${value.slice(0, 4)}…(${value.length} симв.)`

const findings = []
for (const file of listFiles(process.argv.slice(2))) {
  if (SKIPPED.test(file)) continue
  const text = readText(file)
  if (text === null) continue
  text.split('\n').forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return
    for (const match of line.matchAll(TOKEN_PATTERN)) {
      findings.push(`${file}:${index + 1}: похоже на apiTokenInstance — ${mask(match[0])}`)
    }
  })
}

if (findings.length > 0) {
  console.error(`Найдены строки, похожие на токен GREEN-API (${findings.length}):`)
  for (const finding of findings) console.error(`  ${finding}`)
  console.error(
    `\nУберите креды из репозитория (в тестах — заглушки вроде 'token'). ` +
      `Ложное срабатывание — пометка «${ALLOW_MARKER}» в строке.`,
  )
  process.exit(1)
}
console.log('check-secrets: похожих на токен строк нет')
