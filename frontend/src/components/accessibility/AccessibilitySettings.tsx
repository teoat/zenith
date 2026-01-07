import React from "react";
import { Settings, Eye, Type, Zap } from "lucide-react";
import { useAccessibility } from "@/context/AccessibilityContext";
import { AccessibleButton } from "@/components/ui/AccessibleButton";

interface AccessibilitySettingsProps {
  onClose?: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  onClose,
}) => {
  const {
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    fontSize,
    setFontSize,
  } = useAccessibility();

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
          Accessibility Settings
        </h2>
      </div>

      <div className="space-y-6">
        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <div>
              <h3 className="font-medium text-slate-800 dark:text-white">
                High Contrast
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Increase contrast for better visibility
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <span className="sr-only">Enable high contrast mode</span>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              aria-describedby="high-contrast-description"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <div>
              <h3 className="font-medium text-slate-800 dark:text-white">
                Reduced Motion
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Minimize animations and transitions
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <span className="sr-only">Enable reduced motion</span>
            <input
              type="checkbox"
              className="sr-only peer"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              aria-describedby="reduced-motion-description"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Type className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="font-medium text-slate-800 dark:text-white">
              Font Size
            </h3>
          </div>
          <div className="flex gap-2">
            {[
              { value: "small" as const, label: "Small" },
              { value: "medium" as const, label: "Medium" },
              { value: "large" as const, label: "Large" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFontSize(option.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  fontSize === option.value
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                aria-pressed={fontSize === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <h3 className="font-medium text-slate-800 dark:text-white mb-2">
            Keyboard Navigation
          </h3>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <div>
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                Tab
              </kbd>{" "}
              - Navigate between elements
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                Enter
              </kbd>{" "}
              /{" "}
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                Space
              </kbd>{" "}
              - Activate buttons
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                Escape
              </kbd>{" "}
              - Close dialogs
            </div>
          </div>
        </div>
      </div>

      {onClose && (
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <AccessibleButton onClick={onClose} variant="secondary">
            Close
          </AccessibleButton>
        </div>
      )}
    </div>
  );
};
