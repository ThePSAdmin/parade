# Component Patterns - Parade

> shadcn/ui component library for Parade

---

## shadcn/ui Components

The app uses shadcn/ui components with custom styling. All components are located in `src/renderer/components/ui/`.

### Button

Built with class-variance-authority (CVA) for variant management.

**Variants:**
```tsx
import { Button } from '@renderer/components/ui/button';

// Primary action (sky-500 background)
<Button variant="default">Save</Button>

// Destructive action (red-500)
<Button variant="destructive">Delete</Button>

// Outlined (border with hover)
<Button variant="outline">Cancel</Button>

// Secondary (slate-800 background)
<Button variant="secondary">Options</Button>

// Ghost (transparent with hover)
<Button variant="ghost">Close</Button>

// Link style
<Button variant="link">Learn more</Button>
```

**Sizes:**
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>
```

**Properties:**
- Uses `hsl(var(--primary))` for default variant
- Focus ring: `ring-1 ring-ring` (sky-500)
- Disabled: 50% opacity, no pointer events
- Icon support: `[&_svg]:size-4` for auto-sizing

---

### Card

Semantic card component with composable sub-components.

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription,
         CardContent, CardFooter } from '@renderer/components/ui/card';

<Card className="bg-slate-900 border-slate-800">
  <CardHeader>
    <CardTitle>Brief Title</CardTitle>
    <CardDescription>Additional context</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-slate-100">Main content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Default Styling:**
- Border radius: `rounded-xl`
- Background: `bg-card` (slate-900)
- Border: `border` (slate-800)
- Shadow: `shadow`
- Padding: CardHeader/CardContent/CardFooter use `p-6`

**Example (BriefCard):**
```tsx
<Card
  className={`bg-slate-900 border-slate-800 cursor-pointer
              hover:bg-slate-800 transition-all
              ${isSelected ? 'ring-2 ring-sky-500 border-sky-500' : ''}`}
>
  <CardContent className="p-3">
    <h4 className="font-medium text-sm text-slate-100">{title}</h4>
    <p className="text-xs text-slate-400 mt-1">{description}</p>
  </CardContent>
</Card>
```

---

### Badge

Compact status indicators with variants.

**Usage:**
```tsx
import { Badge } from '@renderer/components/ui/badge';

<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outlined</Badge>
```

**Custom Status Badge Example:**
```tsx
function PriorityBadge({ priority }: { priority: BriefPriority }) {
  const colors = {
    1: 'bg-red-500/20 text-red-400 border-red-500/30',
    2: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    3: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    4: 'bg-slate-700 text-slate-400 border-slate-600',
  };
  return (
    <Badge variant="outline" className={colors[priority]}>
      P{priority}
    </Badge>
  );
}
```

**Properties:**
- Border radius: `rounded-md`
- Padding: `px-2.5 py-0.5`
- Font: `text-xs font-semibold`
- Focus ring support: `ring-2 ring-ring ring-offset-2`

---

### Input & Label

Form components with consistent styling.

**Usage:**
```tsx
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';

<div>
  <Label htmlFor="title">Title</Label>
  <Input
    id="title"
    placeholder="Enter title..."
    className="bg-slate-900 border-slate-800"
  />
</div>
```

---

### Select

Dropdown select component (uses Radix UI primitives).

**Usage:**
```tsx
import { Select, SelectContent, SelectItem,
         SelectTrigger, SelectValue } from '@renderer/components/ui/select';

<Select onValueChange={handleChange}>
  <SelectTrigger className="bg-slate-900 border-slate-800">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Dialog

Modal dialog with backdrop and animations.

**Usage:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle,
         DialogDescription, DialogFooter } from '@renderer/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="bg-slate-900 border-slate-800">
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Tabs

Tabbed navigation component.

**Usage:**
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList className="bg-slate-900">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="details">Details content</TabsContent>
</Tabs>
```

---

### Toast

Notification system for user feedback.

**Usage:**
```tsx
import { useToast } from '@renderer/components/ui/use-toast';
import { Toaster } from '@renderer/components/ui/toaster';

// In your component
const { toast } = useToast();

toast({
  title: "Success",
  description: "Brief created successfully",
  variant: "default", // or "destructive"
});

// Add <Toaster /> to your app root
```

---

### Other Components

Additional shadcn/ui components available:
- `Separator` - Visual divider
- `ScrollArea` - Custom scrollbar styling
- `Progress` - Progress bar indicator
- `Skeleton` - Loading placeholder
- `DropdownMenu` - Context menu with Radix UI

---

## Spacing System

Tailwind spacing scale used throughout:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 0.25rem (4px) | Tight spacing |
| `space-2` | 0.5rem (8px) | Related elements |
| `space-3` | 0.75rem (12px) | Card padding (compact) |
| `space-4` | 1rem (16px) | Standard spacing |
| `space-6` | 1.5rem (24px) | Section spacing |
| `space-8` | 2rem (32px) | Major sections |

---

## Animation & Transitions

shadcn/ui components include built-in transitions:

```tsx
// Button hover/active states
transition-colors // 150ms color transitions

// Card interactions
transition-all // All properties (bg, border, shadow)

// Dialog/Modal animations
// Enter: fade-in + scale-95 → scale-100
// Exit: fade-out + scale-100 → scale-95
```

**Custom Transition Classes:**
```css
.transition-colors {
  transition-property: background-color, border-color, color;
  transition-duration: 150ms;
}
```

---

*Updated for shadcn/ui implementation*
