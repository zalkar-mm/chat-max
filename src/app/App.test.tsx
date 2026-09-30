import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from './App'

describe('App', () => {
  it('рендерится', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'MAX-чат' })).toBeInTheDocument()
  })
})
