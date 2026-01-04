/**
 * Textarea Component Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the Textarea component.
 * All tests should FAIL initially since the component doesn't exist yet.
 *
 * Expected component: src/renderer/components/ui/textarea.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the component that doesn't exist yet - will cause import error until implemented
import { Textarea } from '@renderer/components/ui/textarea'

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('should render a textarea element', () => {
      render(<Textarea />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName.toLowerCase()).toBe('textarea')
    })

    it('should render with placeholder text', () => {
      render(<Textarea placeholder="Enter your message..." />)

      const textarea = screen.getByPlaceholderText('Enter your message...')
      expect(textarea).toBeInTheDocument()
    })

    it('should render with initial value', () => {
      render(<Textarea defaultValue="Initial content" />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Initial content')
    })

    it('should have displayName set to "Textarea"', () => {
      expect(Textarea.displayName).toBe('Textarea')
    })
  })

  describe('Value Changes', () => {
    it('should handle value changes via typing', async () => {
      const user = userEvent.setup()
      render(<Textarea />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Hello, World!')

      expect(textarea).toHaveValue('Hello, World!')
    })

    it('should call onChange when value changes', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(<Textarea onChange={handleChange} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Test')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should support controlled component pattern', () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('controlled')
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }

      render(<TestComponent />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('controlled')
    })

    it('should handle multiline input', async () => {
      const user = userEvent.setup()
      render(<Textarea />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3')

      expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3')
    })
  })

  describe('Styling', () => {
    it('should apply custom className prop', () => {
      render(<Textarea className="custom-class" />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('custom-class')
    })

    it('should merge custom className with default styles', () => {
      render(<Textarea className="custom-class" />)

      const textarea = screen.getByRole('textbox')
      // Should have both custom class and base styling classes
      expect(textarea).toHaveClass('custom-class')
      // Base classes from shadcn/ui pattern
      expect(textarea.className).toMatch(/rounded-md|border|bg-/)
    })

    it('should apply focus ring styles', () => {
      render(<Textarea />)

      const textarea = screen.getByRole('textbox')
      // Should have focus-visible styling
      expect(textarea.className).toMatch(/focus-visible:|focus:/)
    })
  })

  describe('Disabled State', () => {
    it('should support disabled prop', () => {
      render(<Textarea disabled />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeDisabled()
    })

    it('should apply disabled styling', () => {
      render(<Textarea disabled />)

      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toMatch(/disabled:|opacity-/)
    })

    it('should not allow typing when disabled', async () => {
      const user = userEvent.setup()
      render(<Textarea disabled defaultValue="Original" />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'New text')

      expect(textarea).toHaveValue('Original')
    })

    it('should have cursor-not-allowed style when disabled', () => {
      render(<Textarea disabled />)

      const textarea = screen.getByRole('textbox')
      expect(textarea.className).toMatch(/cursor-not-allowed/)
    })
  })

  describe('Size and Dimensions', () => {
    it('should support rows prop', () => {
      render(<Textarea rows={5} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('should support cols prop', () => {
      render(<Textarea cols={40} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('cols', '40')
    })

    it('should have default minimum height styling', () => {
      render(<Textarea />)

      const textarea = screen.getByRole('textbox')
      // Should have min-h- class for minimum height
      expect(textarea.className).toMatch(/min-h-/)
    })
  })

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Textarea aria-label="Description field" />)

      const textarea = screen.getByLabelText('Description field')
      expect(textarea).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      render(
        <>
          <Textarea aria-describedby="help-text" />
          <span id="help-text">Enter a detailed description</span>
        </>
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-invalid for error states', () => {
      render(<Textarea aria-invalid="true" />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })

    it('should support id prop for label association', () => {
      render(
        <>
          <label htmlFor="my-textarea">Message</label>
          <Textarea id="my-textarea" />
        </>
      )

      const textarea = screen.getByLabelText('Message')
      expect(textarea).toBeInTheDocument()
    })

    it('should be focusable', () => {
      render(<Textarea />)

      const textarea = screen.getByRole('textbox')
      textarea.focus()

      expect(document.activeElement).toBe(textarea)
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to textarea element', () => {
      const ref = React.createRef<HTMLTextAreaElement>()
      render(<Textarea ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    })

    it('should allow programmatic focus via ref', () => {
      const ref = React.createRef<HTMLTextAreaElement>()
      render(<Textarea ref={ref} />)

      ref.current?.focus()

      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('Additional Props', () => {
    it('should support maxLength prop', () => {
      render(<Textarea maxLength={100} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxLength', '100')
    })

    it('should support required prop', () => {
      render(<Textarea required />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeRequired()
    })

    it('should support readOnly prop', () => {
      render(<Textarea readOnly defaultValue="Read only text" />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('readOnly')
    })

    it('should support name prop for forms', () => {
      render(<Textarea name="description" />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('name', 'description')
    })

    it('should spread additional props to textarea element', () => {
      render(<Textarea data-testid="custom-textarea" autoFocus />)

      const textarea = screen.getByTestId('custom-textarea')
      expect(textarea).toBeInTheDocument()
    })
  })
})
