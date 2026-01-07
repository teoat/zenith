import React, { useEffect } from "react";
import { secureLogger } from "@/utils/secureLogger";
import axe from "axe-core";

interface AccessibilityCheckerProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({
  children,
  enabled = process.env.NODE_ENV === "development",
}) => {
  useEffect(() => {
    if (!enabled) return;

    const runAccessibilityCheck = async () => {
      try {
        const results = await axe.run(document);
        const violations = results.violations;

        if (violations.length > 0) {
          secureLogger.warn(
            "ACCESSIBILITY",
            `Accessibility Violations Found: ${violations.length}`,
            {
              violations: violations.map((v) => ({
                id: v.id,
                description: v.description,
                impact: v.impact,
                help: v.help,
                helpUrl: v.helpUrl,
                elements: v.nodes.map((node) => node.target).join(", "),
              })),
            },
          );
        } else {
          secureLogger.info(
            "ACCESSIBILITY",
            "No accessibility violations found",
          );
        }
      } catch (error) {
        secureLogger.error("ACCESSIBILITY", "Accessibility check failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Run check after component mounts and on route changes
    const timeoutId = setTimeout(runAccessibilityCheck, 1000);

    return () => clearTimeout(timeoutId);
  }, [enabled]);

  return <>{children}</>;
};

export default AccessibilityChecker;
