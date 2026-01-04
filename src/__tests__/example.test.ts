import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should perform basic arithmetic correctly', () => {
    expect(1 + 1).toBe(2)
    expect(5 - 3).toBe(2)
    expect(3 * 4).toBe(12)
    expect(10 / 2).toBe(5)
  })

  it('should handle string operations', () => {
    const greeting = 'Hello'
    const name = 'Vitest'
    expect(`${greeting} ${name}`).toBe('Hello Vitest')
  })

  it('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers).toContain(3)
    expect(numbers[0]).toBe(1)
  })

  it('should work with objects', () => {
    const user = {
      name: 'Test User',
      role: 'developer',
      active: true,
    }
    expect(user.name).toBe('Test User')
    expect(user.active).toBe(true)
    expect(user).toHaveProperty('role')
  })

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success')
    await expect(promise).resolves.toBe('success')
  })
})

describe('TypeScript Integration', () => {
  it('should work with TypeScript types', () => {
    interface Config {
      name: string
      version: number
      enabled: boolean
    }

    const config: Config = {
      name: 'test-config',
      version: 1,
      enabled: true,
    }

    expect(config.name).toBe('test-config')
    expect(config.version).toBe(1)
    expect(config.enabled).toBe(true)
  })
})
