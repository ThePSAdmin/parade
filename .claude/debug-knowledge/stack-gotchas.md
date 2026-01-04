# Stack-Specific Gotchas

**Purpose**: Document common pitfalls and quirks specific to our technology stack: Electron, TypeScript, Vitest.

**Stacks Covered**: Electron, TypeScript (strict mode), Vitest, Node.js

---

## Table of Contents

1. [Electron Gotchas](#electron-gotchas)
2. [Vitest Configuration](#vitest-configuration)
3. [TypeScript Strict Mode](#typescript-strict-mode)
4. [Electron + Vitest Integration](#electron--vitest-integration)

---

## Adding New Gotchas

Use this template:

```markdown
### Gotcha Title

**Stack**: [Electron|TypeScript|Vitest|Node]
**Impact**: [Breaking|Warning|Performance]

**The Problem**:
What goes wrong and when

**Why It Happens**:
Technical explanation of the underlying cause

**Solution**:
How to fix or work around it

**Example**:
```typescript
// Code example showing the issue and fix
```

**References**:
- Link to docs
- Related GitHub issues
```

---

## Electron Gotchas

### Cannot Use Node Modules in Renderer Without nodeIntegration

**Stack**: Electron
**Impact**: Breaking

**The Problem**:
Attempting to import Node.js modules (fs, path, etc.) in renderer process code throws "module not found" or "require is not defined" errors.

**Why It Happens**:
For security, Electron disables Node.js integration in renderer processes by default. The renderer runs in a browser-like context without access to Node APIs.

**Solution**:
1. Use preload scripts with contextBridge to expose safe APIs
2. Enable nodeIntegration (NOT recommended for security)
3. Move Node.js code to main process and use IPC

**Example**:
```typescript
// BAD - Direct Node.js import in renderer
// renderer.ts
import fs from 'fs'; // Error: module not found

// GOOD - Use preload script
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import fs from 'fs';

contextBridge.exposeInMainWorld('fileAPI', {
  readFile: (path: string) => fs.readFileSync(path, 'utf-8')
});

// renderer.ts
const content = window.fileAPI.readFile('/path/to/file');
```

**References**:
- https://www.electronjs.org/docs/latest/tutorial/context-isolation

---

### IPC Types Not Shared Between Main and Renderer

**Stack**: Electron + TypeScript
**Impact**: Warning

**The Problem**:
TypeScript can't infer types across IPC boundary, leading to `any` types and loss of type safety.

**Why It Happens**:
Main and renderer processes run in separate contexts with separate TypeScript compilations.

**Solution**:
1. Create shared types file for IPC contracts
2. Use type assertions in preload
3. Extend Window interface for exposed APIs

**Example**:
```typescript
// shared/ipc-types.ts
export interface FileAPI {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
}

// preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import type { FileAPI } from './shared/ipc-types';

const fileAPI: FileAPI = {
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content)
};

contextBridge.exposeInMainWorld('fileAPI', fileAPI);

// renderer.d.ts
import type { FileAPI } from './shared/ipc-types';

declare global {
  interface Window {
    fileAPI: FileAPI;
  }
}
```

---

## Vitest Configuration

### Vitest Can't Find Electron Modules

**Stack**: Vitest + Electron
**Impact**: Breaking

**The Problem**:
Tests fail with "Cannot find module 'electron'" even though Electron is installed.

**Why It Happens**:
Vitest runs in Node environment but Electron is a native module that expects to run in Electron context.

**Solution**:
1. Mock Electron in tests
2. Configure Vitest to use Node environment
3. Create test setup file with Electron mocks

**Example**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts']
  }
});

// test/setup.ts
import { vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/path'),
    on: vi.fn()
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn()
  }
}));
```

---

### Global Mocks Not Reset Between Tests

**Stack**: Vitest
**Impact**: Warning

**The Problem**:
Mocks from one test affect subsequent tests, causing unexpected failures.

**Why It Happens**:
Vitest doesn't automatically reset mocks between tests unless configured.

**Solution**:
Enable automatic mock clearing in config or manually reset in beforeEach.

**Example**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    clearMocks: true,      // Clear mock calls between tests
    mockReset: true,       // Reset mock implementation
    restoreMocks: true     // Restore original implementation
  }
});

// OR manually in test file
describe('suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
});
```

---

### Path Aliases Not Resolved in Tests

**Stack**: Vitest + TypeScript
**Impact**: Breaking

