# Color Palette - Parade

> shadcn/ui dark mode design system with slate/sky palette

---

## Primary Palette

| Name | Tailwind | HSL | Usage |
|------|----------|-----|-------|
| Primary | `sky-500` | `199.09 89.13% 48.04%` | Main actions, links, focus states, accent color |
| Background | `slate-950` | `222.2 47.4% 11.2%` | App background |
| Card | `slate-900` | `217.2 32.6% 17.5%` | Cards, panels, containers |
| Secondary | `slate-800` | `215 27.9% 16.9%` | Hover states, elevated surfaces |
| Border | `slate-800` | `215 27.9% 16.9%` | Borders, dividers, inputs |

## Text Colors

| Name | Tailwind | HSL | Usage |
|------|----------|-----|-------|
| Foreground | `slate-100` | `210 40% 98%` | Primary text content |
| Muted Foreground | `slate-400` | `215 20.2% 65.1%` | Secondary/muted text |

## Semantic Colors

| Name | Usage | HSL |
|------|-------|-----|
| Destructive | Errors, delete actions | `0 62.8% 30.6%` |
| Destructive Foreground | Text on destructive backgrounds | `210 40% 98%` |

---

## CSS Variables

The color system is defined using CSS custom properties in `src/renderer/styles/globals.css`:

```css
.dark {
  /* Backgrounds */
  --background: 222.2 47.4% 11.2%;        /* slate-950 */
  --card: 217.2 32.6% 17.5%;               /* slate-900 */
  --popover: 217.2 32.6% 17.5%;            /* slate-900 */

  /* Text */
  --foreground: 210 40% 98%;               /* slate-100 */
  --card-foreground: 210 40% 98%;          /* slate-100 */
  --muted-foreground: 215 20.2% 65.1%;     /* slate-400 */

  /* Accents */
  --primary: 199.09 89.13% 48.04%;         /* sky-500 */
  --primary-foreground: 222.2 47.4% 11.2%; /* slate-950 */
  --secondary: 215 27.9% 16.9%;            /* slate-800 */
  --accent: 215 27.9% 16.9%;               /* slate-800 */

  /* Borders & Input */
  --border: 215 27.9% 16.9%;               /* slate-800 */
  --input: 215 27.9% 16.9%;                /* slate-800 */
  --ring: 199.09 89.13% 48.04%;            /* sky-500 */

  /* Semantic */
  --destructive: 0 62.8% 30.6%;            /* red-500 */
  --muted: 217.2 32.6% 17.5%;              /* slate-900 */
}
```

## Workflow Status Colors

Status colors use Tailwind utility classes with opacity modifiers:

| Status | Background | Text | Border |
|--------|------------|------|--------|
| P1 (Critical) | `bg-red-500/20` | `text-red-400` | `border-red-500/30` |
| P2 (High) | `bg-amber-400/20` | `text-amber-400` | `border-amber-400/30` |
| P3 (Medium) | `bg-yellow-500/20` | `text-yellow-400` | `border-yellow-500/30` |
| P4 (Low) | `bg-slate-700` | `text-slate-400` | `border-slate-600` |
| Selected State | `ring-2 ring-sky-500` | - | `border-sky-500` |
| Hover State | `hover:bg-slate-800` | - | - |

---

## Usage in Tailwind

Access colors via Tailwind utilities or HSL variables:

```tsx
// Using Tailwind utilities
<div className="bg-slate-900 border-slate-800 text-slate-100">

// Using CSS variables
<div className="bg-card border-border text-foreground">

// Using hsl() function
<div style={{ backgroundColor: 'hsl(var(--primary))' }}>
```

---

## Contrast & Accessibility

- Primary text (`slate-100`) on dark backgrounds meets WCAG AA standards
- Muted text (`slate-400`) maintains 4.5:1 contrast ratio on `slate-900`
- Sky-500 accent provides vibrant contrast against slate backgrounds
- All status colors use sufficient opacity to maintain readability

---

*Updated for shadcn/ui implementation*
