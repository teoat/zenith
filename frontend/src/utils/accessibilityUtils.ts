import axe from 'axe-core';
import { secureLogger } from './secureLogger';

/**
 * Utility function for manual accessibility testing
 */
export const runAccessibilityAudit = async (context?: Element) => {
  try {
    const results = await axe.run(context || document);
    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable
    };
  } catch (error) {
    secureLogger.error('ACCESSIBILITY', 'Accessibility audit failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
};
