# Icons - Parade

> lucide-react icon system for consistent, scalable icons

---

## Icon Library

The app uses [lucide-react](https://lucide.dev/) for all icons, replacing the previous emoji-based system. All icon mappings are centralized in `src/renderer/lib/iconMap.ts`.

### Why lucide-react?

- Consistent, professional appearance
- Scalable (SVG-based)
- Accessible (proper ARIA attributes)
- Tree-shakeable (only imports used icons)
- 1000+ icons available

---

## Icon Mapping System

Icons are organized into categorical mappings for easy lookup and consistency.

### Status Icons

Used for brief, epic, and task statuses:

```tsx
import { StatusIcons, getStatusIcon } from '@renderer/lib/iconMap';

// Brief statuses
StatusIcons.draft          // FileText
StatusIcons.in_discovery   // Search
StatusIcons.spec_ready     // ClipboardList
StatusIcons.approved       // CheckCircle
StatusIcons.exported       // Rocket

// Epic/Task statuses
StatusIcons.open           // Circle
StatusIcons.in_progress    // PlayCircle
StatusIcons.deferred       // Pause
StatusIcons.closed         // CheckCircle2

// Additional states
StatusIcons.review         // Eye
StatusIcons.blocked        // Ban
StatusIcons.failed         // XCircle
StatusIcons.success        // Check
```

**Usage:**
```tsx
const StatusIcon = getStatusIcon('in_progress');
<StatusIcon className="w-4 h-4 text-sky-500" />
```

---

### Activity Icons

Used for workflow events and activity timeline:

```tsx
import { ActivityIcons, getActivityIcon } from '@renderer/lib/iconMap';

ActivityIcons.discovery_started         // Search
ActivityIcons.questions_generated       // HelpCircle
ActivityIcons.questions_answered        // Edit3
ActivityIcons.sme_technical_complete    // Wrench
ActivityIcons.sme_business_complete     // BarChart3
ActivityIcons.spec_generated            // ClipboardList
ActivityIcons.exported                  // Rocket
ActivityIcons.default                   // Pin
ActivityIcons.activity_header           // Radio
```

**Usage:**
```tsx
const ActivityIcon = getActivityIcon(event.type);
<ActivityIcon className="w-5 h-5 text-slate-400" />
```

---

### Agent Icons

Icons for different SME agent types:

```tsx
import { AgentIcons, getAgentIcon } from '@renderer/lib/iconMap';

AgentIcons['technical-sme']  // Wrench
AgentIcons['business-sme']   // Briefcase
AgentIcons['ux-sme']         // Palette
AgentIcons.default           // Bot
```

**Usage:**
```tsx
const AgentIcon = getAgentIcon(agent.type);
<AgentIcon className="w-5 h-5" />
```

---

### Toast Icons

Icons for notification/toast messages:

```tsx
import { ToastIcons, getToastIcon } from '@renderer/lib/iconMap';

ToastIcons.success   // Check
ToastIcons.error     // X
ToastIcons.warning   // AlertTriangle
ToastIcons.info      // Info
```

**Usage:**
```tsx
const ToastIcon = getToastIcon('success');
<ToastIcon className="w-5 h-5 text-green-400" />
```

---

### Priority Icons

Icons for priority levels (future use):

```tsx
import { PriorityIcons } from '@renderer/lib/iconMap';

PriorityIcons.critical  // AlertCircle
PriorityIcons.high      // AlertTriangle
PriorityIcons.medium    // AlertCircle
PriorityIcons.low       // Info
```

---

### Navigation Icons

Icons for app navigation (future use):

```tsx
import { NavigationIcons } from '@renderer/lib/iconMap';

NavigationIcons.pipeline   // BarChart3
NavigationIcons.briefs     // FileText
NavigationIcons.kanban     // ClipboardList
NavigationIcons.settings   // Circle (placeholder)
```

---

## Icon Sizing

Use Tailwind utilities for consistent sizing:

```tsx
// Extra small (16px)
<Icon className="w-4 h-4" />

// Small (20px)
<Icon className="w-5 h-5" />

// Medium (24px)
<Icon className="w-6 h-6" />

// Large (32px)
<Icon className="w-8 h-8" />

// Custom size
<Icon className="w-12 h-12" />
```

---

## Icon Colors

Match icon colors to context using Tailwind utilities:

```tsx
// Primary/accent
<Icon className="text-sky-500" />

// Muted/secondary
<Icon className="text-slate-400" />

// Success
<Icon className="text-green-400" />

// Error
<Icon className="text-red-400" />

// Warning
<Icon className="text-amber-400" />

// Inherit from parent
<Icon className="text-current" />
```

---

## Common Patterns

### Icon with Text

```tsx
<div className="flex items-center gap-2">
  <CheckCircle className="w-4 h-4 text-green-400" />
  <span className="text-sm text-slate-100">Completed</span>
</div>
```

### Icon Button

```tsx
import { Button } from '@renderer/components/ui/button';
import { X } from 'lucide-react';

<Button variant="ghost" size="icon">
  <X className="w-4 h-4" />
</Button>
```

### Status Indicator

```tsx
import { getStatusIcon } from '@renderer/lib/iconMap';

const StatusIcon = getStatusIcon(status);
<div className="flex items-center gap-1.5">
  <StatusIcon className="w-3.5 h-3.5 text-sky-500" />
  <span className="text-xs uppercase">{status}</span>
</div>
```

### Icon in Badge

```tsx
import { Badge } from '@renderer/components/ui/badge';
import { Rocket } from 'lucide-react';

<Badge className="flex items-center gap-1">
  <Rocket className="w-3 h-3" />
  <span>Exported</span>
</Badge>
```

---

## Helper Functions

The icon mapping system provides helper functions for safe icon lookup:

```tsx
import { getIcon, getStatusIcon, getActivityIcon,
         getAgentIcon, getToastIcon } from '@renderer/lib/iconMap';

// Generic icon lookup with fallback
const Icon = getIcon(StatusIcons, 'unknown_status', Circle);

// Specific helpers (with built-in fallbacks)
const StatusIcon = getStatusIcon('in_progress');
const ActivityIcon = getActivityIcon('discovery_started');
const AgentIcon = getAgentIcon('technical-sme');
const ToastIcon = getToastIcon('success');
```

---

## Importing Individual Icons

For icons not in the mapping system, import directly from lucide-react:

```tsx
import { ArrowRight, Download, Upload, Trash2 } from 'lucide-react';

<Button>
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>
```

**Available icons**: Browse the full catalog at [lucide.dev](https://lucide.dev/)

---

## Accessibility

lucide-react icons include proper ARIA attributes by default. For additional context:

```tsx
// Decorative icon (aria-hidden by default)
<Icon className="w-4 h-4" />

// Semantic icon with label
<Icon className="w-4 h-4" aria-label="Status: In Progress" />

// Icon button with accessible label
<Button variant="ghost" size="icon" aria-label="Close">
  <X className="w-4 h-4" />
</Button>
```

---

## Customization

Icons can be styled with CSS or Tailwind utilities:

```tsx
// Stroke width
<Icon strokeWidth={1.5} />  // Thinner (default: 2)
<Icon strokeWidth={2.5} />  // Thicker

// Animation
<Icon className="animate-spin" />  // Spinning loader
<Icon className="transition-transform hover:scale-110" />

// Opacity
<Icon className="opacity-50" />
```

---

## Icon Map Reference

Complete icon mapping object for programmatic access:

```tsx
import { IconMap } from '@renderer/lib/iconMap';

IconMap.status      // StatusIcons
IconMap.activity    // ActivityIcons
IconMap.agent       // AgentIcons
IconMap.toast       // ToastIcons
IconMap.priority    // PriorityIcons
IconMap.navigation  // NavigationIcons
```

---

*Created for lucide-react icon system implementation*