**The Problem**:
Import aliases like `@/components` work in app but fail in tests with "Cannot find module".

**Why It Happens**:
Vitest needs explicit configuration to resolve TypeScript path mappings.

**Solution**:
Configure alias resolution in vitest.config.ts to match tsconfig.json.

**Example**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // ... other config
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
```

---

## TypeScript Strict Mode

### Strict Null Checks Break Existing Code

**Stack**: TypeScript
**Impact**: Warning

**The Problem**:
Enabling `strictNullChecks` causes hundreds of "Object is possibly null/undefined" errors.

**Why It Happens**:
TypeScript now enforces that you handle null/undefined cases that were previously ignored.

**Solution**:
1. Use optional chaining: `obj?.property`
2. Add null checks: `if (obj !== null)`
3. Use non-null assertion when safe: `obj!.property`
4. Provide default values: `obj ?? defaultValue`

**Example**:
```typescript
// Before strict mode
function getName(user: User) {
  return user.name.toUpperCase(); // Crashes if name is null
}

// With strict null checks
function getName(user: User | null) {
  // Option 1: Optional chaining
  return user?.name?.toUpperCase();

  // Option 2: Null check
  if (user && user.name) {
    return user.name.toUpperCase();
  }

  // Option 3: Default value
  return (user?.name ?? 'Unknown').toUpperCase();
}
```

---

### Implicit Any in Function Parameters

**Stack**: TypeScript
**Impact**: Warning

**The Problem**:
Functions without parameter types throw "Parameter 'x' implicitly has an 'any' type" in strict mode.

**Why It Happens**:
`noImplicitAny` requires explicit types for all parameters.

**Solution**:
Always type function parameters, even if using inference elsewhere.

**Example**:
```typescript
// Bad
function process(data) { // Error: implicit any
  return data.value;
}

// Good
function process(data: { value: string }) {
  return data.value;
}

// Also good - using interface
interface ProcessData {
  value: string;
}

function process(data: ProcessData) {
  return data.value;
}
```

---

## Electron + Vitest Integration

### Cannot Test IPC Communication End-to-End

**Stack**: Electron + Vitest
**Impact**: Warning

**The Problem**:
IPC communication between main and renderer can't be tested in Vitest without running actual Electron.

**Why It Happens**:
Vitest runs in Node, not Electron, so real IPC channels don't exist.

**Solution**:
1. Test main and renderer IPC handlers separately with mocks
2. Use integration tests with Spectron/Playwright for E2E
3. Mock ipcMain and ipcRenderer

**Example**:
```typescript
// Test main process handler
describe('IPC Main', () => {
  it('should handle read-file', async () => {
    const { handler } = await import('../main/ipc-handlers');
    const result = await handler.readFile('/test/path');
    expect(result).toBeDefined();
  });
});

// Test renderer IPC call
describe('IPC Renderer', () => {
  it('should call read-file IPC', async () => {
    const mockInvoke = vi.fn().mockResolvedValue('file content');
    vi.mock('electron', () => ({
      ipcRenderer: { invoke: mockInvoke }
    }));

    const { readFile } = await import('../renderer/file-service');
    await readFile('/test/path');

    expect(mockInvoke).toHaveBeenCalledWith('read-file', '/test/path');
  });
});
```

---

### ESM vs CommonJS Module Conflicts

**Stack**: Vitest + TypeScript
**Impact**: Breaking

**The Problem**:
"Cannot use import statement outside a module" or "require is not defined" errors.

**Why It Happens**:
Mixing ESM and CommonJS modules without proper configuration.

**Solution**:
1. Set `"type": "module"` in package.json for ESM
2. Configure Vitest for ESM with proper extensions
3. Use consistent import style

**Example**:
```json
// package.json
{
  "type": "module"
}
```

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}']
  }
});
```

---

### Electron Native Modules Fail in Tests

**Stack**: Electron + Vitest
**Impact**: Breaking

**The Problem**:
Native Electron modules (like `better-sqlite3`) fail to load in Vitest.

**Why It Happens**:
Native modules are compiled for Electron's Node version, not system Node.

**Solution**:
1. Mock native modules in tests
2. Use conditional imports
3. Consider alternative pure JS libraries for testing

**Example**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts']
  }
});

// test/setup.ts
vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => ({
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn()
    }))
  }))
}));
```

**References**:
- https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules
