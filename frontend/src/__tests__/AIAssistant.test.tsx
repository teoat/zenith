import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { AIAssistant } from '@/components/ai/AIAssistant'

// Mock hook dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/context/AIContext', () => ({
  useAIContext: () => ({
    context: {},
    activePersona: 'analyst',
  }),
  AIPersona: {
    ANALYST: 'analyst'
  }
}))

describe('AIAssistant Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders without crashing', () => {
    render(<AIAssistant />)
    // The button has aria-label "Open AI Assistant"
    expect(screen.getByRole('button', { name: /open ai assistant/i })).toBeInTheDocument()
  })

  test('toggles chat panel when button is clicked', async () => {
    render(<AIAssistant />)
    
    const chatButton = screen.getByRole('button', { name: /open ai assistant/i })
    
    await act(async () => {
      fireEvent.click(chatButton)
    })
    
    // After clicking, should see the chat interface
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    render(<AIAssistant />)
    
    const chatButton = screen.getByRole('button', { name: /open ai assistant/i })
    expect(chatButton).toHaveAttribute('aria-label', 'Open AI Assistant')
  })
})
