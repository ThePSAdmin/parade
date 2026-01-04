import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, onCheckedChange, onKeyDown, name, ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement | null>(null)
  const combinedRef = (node: HTMLButtonElement | null) => {
    internalRef.current = node
    if (typeof ref === "function") {
      ref(node)
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
  }

  // Set name attribute directly on the button element after mount
  // Radix uses name for internal hidden input, but tests expect it on button
  React.useEffect(() => {
    if (name && internalRef.current) {
      internalRef.current.setAttribute("name", name)
    }
  }, [name])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Add Enter key support in addition to Space (Radix default)
    if (e.key === "Enter") {
      e.preventDefault()
      // Simulate a click to toggle for both controlled and uncontrolled modes
      internalRef.current?.click()
    }
    onKeyDown?.(e)
  }

  return (
    <CheckboxPrimitive.Root
      ref={combinedRef}
      checked={checked}
      onCheckedChange={onCheckedChange}
      onKeyDown={handleKeyDown}
      name={name}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {checked === "indeterminate" ? (
          <Minus className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
