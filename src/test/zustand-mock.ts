import { act } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import type * as ZustandExportedTypes from 'zustand'

/**
 * Рецепт из документации zustand: каждый стор после теста возвращается в начальное состояние,
 * иначе модульные синглтоны протекают между тестами.
 */
const storeResetFns = new Set<() => void>()

vi.mock('zustand', async () => {
  const actual = await vi.importActual<typeof ZustandExportedTypes>('zustand')

  const createUncurried = <T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
    const store = actual.create(stateCreator)
    const initialState = store.getInitialState()
    storeResetFns.add(() => {
      store.setState(initialState, true)
    })
    return store
  }

  // Перегруженную сигнатуру create (каррированную и нет) без приведения типа не выразить.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const create = (<T>(stateCreator: ZustandExportedTypes.StateCreator<T> | undefined) =>
    stateCreator === undefined
      ? createUncurried
      : createUncurried(stateCreator)) as typeof ZustandExportedTypes.create

  return { ...actual, create }
})

afterEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => {
      resetFn()
    })
  })
})
