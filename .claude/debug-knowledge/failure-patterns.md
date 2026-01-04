# Test Failure Patterns

**Purpose**: Document common patterns of test failures encountered during test-first development. Use this to quickly diagnose and fix failing tests.

**Categories**: Test Setup, Async Issues, Mocking, Assertions, Test Isolation

---

## Table of Contents

1. [Test Setup Patterns](#test-setup-patterns)
2. [Async Issues](#async-issues)
3. [Mocking Problems](#mocking-problems)
4. [Assertion Failures](#assertion-failures)
5. [Test Isolation Issues](#test-isolation-issues)

---

## Adding New Patterns

Use this template when documenting a new failure pattern:

```markdown
### Pattern Name

**Category**: [Test Setup|Async|Mocking|Assertions|Isolation]
**Frequency**: [Common|Occasional|Rare]

**Symptoms**:
- What the test output shows
- Specific error messages or behaviors

**Common Causes**:
1. First possible cause
2. Second possible cause

**Resolution Steps**:
1. First thing to check
2. Second thing to try
3. How to verify the fix

**Example**:
```typescript
// Bad
describe('example', () => {
  // problematic code
});

// Good
describe('example', () => {
  // corrected code
});
```

**Related Patterns**: Links to similar patterns
```

---

## Test Setup Patterns

### Incomplete Test Environment Setup

**Category**: Test Setup
**Frequency**: Common

**Symptoms**:
- Tests fail with "undefined is not a function"
- Module import errors
- Missing global objects

**Common Causes**:
1. Missing beforeEach/beforeAll setup
2. Test environment not configured for Node/JSDOM
3. Required mocks not initialized

**Resolution Steps**:
1. Check vitest.config.ts for correct environment
2. Verify all globals are mocked in setupTests.ts
3. Add proper beforeEach cleanup
4. Ensure imports are complete

**Example**:
```typescript
// Bad - no setup
describe('Component', () => {
  it('should work', () => {
    const result = processData();
    expect(result).toBeDefined();
  });
});

// Good - proper setup
describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTestEnvironment();
  });

  it('should work', () => {
    const result = processData();
    expect(result).toBeDefined();
  });
});
```

---

## Async Issues

### Unhandled Promise Rejection

**Category**: Async
**Frequency**: Common

**Symptoms**:
- Test passes but shows unhandled promise warning
- Intermittent failures
- "done() called multiple times" errors

**Common Causes**:
1. Missing await in async test
2. Promise not properly caught
3. Async callback not completed

**Resolution Steps**:
1. Add async/await to test function
2. Use waitFor() for async state changes
3. Properly handle promise rejection with try/catch
4. Verify all promises are awaited

**Example**:
```typescript
// Bad
it('should fetch data', () => {
  const promise = fetchData();
  expect(promise).toBeDefined();
});

// Good
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

---

## Mocking Problems

### Mock Not Applied

**Category**: Mocking
**Frequency**: Common

**Symptoms**:
- Real implementation called instead of mock
- "X is not a function" when it should be mocked
- Mock assertions fail

**Common Causes**:
1. Mock defined after import
2. vi.mock() not hoisted properly
3. Mock path incorrect
4. Module cache not cleared

**Resolution Steps**:
1. Move vi.mock() to top of file
2. Verify mock path matches import exactly
3. Call vi.clearAllMocks() in beforeEach
4. Check if module needs unmocking between tests

**Example**:
```typescript
// Bad
import { myFunction } from './module';
vi.mock('./module');

// Good
vi.mock('./module');
import { myFunction } from './module';

describe('test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
});
```

---

## Assertion Failures

### Flaky Assertions

**Category**: Assertions
**Frequency**: Occasional

**Symptoms**:
- Test passes sometimes, fails other times
- Timing-dependent failures
- Different results in CI vs local

**Common Causes**:
1. Race condition in async code
2. Test depends on external state
3. Non-deterministic code (random, Date.now())
4. Shared state between tests

**Resolution Steps**:
1. Mock Date.now() or Math.random()
2. Use waitFor() with proper timeout
3. Add test isolation with beforeEach cleanup
4. Verify no shared mutable state

**Example**:
```typescript
// Bad
it('should have recent timestamp', () => {
  const result = createRecord();
  expect(result.timestamp).toBe(Date.now());
});

// Good
it('should have recent timestamp', () => {
  const mockNow = 1234567890;
  vi.spyOn(Date, 'now').mockReturnValue(mockNow);
  const result = createRecord();
  expect(result.timestamp).toBe(mockNow);
});
```

---

## Test Isolation Issues

### Shared State Pollution

**Category**: Isolation
**Frequency**: Common

**Symptoms**:
- Tests pass individually but fail when run together
- Order-dependent failures
- State leaking between tests

**Common Causes**:
1. No cleanup in afterEach
2. Singleton modules retaining state
3. Global variables modified
4. Mocks not reset

**Resolution Steps**:
1. Add afterEach cleanup
2. Reset all mocks with vi.clearAllMocks()
3. Use fresh object instances per test
4. Avoid module-level mutations

**Example**:
```typescript
// Bad
const sharedConfig = { value: 0 };
describe('tests', () => {
  it('test 1', () => {
    sharedConfig.value = 1;
    expect(sharedConfig.value).toBe(1);
  });
  it('test 2', () => {
    // Fails - value is still 1 from test 1
    expect(sharedConfig.value).toBe(0);
  });
});

// Good
describe('tests', () => {
  let config: Config;

  beforeEach(() => {
    config = { value: 0 };
  });

  it('test 1', () => {
    config.value = 1;
    expect(config.value).toBe(1);
  });

  it('test 2', () => {
    expect(config.value).toBe(0); // Passes - fresh config
  });
});
```
