# Typography - Parade

> Typography system using system fonts and Tailwind CSS

---

## Font Families

### Primary Font
- **Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`
- **Usage**: All UI text, body copy
- **Applied in**: `src/renderer/styles/globals.css`

### Monospace Font
- **Stack**: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace`
- **Usage**: Code blocks, task IDs, commands, technical content
- **Tailwind class**: `font-mono`

---

## Type Scale (Tailwind)

Tailwind utility classes used throughout the app:

| Name | Tailwind Class | Size | Weight | Line Height | Usage |
|------|----------------|------|--------|-------------|-------|
| H1 | `text-2xl font-bold` | 24px (1.5rem) | 700 | 1.33 | Page titles |
| H2 | `text-xl font-semibold` | 20px (1.25rem) | 600 | 1.4 | Section headings |
| H3 | `text-lg font-semibold` | 18px (1.125rem) | 600 | 1.5 | Card titles |
| Body | `text-base` | 16px (1rem) | 400 | 1.5 | Standard body text |
| Body Small | `text-sm` | 14px (0.875rem) | 400 | 1.43 | Secondary content |
| Caption | `text-xs` | 12px (0.75rem) | 400 | 1.33 | Labels, badges, metadata |
| Code | `font-mono text-sm` | 14px (0.875rem) | 400 | 1.43 | Inline code, IDs |

---

## Text Colors (Tailwind Utilities)

Using CSS variables and Tailwind utilities:

| Context | Tailwind Class | HSL Variable | Usage |
|---------|----------------|--------------|-------|
| Primary | `text-foreground` or `text-slate-100` | `210 40% 98%` | Main content |
| Secondary | `text-muted-foreground` or `text-slate-400` | `215 20.2% 65.1%` | Supporting text |
| Accent | `text-primary` or `text-sky-500` | `199.09 89.13% 48.04%` | Links, CTAs |
| Success | `text-green-400` | - | Success messages |
| Warning | `text-amber-400` | - | Warnings |
| Error | `text-red-400` | - | Errors, destructive |

---

## Component Typography Examples

### Brief Card
```tsx
<h4 className="font-medium text-sm text-slate-100 line-clamp-2">
  {brief.title}
</h4>
<p className="text-xs text-slate-400 mt-1 line-clamp-2">
  {brief.description}
</p>
<span className="text-xs text-slate-400">
  {formatDate(brief.created_at)}
</span>
```

### Status Badge
```tsx
<Badge className="text-xs font-semibold uppercase">
  {status}
</Badge>
```

### Card Headers (shadcn/ui)
```tsx
<CardTitle className="font-semibold leading-none tracking-tight">
  Section Title
</CardTitle>
<CardDescription className="text-sm text-muted-foreground">
  Supporting description
</CardDescription>
```

### Button Text
```tsx
<Button className="text-sm font-medium">
  Action Label
</Button>
```

---

## Font Weight Scale

| Name | Tailwind | Value | Usage |
|------|----------|-------|-------|
| Regular | `font-normal` | 400 | Body text, descriptions |
| Medium | `font-medium` | 500 | Card titles, emphasis |
| Semibold | `font-semibold` | 600 | Headings, section titles |
| Bold | `font-bold` | 700 | Major headings, CTAs |

---

## Line Clamping

Truncate text with Tailwind utilities:

```tsx
// Clamp to 2 lines
<p className="line-clamp-2">Long text content...</p>

// Clamp to 1 line
<h4 className="line-clamp-1">Title that may overflow</h4>

// Truncate with ellipsis
<span className="truncate">Single line truncation</span>
```

---

## Usage Guidelines

### Hierarchy
- Use size, weight, and color together to create hierarchy
- Limit to 2-3 font sizes per view for consistency
- Use `font-medium` for subtle emphasis, `font-semibold` for headings

### Color Contrast
- Primary text (`text-slate-100`) meets WCAG AA on dark backgrounds
- Muted text (`text-slate-400`) maintains sufficient contrast on `slate-900`
- Avoid `text-slate-500` or darker on dark backgrounds

### Semantic Classes
Prefer semantic Tailwind utilities:
```tsx
// Good - semantic
<p className="text-muted-foreground">Secondary text</p>

// Also good - explicit color for design intent
<p className="text-slate-400">Metadata</p>
```

### Responsive Typography
Use responsive modifiers when needed:
```tsx
<h1 className="text-xl md:text-2xl lg:text-3xl">
  Responsive Heading
</h1>
```

---

*Updated for Tailwind CSS and shadcn/ui implementation*
