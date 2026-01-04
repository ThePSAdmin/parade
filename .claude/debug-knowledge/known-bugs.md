# Known Bugs

**Purpose**: Document previously encountered bugs with their symptoms, root causes, and fixes. Use this to quickly resolve recurring issues.

**How to use**: Search by error message or symptom to find known solutions.

---

## Table of Contents

<!-- Auto-generated TOC - update when adding entries -->

1. [Example Bug Entry](#example-bug-entry)

---

## Adding New Entries

When documenting a new bug, use this template:

```markdown
### [Brief Bug Title]

**Date Discovered**: YYYY-MM-DD
**Severity**: [Critical|High|Medium|Low]
**Status**: [Fixed|Workaround|Open]

**Symptom**:
Describe what the user/developer experiences. Include exact error messages if applicable.

**Error Messages**:
```
Paste exact error text here
```

**Root Cause**:
Explain what was actually wrong in the code or configuration.

**Fix/Workaround**:
Step-by-step resolution or workaround.

**Related Files**:
- path/to/affected/file.ts
- path/to/test/file.spec.ts

**Tags**: #tag1 #tag2 #component-name
```

---

## Example Entries

### Example Bug Entry

**Date Discovered**: 2026-01-02
**Severity**: Medium
**Status**: Fixed

**Symptom**:
Application crashes on startup with "Cannot read property 'x' of undefined"

**Error Messages**:
```
TypeError: Cannot read property 'x' of undefined
    at Object.<anonymous> (src/main.ts:45:12)
```

**Root Cause**:
Configuration object was not initialized before being accessed in the startup sequence.

**Fix/Workaround**:
1. Initialize config object before app.on('ready')
2. Add null check: `if (config && config.x)`
3. Add unit test to verify initialization order

**Related Files**:
- src/main.ts
- src/config.ts

**Tags**: #startup #initialization #config

---

## Active Bugs

<!-- List bugs currently being investigated -->

---

## Resolved Bugs

<!-- Archive of fixed bugs for reference -->
