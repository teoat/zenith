import { describe, test, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    test('merges Tailwind classes correctly', () => {
      const result = cn('bg-red-500', 'bg-blue-500')
      expect(result).toBe('bg-blue-500')
    })

    test('handles conditional classes', () => {
      const isTrue = true
      const isFalse = false
      const result = cn('bg-red-500', isTrue && 'text-white', isFalse && 'text-black')
      expect(result).toBe('bg-red-500 text-white')
    })

    test('handles array inputs', () => {
      const result = cn(['bg-red-500', 'text-white'], 'p-4')
      expect(result).toBe('bg-red-500 text-white p-4')
    })

    test('handles undefined and null values', () => {
      const result = cn('bg-red-500', undefined, null, 'text-white')
      expect(result).toBe('bg-red-500 text-white')
    })
  })
})
