import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import vitest from '@vitest/eslint-plugin'
import prettier from 'eslint-config-prettier'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Синтаксические запреты, общие для всего `src/`. Вынесены в константу, потому
 * что flat-config не мержит опции правила: блок с дополнительными селекторами
 * для верхних слоёв иначе затёр бы этот список целиком.
 */
const BASE_RESTRICTED_SYNTAX = [
  {
    selector: 'TSEnumDeclaration',
    message: "enum запрещён. Используй `as const` карту: `export const Foo = { A: 'a' } as const`.",
  },
  {
    selector: 'JSXExpressionContainer > ConditionalExpression',
    message:
      'Тернарка в JSX запрещена. Используй ранние return, `<Gate when={...}>` или state-map.',
  },
  {
    selector: "JSXExpressionContainer > LogicalExpression[operator='&&']",
    message:
      "`&&` в JSX запрещён (роняет '0'/'' на falsy-числах/строках). Используй `<Gate when={...}>` из `@/shared/ui/gate`.",
  },
  {
    selector:
      'JSXAttribute[name.name=/^on[A-Z]/] > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression, CallExpression)',
    message:
      'Инлайн-функция/вызов в обработчике запрещены. Объяви `handleX` в теле компонента или передай функцию напрямую.',
  },
  {
    selector: 'ImportDeclaration[source.value=/\\/index(\\.(ts|tsx|js|jsx))?$/]',
    message: 'Barrel-файлы (index.ts) запрещены. Импортируй файл напрямую.',
  },
  {
    selector: "TSTypeReference[typeName.name='any']",
    message: 'Не используй `any`. Замени на `unknown` + narrowing.',
  },
]

/**
 * Нативные контролы, у которых есть примитив в `shared/ui`. Применяются ко всем слоям
 * выше `shared/` - внутри самих примитивов нативные теги, наоборот, обязательны.
 */
const NATIVE_CONTROL_RESTRICTIONS = [
  {
    selector: "JSXOpeningElement[name.name='button']",
    message: 'Нативная `<button>` запрещена. Возьми `Button` из `@/shared/ui/button`.',
  },
  {
    selector: "JSXOpeningElement[name.name='input']",
    message: 'Нативный `<input>` запрещён. Возьми `Input` из `@/shared/ui/input`.',
  },
  {
    selector: "JSXOpeningElement[name.name='textarea']",
    message: 'Нативная `<textarea>` запрещена. Возьми `Textarea` из `@/shared/ui/textarea`.',
  },
  {
    selector: "JSXOpeningElement[name.name='select']",
    message: 'Нативный `<select>` запрещён. Возьми `Select` из `@/shared/ui/select`.',
  },
  {
    selector: "JSXOpeningElement[name.name='table']",
    message: 'Нативная `<table>` запрещена. Возьми `Table` из `@/shared/ui/table`.',
  },
  {
    selector: 'JSXOpeningElement[name.name=/^(details|summary)$/]',
    message: '`<details>/<summary>` запрещены. Возьми `Collapsible` из `@/shared/ui/collapsible`.',
  },
]

/**
 * FSD-запреты: слой может импортировать ТОЛЬКО из слоёв ниже.
 * Проверяются через import-x/no-restricted-paths.
 */
const FSD_ZONES = [
  {
    target: './src/shared',
    from: ['./src/app', './src/pages', './src/widgets', './src/features', './src/entities'],
    message: 'shared не может импортировать из вышестоящих слоёв FSD',
  },
  {
    target: './src/entities',
    from: ['./src/app', './src/pages', './src/widgets', './src/features'],
    message: 'entities может импортировать только shared',
  },
  {
    target: './src/features',
    from: ['./src/app', './src/pages', './src/widgets'],
    message: 'features может импортировать только entities и shared',
  },
  {
    target: './src/widgets',
    from: ['./src/app', './src/pages'],
    message: 'widgets может импортировать только features, entities, shared',
  },
  {
    target: './src/pages',
    from: ['./src/app'],
    message: 'pages не может импортировать из app',
  },
]

/** Приватные файлы слайса сущности: наружу торчат только хуки, ui и типы. */
const ENTITY_PRIVATE_PATTERNS = [
  {
    group: [
      '@/entities/*/api/*-repository',
      '@/entities/*/api/*-keys',
      '@/entities/*/api/*-dto',
      '@/entities/*/model/*.schema',
    ],
    message: 'Приватный файл слайса сущности (repository/keys/dto/schema). Используй хук слайса.',
  },
]

// Транспорт доступен только из entities/<slice>/api и shared/api.
const TRANSPORT_PATTERNS = [
  {
    group: [
      '@/shared/api/green-api-client',
      '@/shared/api/build-method-url',
      '@/shared/api/parse-response',
    ],
    message:
      'HTTP-транспорт — только в `entities/*/api`. Выше слоя entities — через api сущностей.',
  },
]

const SONNER_PATH = {
  name: 'sonner',
  message: 'Импортируй `notify` из `@/shared/lib/notify` — он схлопывает дубли и умеет `apiError`.',
}

const AXIOS_PATH = {
  name: 'axios',
  message: 'axios — только в `shared/api`. Запросы — через repository и хуки `entities/*/api`.',
}

/**
 * Внутри своего слоя импорт по алиасу запрещён: свой слайс — относительно,
 * чужой слайс того же слоя — нельзя вовсе.
 */
