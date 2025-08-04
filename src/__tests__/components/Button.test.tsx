import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Test Button</Button>)
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click Me</Button>)
    
    fireEvent.click(screen.getByRole('button', { name: 'Click Me' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    render(<Button variant="destructive">Destructive Button</Button>)
    const button = screen.getByRole('button', { name: 'Destructive Button' })
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies size classes correctly', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button', { name: 'Small Button' })
    expect(button).toHaveClass('h-8')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button', { name: 'Disabled Button' })
    expect(button).toBeDisabled()
  })
}) 