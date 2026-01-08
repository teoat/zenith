import React, { useEffect } from 'react';
import axe from 'axe-core';

interface AccessibilityCheckerProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({
  children,
  enabled = process.env.NODE_ENV === 'development'
}) => {
  useEffect(() => {
    if (!enabled) return;

    const runAccessibilityCheck = async () => {
      try {
        const results = await axe.run(document);
        const violations = results.violations;

        if (violations.length > 0) {
          console.group('🚨 Accessibility Violations Found');
          violations.forEach((violation, index) => {
            console.group(`Violation ${index + 1}: ${violation.id}`);
            console.log('Description:', violation.description);
            console.log('Impact:', violation.impact);
            console.log('Help:', violation.help);
            console.log('Help URL:', violation.helpUrl);
            console.log('Elements:', violation.nodes.map(node => node.target).join(', '));
            console.groupEnd();
          });
          console.groupEnd();
        } else {
          console.log('✅ No accessibility violations found');
        }
      } catch (err) {
        console.error('Accessibility check failed:', err);
      }
    };

    // Run check after component mounts and on route changes
    const timeoutId = setTimeout(runAccessibilityCheck, 1000);

    return () => clearTimeout(timeoutId);
  }, [enabled]);

  return <>{children}</>;
};

// Utility function for manual accessibility testing
export const runAccessibilityAudit = async (context?: Element) => {
  try {
    const results = await axe.run(context || document);
    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable
    };
  } catch (err) {
    console.error('Accessibility audit failed:', err);
    return null;
  }
};