const ownLayerPattern = (layer) => ({
  group: [`@/${layer}/*`],
  message: `Внутри слоя ${layer}: свой слайс — относительным путём, чужой слайс того же слоя — запрещён.`,
})

const layerRestrictedImports = (layer, { upper }) => [
  'error',
  {
    paths: upper ? [SONNER_PATH, AXIOS_PATH] : [SONNER_PATH],
    patterns: [
      ownLayerPattern(layer),
      ...(upper ? [...ENTITY_PRIVATE_PATTERNS, ...TRANSPORT_PATTERNS] : []),
    ],
  },
]

const UPPER_LAYERS = ['pages', 'widgets', 'features']

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'dev-dist',
      'public',
      'coverage',
      'design',
      'playwright-report',
      'test-results',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: ['**/*.{ts,tsx}'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((c) => ({
    ...c,
    files: ['**/*.{ts,tsx}'],
  })),

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: './tsconfig.app.json',
        }),
      ],
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      'simple-import-sort': simpleImportSort,
      'import-x': importX,
      '@tanstack/query': pluginQuery,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      // React 19 — не нужно импортировать React, автоматический jsx-runtime
      'react/react-in-jsx-scope': 'off',
      // TypeScript типизирует пропы; классический prop-types не нужен
      'react/prop-types': 'off',
      'react/display-name': 'off',
      // `&&` и тернарки в JSX запрещены целиком через no-restricted-syntax
      'react/jsx-no-leaked-render': 'off',
      'react/no-array-index-key': 'error',

      // React hooks + refresh
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // a11y (базовые)
      ...jsxA11y.configs.recommended.rules,

      // Импорты
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1. node built-ins + react
            ['^node:', '^react', '^react-dom'],
            // 2. Внешние пакеты (npm)
            ['^@?\\w'],
            // 3. FSD-слои — сверху вниз
            ['^@/app(/.*|$)'],
            ['^@/pages(/.*|$)'],
            ['^@/widgets(/.*|$)'],
            ['^@/features(/.*|$)'],
            ['^@/entities(/.*|$)'],
            ['^@/shared(/.*|$)'],
            // 4. Относительные
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // 5. CSS / side-effects
            ['^.+\\.css$', '^\\u0000'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // FSD-зоны
      'import-x/no-restricted-paths': ['error', { zones: FSD_ZONES }],

      // Циклы, дубли, default export
      'import-x/no-cycle': ['error', { maxDepth: 3 }],
      'import-x/no-self-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-default-export': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // `as` запрещён, `as const` разрешён правилом всегда
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // TanStack Query
      ...pluginQuery.configs.recommended.rules,

      // Общие запреты
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-nested-ternary': 'error',
      'no-restricted-syntax': ['error', ...BASE_RESTRICTED_SYNTAX],

      // Браузерные диалоги — блокируют поток и не стилизуются
      'no-restricted-globals': [
        'error',
        {
          name: 'confirm',
          message: '`confirm` запрещён. Нужен диалог — `Dialog` из `@/shared/ui/dialog`.',
        },
        {
          name: 'alert',
          message: '`alert` запрещён. Используй `notify.*` из `@/shared/lib/notify`.',
        },
        {
          name: 'prompt',
          message: '`prompt` запрещён. Нужен ввод — форма в `Dialog`.',
        },
      ],
    },
  },

  // Верхние слои: без нативных контролов, без транспорта и приватных файлов сущностей
  ...UPPER_LAYERS.map((layer) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': layerRestrictedImports(layer, { upper: true }),
      'no-restricted-syntax': ['error', ...BASE_RESTRICTED_SYNTAX, ...NATIVE_CONTROL_RESTRICTIONS],
    },
  })),

  // entities: свой слайс — относительно, чужие сущности — нельзя
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': layerRestrictedImports('entities', { upper: false }),
      'no-restricted-syntax': ['error', ...BASE_RESTRICTED_SYNTAX, ...NATIVE_CONTROL_RESTRICTIONS],
    },
  },

  // app: собирает всё, но без нативных контролов и прямого sonner/axios
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [SONNER_PATH, AXIOS_PATH] }],
      'no-restricted-syntax': ['error', ...BASE_RESTRICTED_SYNTAX, ...NATIVE_CONTROL_RESTRICTIONS],
    },
  },

  // Тесты
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
      'vitest/expect-expect': 'error',
    },
  },

  // .d.ts — interface для global augmentation обязателен (иначе не мержится)
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },

  // vite.config.ts — Node-globals, default export требует Vite
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
      'import-x/no-restricted-paths': 'off',
      'import-x/no-default-export': 'off',
    },
  },

  // e2e (Playwright) и его конфиг: Node-процесс вне FSD, default export требует Playwright
  {
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'import-x/no-restricted-paths': 'off',
    },
  },
  {
    files: ['playwright.config.ts'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },

  // scripts/ — служебные Node-скрипты на plain JS (проверка секретов и т. п.)
  {
    files: ['scripts/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'no-console': 'off',
    },
  },

  // eslint.config.js — plain JS, никакого type-checked linting
  {
    files: ['eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'no-console': 'off',
      'import-x/no-restricted-paths': 'off',
      'import-x/no-default-export': 'off',
    },
  },

  // Prettier должен идти последним — отключает конфликтующие форматтинг-правила
  prettier,
)
