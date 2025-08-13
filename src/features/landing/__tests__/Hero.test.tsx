import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import Hero from '../Hero'
import { I18nProvider } from '@/i18n/I18nProvider'

describe('Hero', () => {
  it('renders CTA button', () => {
    render(
      <I18nProvider>
        <Hero />
      </I18nProvider>
    )
    expect(screen.getByRole('button', { name: /Hemen Başla/i })).toBeInTheDocument()
  })
})


