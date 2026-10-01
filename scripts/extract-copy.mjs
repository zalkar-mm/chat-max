// Сводный список текстов интерфейса для вычитки — docs/copy.md (sprint-4, задача 4).
// Тексты берутся из исходников (строки и JSX-текст с кириллицей), поэтому файл всегда совпадает с приложением.
//   node scripts/extract-copy.mjs          — пересобрать docs/copy.md
//   node scripts/extract-copy.mjs --check  — упасть, если docs/copy.md устарел (CI)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import ts from 'typescript'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')
const OUT = join(ROOT, 'docs', 'copy.md')
// Не интерфейс: тесты, моки, тестовая инфраструктура, сообщения разработчику.
const SKIP = [/\.test\.tsx?$/, /^mocks\//, /^test\//, /\.d\.ts$/]
const CYRILLIC = /[А-Яа-яЁё]/

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(path)
    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

function templateText(node) {
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return node.head.text + node.templateSpans.map((span) => `{…}${span.literal.text}`).join('')
}

/** Строки, которые видит только разработчик: консоль и `new Error(…)`. */
function isDeveloperOnly(node) {
  const call = node.parent
  if (!call) return false
  if (ts.isNewExpression(call)) return call.expression.getText() === 'Error'
  return (
    ts.isCallExpression(call) &&
    ts.isPropertyAccessExpression(call.expression) &&
    call.expression.expression.getText() === 'console'
  )
}

function extract(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const texts = []
  const visit = (node) => {
    let text = null
    if (ts.isStringLiteral(node) && !ts.isImportDeclaration(node.parent)) text = node.text
    else if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node))
      text = templateText(node)
    else if (ts.isJsxText(node)) text = node.text.replace(/\s+/g, ' ').trim()
    if (text !== null && CYRILLIC.test(text) && !isDeveloperOnly(node)) texts.push(text)
    // Внутренности шаблонной строки уже собраны целиком.
    if (!ts.isTemplateExpression(node)) ts.forEachChild(node, visit)
  }
  visit(source)
  return [...new Set(texts)]
}

function render() {
  const sections = listFiles(SRC)
    .map((file) => ({ path: relative(SRC, file), texts: extract(file) }))
    .filter(({ path, texts }) => texts.length > 0 && !SKIP.some((re) => re.test(path)))
    .sort((a, b) => a.path.localeCompare(b.path))

  const lines = [
    '# Тексты интерфейса',
    '',
    'Сводный список для вычитки (sprint-4, задача 4). Файл генерируется из исходников —',
    'руками не править: `node scripts/extract-copy.mjs`. CI проверяет, что он не устарел.',
    '',
    'Правила: «ё» везде; без точек в заголовках и на кнопках; в многострочных текстах точки только',
    'между предложениями; термины — «инстанс», «личный кабинет GREEN-API», «MAX». `{…}` — подстановка.',
    '',
  ]
  for (const { path, texts } of sections) {
    lines.push(`## \`${path}\``, '', ...texts.map((text) => `- ${text}`), '')
  }
  return lines.join('\n')
}

const content = render()
if (process.argv.includes('--check')) {
  const current = readFileSync(OUT, 'utf8')
  if (current !== content) {
    console.error('docs/copy.md устарел: запустите `node scripts/extract-copy.mjs`')
    process.exit(1)
  }
} else {
  writeFileSync(OUT, content)
}
