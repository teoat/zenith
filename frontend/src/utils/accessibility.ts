/**
 * Accessibility utilities for testing
 */

export interface AccessibilityResult {
  score: number;
  violations: Array<{
    rule: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    element?: string;
  }>;
  summary: {
    passed: number;
    failed: number;
    incomplete: number;
    inapplicable: number;
  };
}

export async function checkAccessibility(
  _container: HTMLElement,
  _options?: { rules?: string[]; level?: 'A' | 'AA' | 'AAA' }
): Promise<AccessibilityResult> {
  // Mock implementation for testing
  return {
    score: 100,
    violations: [],
    summary: {
      passed: 15,
      failed: 0,
      incomplete: 0,
      inapplicable: 2
    }
  };
}

export function getAccessibilityViolations(
  _container: HTMLElement
): AccessibilityResult['violations'] {
  // Mock implementation
  return [];
}