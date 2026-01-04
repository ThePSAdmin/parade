/**
 * Checkbox Component Tests - TDD RED Phase
 *
 * These tests define the expected behavior for the Checkbox component.
 * All tests should FAIL initially since the component doesn't exist yet.
 *
 * Expected component: src/renderer/components/ui/checkbox.tsx
 * Uses Radix UI Checkbox primitive under the hood.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the component that doesn't exist yet - will cause import error until implemented
import { Checkbox } from '@renderer/components/ui/checkbox'

describe('Checkbox Component', () => {
  describe('Basic Rendering', () => {
    it('should render a checkbox element', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })

    it('should render unchecked by default', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('should have displayName set to "Checkbox"', () => {
      expect(Checkbox.displayName).toBe('Checkbox')
    })

    it('should render as a button element (Radix pattern)', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox.tagName.toLowerCase()).toBe('button')
    })
  })

  describe('Checked State', () => {
    it('should render checked when checked prop is true', () => {
      render(<Checkbox checked />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should render checked when defaultChecked is true', () => {
      render(<Checkbox defaultChecked />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should display checkmark icon when checked', () => {
      render(<Checkbox checked data-testid="checkbox" />)

      const checkbox = screen.getByTestId('checkbox')
      // Radix Checkbox shows indicator when checked
      expect(checkbox.querySelector('svg')).toBeInTheDocument()
    })

    it('should not display checkmark icon when unchecked', () => {
      render(<Checkbox checked={false} data-testid="checkbox" />)

      const checkbox = screen.getByTestId('checkbox')
      // When unchecked, no indicator should be visible
      expect(checkbox.querySelector('svg')).not.toBeInTheDocument()
    })
  })

  describe('Toggle Behavior', () => {
    it('should toggle on click', async () => {
      const user = userEvent.setup()
      render(<Checkbox defaultChecked={false} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)

      expect(checkbox).toBeChecked()
    })

    it('should toggle off when clicked while checked', async () => {
      const user = userEvent.setup()
      render(<Checkbox defaultChecked />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()

      await user.click(checkbox)

      expect(checkbox).not.toBeChecked()
    })

    it('should call onCheckedChange when toggled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(<Checkbox onCheckedChange={handleChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should call onCheckedChange with false when unchecking', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(<Checkbox defaultChecked onCheckedChange={handleChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('should support controlled component pattern', async () => {
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false)
        return (
          <Checkbox
            checked={checked}
            onCheckedChange={(c) => setChecked(c === true)}
          />
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('Disabled State', () => {
    it('should support disabled prop', () => {
      render(<Checkbox disabled />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })

    it('should apply disabled styling', () => {
      render(<Checkbox disabled />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox.className).toMatch(/disabled:|opacity-/)
    })

    it('should not toggle when disabled', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(<Checkbox disabled onCheckedChange={handleChange} />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).not.toHaveBeenCalled()
    })

    it('should have cursor-not-allowed style when disabled', () => {
      render(<Checkbox disabled />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox.className).toMatch(/cursor-not-allowed/)
    })
  })

  describe('Styling', () => {
    it('should apply custom className prop', () => {
      render(<Checkbox className="custom-class" />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('custom-class')
    })

    it('should have border styling', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox.className).toMatch(/border/)
    })

    it('should have rounded styling', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox.className).toMatch(/rounded/)
    })

    it('should have focus ring styles', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox.className).toMatch(/focus-visible:|focus:/)
    })

    it('should have appropriate size', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      // Standard checkbox size
      expect(checkbox.className).toMatch(/h-4|w-4|size-4/)
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label via aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />)

      const checkbox = screen.getByLabelText('Accept terms')
      expect(checkbox).toBeInTheDocument()
    })

    it('should associate with external label via id', () => {
      render(
        <div>
          <label htmlFor="terms-checkbox">Accept Terms</label>
          <Checkbox id="terms-checkbox" />
        </div>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('id', 'terms-checkbox')
    })

    it('should have aria-checked attribute', () => {
      render(<Checkbox checked />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('should update aria-checked when toggled', async () => {
      const user = userEvent.setup()
      render(<Checkbox defaultChecked={false} />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')

      await user.click(checkbox)

      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })

    it('should be focusable', () => {
      render(<Checkbox />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      expect(document.activeElement).toBe(checkbox)
    })

    it('should toggle on Space key press', async () => {
      const user = userEvent.setup()
      render(<Checkbox defaultChecked={false} />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      await user.keyboard(' ')

      expect(checkbox).toBeChecked()
    })

    it('should toggle on Enter key press', async () => {
      const user = userEvent.setup()
      render(<Checkbox defaultChecked={false} />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()

      await user.keyboard('{Enter}')

      expect(checkbox).toBeChecked()
    })
  })

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Checkbox ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('should allow programmatic focus via ref', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Checkbox ref={ref} />)

      ref.current?.focus()

      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('Form Integration', () => {
    it('should support name prop for forms', () => {
      render(<Checkbox name="acceptTerms" />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('name', 'acceptTerms')
    })

    it('should support value prop for forms', () => {
      render(<Checkbox value="accepted" />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('value', 'accepted')
    })

    it('should support required prop', () => {
      render(<Checkbox required />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-required', 'true')
    })
  })

  describe('Indeterminate State', () => {
    it('should support indeterminate state', () => {
      render(<Checkbox checked="indeterminate" />)

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed')
    })

    it('should display minus icon when indeterminate', () => {
      render(<Checkbox checked="indeterminate" data-testid="checkbox" />)

      const checkbox = screen.getByTestId('checkbox')
      // Should show an indicator (minus icon for indeterminate)
      expect(checkbox.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Additional Props', () => {
    it('should spread additional props to button element', () => {
      render(<Checkbox data-testid="custom-checkbox" />)

      const checkbox = screen.getByTestId('custom-checkbox')
      expect(checkbox).toBeInTheDocument()
    })
  })
})

describe('Checkbox with Label Pattern', () => {
  it('should work with label element wrapping', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(
      <label className="flex items-center gap-2">
        <Checkbox onCheckedChange={handleChange} />
        <span>Accept terms and conditions</span>
      </label>
    )

    // Click on the label text should toggle checkbox
    await user.click(screen.getByText('Accept terms and conditions'))

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should work with Label component', async () => {
    const user = userEvent.setup()

    render(
      <div className="flex items-center gap-2">
        <Checkbox id="terms" defaultChecked={false} />
        <label htmlFor="terms">Accept terms</label>
      </div>
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(screen.getByText('Accept terms'))

    expect(checkbox).toBeChecked()
  })
})
